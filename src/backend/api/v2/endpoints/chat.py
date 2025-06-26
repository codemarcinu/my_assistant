"""
Chat endpoints for API v2
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, cast, Generator
import inspect

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.async_patterns import (CircuitBreakerConfig, timeout_context,
                                         with_backpressure,
                                         with_circuit_breaker)
from backend.core.llm_client import llm_client
from backend.core.database_optimizer import DatabaseOptimizer
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


async def chat_response_generator(prompt: str, model: str) -> AsyncGenerator[str, None]:
    """
    Asynchroniczny generator streamujący odpowiedzi LLM z timeout i lepszą obsługą błędów.
    """
    try:
        # Timeout dla całego procesu generowania
        async with timeout_context(30.0):  # 30 sekund timeout
            async for chunk in llm_client.generate_stream_from_prompt_async(
                model=model, prompt=prompt, system_prompt=""
            ):
                if not isinstance(chunk, dict):
                    continue
                chunk_dict = cast(Dict[str, Any], chunk)
                
                # Obsługa błędów z LLM client
                if "error" in chunk_dict:
                    logger.error(f"LLM client error: {chunk_dict['error']}")
                    error_response = {
                        "type": "error",
                        "content": f"Przepraszam, wystąpił błąd: {chunk_dict['error']}",
                        "timestamp": datetime.now().isoformat()
                    }
                    yield f"data: {json.dumps(error_response, ensure_ascii=False)}\n\n"
                    return
                
                if "response" in chunk_dict:
                    # Formatowanie jako Server-Sent Events (SSE)
                    response_data = {
                        "type": "chunk",
                        "content": chunk_dict["response"],
                        "timestamp": datetime.now().isoformat()
                    }
                    yield f"data: {json.dumps(response_data, ensure_ascii=False)}\n\n"
                    
    except asyncio.TimeoutError:
        logger.error(f"Timeout in chat response generator for model: {model}")
        timeout_response = {
            "type": "error",
            "content": "Przepraszam, odpowiedź trwała zbyt długo. Spróbuj ponownie.",
            "timestamp": datetime.now().isoformat()
        }
        yield f"data: {json.dumps(timeout_response, ensure_ascii=False)}\n\n"
    except Exception as e:
        logger.error(f"Error in chat response generator: {e}")
        error_response = {
            "type": "error",
            "content": f"Przepraszam, wystąpił błąd podczas przetwarzania odpowiedzi: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        yield f"data: {json.dumps(error_response, ensure_ascii=False)}\n\n"
    finally:
        # End of stream marker
        end_response = {
            "type": "end",
            "content": "",
            "timestamp": datetime.now().isoformat()
        }
        yield f"data: {json.dumps(end_response, ensure_ascii=False)}\n\n"


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
    """Streaming chat endpoint for API v2 z optymalizacją wydajności"""
    try:
        body = await request.json()
        prompt = body.get("message", "")
        
        # Walidacja prompt
        if not prompt or prompt.strip() == "":
            error_response = {
                "type": "error",
                "content": "Message cannot be empty or null",
                "timestamp": datetime.now().isoformat()
            }
            return StreamingResponse(
                iter([f"data: {json.dumps(error_response, ensure_ascii=False)}\n\n"]),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Cache-Control"
                }
            )
        
        model = body.get("model") or get_selected_model()
        
        logger.info(f"Starting streaming chat with model: {model}, prompt length: {len(prompt)}")
        
        return StreamingResponse(
            chat_response_generator(prompt, model), 
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control",
                "X-Content-Type-Options": "nosniff"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in streaming chat endpoint: {e}")
        error_response = {
            "type": "error",
            "content": f"Internal server error: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        return StreamingResponse(
            iter([f"data: {json.dumps(error_response, ensure_ascii=False)}\n\n"]),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
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


@router.get("/memory_chat")
async def get_chat_history(
    session_id: str = "default",
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Get chat history for a session z optymalizacją bazy danych"""
    try:
        # Użyj DatabaseOptimizer dla optymalizacji zapytań
        db_optimizer = DatabaseOptimizer(db)
        
        # Pobierz konwersacje z optymalizacją
        conversations = await db_optimizer.get_conversations_with_messages(
            session_id=session_id,
            limit=limit,
            offset=offset
        )
        
        # Jeśli nie ma konwersacji w bazie, spróbuj z memory manager
        if not conversations:
            orchestrator = await orchestrator_pool.get_healthy_orchestrator()
            if orchestrator:
                context = await orchestrator.memory_manager.get_context(session_id)
                
                # Extract chat history from context
                history = []
                if hasattr(context, 'history') and context.history:
                    # Take last 'limit' items
                    recent_history = context.history[-limit:] if limit > 0 else context.history
                    
                    for i, entry in enumerate(recent_history):
                        if isinstance(entry, dict) and 'data' in entry:
                            data = entry['data']
                            if isinstance(data, dict):
                                # Extract message content from various possible formats
                                content = data.get('message') or data.get('content') or data.get('text', '')
                                role = data.get('role') or data.get('type', 'user')
                                
                                history.append({
                                    "id": f"history-{i}",
                                    "content": content,
                                    "type": role,
                                    "timestamp": entry.get('timestamp', datetime.now().isoformat()),
                                    "metadata": data
                                })
                
                return {
                    "success": True,
                    "data": history,
                    "session_id": session_id,
                    "total_count": len(history),
                    "source": "memory_manager"
                }
        
        # Konwertuj konwersacje do formatu historii
        history = []
        for conv in conversations:
            for msg in conv.get("messages", []):
                history.append({
                    "id": msg["id"],
                    "content": msg["content"],
                    "type": msg["role"],
                    "timestamp": msg["timestamp"],
                    "metadata": {"conversation_id": conv["id"]}
                })
        
        return {
            "success": True,
            "data": history,
            "session_id": session_id,
            "total_count": len(history),
            "source": "database_optimized"
        }
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": []
        }


@router.delete("/memory_chat")
async def clear_chat_history(
    session_id: str = "default",
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Clear chat history for a session"""
    try:
        # Get orchestrator to access memory manager
        orchestrator = await orchestrator_pool.get_healthy_orchestrator()
        if not orchestrator:
            return {
                "success": False,
                "error": "No healthy orchestrator available"
            }
        
        # Clear context from memory manager
        await orchestrator.memory_manager.clear_context(session_id)
        
        return {
            "success": True,
            "message": f"Chat history cleared for session: {session_id}"
        }
        
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/performance/stats")
async def get_performance_stats(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Get performance statistics and cache info"""
    try:
        db_optimizer = DatabaseOptimizer(db)
        
        # Pobierz statystyki bazy danych
        db_stats = await db_optimizer.get_statistics()
        
        # Pobierz statystyki cache'owania
        from backend.core.search_cache import search_cache
        from backend.core.optimized_prompts import get_cache_stats
        
        cache_stats = {
            "search_cache": search_cache.get_stats(),
            "prompt_cache": get_cache_stats()
        }
        
        # Pobierz statystyki orchestrator pool
        orchestrator_stats = {
            "pool_size": orchestrator_pool.pool_size if hasattr(orchestrator_pool, 'pool_size') else 0,
            "healthy_count": len(await orchestrator_pool.get_all_healthy_orchestrators()) if hasattr(orchestrator_pool, 'get_all_healthy_orchestrators') else 0
        }
        
        return {
            "success": True,
            "database_stats": db_stats,
            "cache_stats": cache_stats,
            "orchestrator_stats": orchestrator_stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting performance stats: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@router.post("/performance/cleanup")
async def cleanup_old_data(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Clean up old data for performance optimization"""
    try:
        db_optimizer = DatabaseOptimizer(db)
        
        # Wyczyść stare dane z bazy
        cleanup_stats = await db_optimizer.cleanup_old_data(days=days)
        
        # Wyczyść wygasłe wpisy z cache
        from backend.core.search_cache import search_cache
        expired_cache_entries = search_cache.clear_expired()
        
        return {
            "success": True,
            "database_cleanup": cleanup_stats,
            "cache_cleanup": {"expired_entries": expired_cache_entries},
            "message": f"Cleaned up data older than {days} days"
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up old data: {e}")
        return {
            "success": False,
            "error": str(e)
        } 