from fastapi import APIRouter

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/ping")
async def ping():
    """Simple ping endpoint for chat module."""
    return {"message": "pong"} 