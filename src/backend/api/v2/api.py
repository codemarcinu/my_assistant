from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware

from backend.api.v2.endpoints import backup, rag, receipts, telegram, chat, weather
from backend.api.v2.endpoints.concise_responses import router as concise_responses_router
from backend.api.v2.endpoints import router as stub_router
from backend.api.v2.endpoints import security
from backend.api.v2.endpoints import enhanced_backup

api_router = APIRouter()

api_router.include_router(backup.router, prefix="/backup", tags=["backup"])
api_router.include_router(rag.router, tags=["rag"])
api_router.include_router(receipts.router, tags=["receipts"])
api_router.include_router(weather.router, tags=["weather"])
api_router.include_router(concise_responses_router, prefix="/concise-responses", tags=["concise-responses"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["Telegram Bot"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(stub_router, tags=["stubs"])
api_router.include_router(security.router, tags=["Security Management"])
api_router.include_router(enhanced_backup.router, tags=["Enhanced Backup Management"])

def add_cors_middleware(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ) 