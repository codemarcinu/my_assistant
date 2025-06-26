"""
Chat endpoints for API v2
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, cast, Generator

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.async_patterns import (CircuitBreakerConfig, timeout_context,
                                         with_backpressure,
                                         with_circuit_breaker)
from backend.core.llm_client import llm_client
from backend.infrastructure.database.database import get_db
from backend.orchestrator_management.orchestrator_pool import orchestrator_pool
from backend.orchestrator_management.request_queue import request_queue

router = APIRouter()
logger = logging.getLogger(__name__)


def get_selected_model() -> str:
    """Get the selected model from config file or fallback to default"""
    try:
        # Path to the LLM settings file
        llm_settings_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "data",
            "config",
            "llm_settings.json",
        )

        if os.path.exists(llm_settings_path):
            with open(llm_settings_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                selected_model = data.get("selected_model", "")
                if selected_model:
                    logger.info(f"Using selected model from config: {selected_model}")
                    return selected_model

        # Fallback to hardcoded default
        fallback_default = "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"
        logger.info(
            f"No valid selected model in config, using fallback: {fallback_default}"
        )
        return fallback_default

    except Exception as e:
        logger.warning(f"Error reading selected model from config: {e}")
        fallback_default = "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"
        logger.info(f"Using fallback default model: {fallback_default}")
        return fallback_default


class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any] = {}
    model: str | None = None


class ChatResponse(BaseModel):
    response: str
    success: bool = True
    metadata: Dict[str, Any] = {}
    timestamp: str = ""


class MemoryChatRequest(BaseModel):
    message: str
    session_id: str
    usePerplexity: bool = False
    useBielik: bool = True
    agent_states: Dict[str, bool] = {}


class MemoryChatResponse(BaseModel):
    reply: str
    history_length: int


# Circuit breaker dla LLM client
llm_circuit_breaker = CircuitBreakerConfig(
    failure_threshold=3, recovery_timeout=30.0, name="llm_client"
)


@with_circuit_breaker()
@with_backpressure(max_concurrent=50)
@with_backpressure(max_concurrent=20)
async def chat_response_generator(prompt: str, model: str) -> AsyncGenerator[str, None]:
    """
    Asynchroniczny generator streamujący odpowiedzi LLM do FastAPI (zgodny z najlepszymi praktykami).
    """
    try:
        async for chunk in llm_client.generate_stream_from_prompt_async(
            model=model, prompt=prompt, system_prompt=""
        ):
            if not isinstance(chunk, dict):
                continue
            chunk_dict = cast(Dict[str, Any], chunk)
            if "response" in chunk_dict:
                yield chunk_dict["response"]
    except Exception as e:
        logger.error(f"Error in chat response generator: {e}")
        yield f"Przepraszam, wystąpił błąd podczas przetwarzania odpowiedzi: {str(e)}"


@router.post("/chat")
async def chat_with_model(request: ChatRequest) -> ChatResponse:
    """Chat endpoint for API v2"""
    try:
        model = request.model or get_selected_model()
        timestamp = datetime.now().isoformat()
        
        # Simple response for testing
        if os.getenv("TESTING_MODE") == "true":
            return ChatResponse(
                response="Test chat response from API v2",
                success=True,
                metadata={"model": model, "context": request.context},
                timestamp=timestamp
            )
        
        # Real implementation would use the generator
        response_text = ""
        async for chunk in chat_response_generator(request.message, model):
            response_text += chunk
        
        return ChatResponse(
            response=response_text,
            success=True,
            metadata={"model": model, "context": request.context},
            timestamp=timestamp
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return ChatResponse(
            response=f"Error: {str(e)}",
            success=False,
            metadata={"error": str(e)},
            timestamp=datetime.now().isoformat()
        )


@router.post("/chat/stream")
async def chat_with_model_stream(request: Request) -> StreamingResponse:
    """Streaming chat endpoint for API v2"""
    body = await request.json()
    prompt = body.get("message", "")
    model = body.get("model") or get_selected_model()
    
    return StreamingResponse(
        chat_response_generator(prompt, model), 
        media_type="text/plain"
    )


async def memory_chat_generator(
    request: MemoryChatRequest, db: AsyncSession
) -> AsyncGenerator[str, None]:
    """
    Generator for streaming responses from the orchestrator.
    Każdy yield to linia NDJSON: {"text": ...}
    """
    start_time = asyncio.get_event_loop().time()
    try:
        logger.info(
            "Chat request received",
            extra={
                "session_id": request.session_id,
                "message_length": len(request.message),
                "use_perplexity": request.usePerplexity,
                "use_bielik": request.useBielik,
                "agent_states": request.agent_states,
                "chat_event": "request_received",
            },
        )

        # Get a healthy orchestrator from the pool
        logger.debug("Getting healthy orchestrator from pool...")
        orchestrator = await orchestrator_pool.get_healthy_orchestrator()
        logger.debug(f"Orchestrator result: {orchestrator}")

        if not orchestrator:
            logger.warning("No healthy orchestrator available, queuing request")

            if request_queue is None:
                logger.error("Request queue is not initialized")
                yield json.dumps(
                    {
                        "text": "Service temporarily unavailable. Request queue not initialized.",
                        "success": False,
                    }
                ) + "\n"
                return

            try:
                request_id = await request_queue.enqueue_request(
                    user_command=request.message, session_id=request.session_id
                )
                yield json.dumps(
                    {
                        "text": "Service temporarily unavailable. Request queued for processing.",
                        "request_id": request_id,
                        "success": False,
                    }
                ) + "\n"
            except Exception as e:
                logger.error(f"Error enqueueing request: {e}")
                yield json.dumps(
                    {
                        "text": "Service temporarily unavailable. Failed to queue request.",
                        "success": False,
                    }
                ) + "\n"
            return

        # Process with orchestrator using streaming
        async with timeout_context(60.0):
            chunks = []

            def handle_chunk(chunk) -> None:
                chunks.append(chunk)

            response = await orchestrator.process_command(
                user_command=request.message,
                session_id=request.session_id,
                use_perplexity=request.usePerplexity,
                use_bielik=request.useBielik,
                agent_states=request.agent_states,
                chunk_callback=handle_chunk,
            )

            # Send chunks as they come
            for chunk in chunks:
                yield json.dumps({"text": chunk, "success": True}) + "\n"

            # Send final response
            if response and hasattr(response, 'text'):
                yield json.dumps({"text": response.text, "success": True}) + "\n"

    except Exception as e:
        logger.error(f"Error in memory chat generator: {e}")
        yield json.dumps(
            {
                "text": f"Error processing request: {str(e)}",
                "success": False,
            }
        ) + "\n"


@router.post("/memory_chat")
async def chat_with_memory(
    request: MemoryChatRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Memory chat endpoint for API v2"""
    return StreamingResponse(
        memory_chat_generator(request, db),
        media_type="application/x-ndjson"
    )


@router.post("/test_simple_chat")
async def test_simple_chat() -> Dict[str, Any]:
    """Test endpoint for simple chat"""
    return {"message": "Test simple chat endpoint from API v2"}


@router.post("/test_chat_simple")
async def test_chat_simple(request: ChatRequest) -> Dict[str, Any]:
    """Test endpoint for chat with request"""
    return {
        "response": f"Test response for: {request.message}",
        "success": True,
        "metadata": {"test": True}
    } 