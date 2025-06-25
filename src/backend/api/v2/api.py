from fastapi import APIRouter

from .endpoints import backup, rag, receipts
from .endpoints.concise_responses import router as concise_responses_router

api_router = APIRouter()

api_router.include_router(backup.router, prefix="/backup", tags=["backup"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
api_router.include_router(concise_responses_router, prefix="/concise", tags=["concise-responses"]) 