from fastapi import APIRouter, status, UploadFile, File, Body, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Message content")
    context: Optional[dict] = None

@router.post("/chat")
async def chat_stub(request: ChatRequest = Body(...)):
    """Stub: Zwraca przykładową odpowiedź chat zgodną ze schematem kontraktowym"""
    if not request.message.strip():
        raise HTTPException(status_code=422, detail="Message cannot be empty")
    
    return {
        "response": "Stub chat response",
        "success": True,
        "metadata": {},
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/users")
async def users_stub():
    """Stub: Zwraca przykładową listę użytkowników"""
    return [
        {"id": 1, "username": "user1", "email": "user1@example.com"},
        {"id": 2, "username": "user2", "email": "user2@example.com"}
    ]

@router.get("/users/me")
async def users_me_stub():
    """Stub: Zwraca przykładowego zalogowanego użytkownika"""
    # Symulacja braku autoryzacji
    raise HTTPException(status_code=401, detail="Authentication required")

@router.post("/receipts/upload")
async def receipts_upload_stub(file: UploadFile = File(...)):
    """Stub: Zwraca przykładową odpowiedź uploadu paragonu"""
    # Symulacja braku autoryzacji
    raise HTTPException(status_code=401, detail="Authentication required") 