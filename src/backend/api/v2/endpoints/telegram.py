"""
Telegram Bot API endpoints for FoodSave AI.

This module provides REST API endpoints for Telegram Bot integration,
including webhook handling, webhook configuration, and message sending.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import logging
from typing import Dict, Any
import httpx

from backend.integrations.telegram_bot import telegram_bot_handler
from backend.settings import settings

router = APIRouter(tags=["Telegram Bot"])
logger = logging.getLogger(__name__)


@router.post("/webhook")
async def telegram_webhook(request: Request) -> JSONResponse:
    """Webhook endpoint dla Telegram Bot API.

    Args:
        request: FastAPI request object

    Returns:
        JSONResponse z statusem przetwarzania

    Raises:
        HTTPException: W przypadku błędu walidacji lub przetwarzania
    """
    try:
        # Sprawdź secret token
        if request.headers.get("X-Telegram-Bot-Api-Secret-Token") != settings.TELEGRAM_WEBHOOK_SECRET:
            raise HTTPException(status_code=403, detail="Invalid webhook secret")

        # Pobierz dane webhook
        update_data = await request.json()

        # Przetwórz update
        result = await telegram_bot_handler.process_webhook(update_data)

        logger.info(
            "Telegram webhook processed",
            extra={
                "update_id": update_data.get("update_id"),
                "result_status": result.get("status"),
                "telegram_event": "webhook_processed"
            }
        )

        return JSONResponse(content={"status": "ok"})

    except Exception as e:
        logger.error(f"Telegram webhook error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/set-webhook")
async def set_webhook(webhook_url: str) -> JSONResponse:
    """Ustawia webhook URL dla bota.

    Args:
        webhook_url: URL webhook do ustawienia

    Returns:
        JSONResponse z wynikiem ustawienia webhook

    Raises:
        HTTPException: W przypadku błędu komunikacji z Telegram API
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/setWebhook",
                json={
                    "url": webhook_url,
                    "secret_token": settings.TELEGRAM_WEBHOOK_SECRET,
                    "allowed_updates": ["message", "callback_query"]
                }
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("ok"):
                    logger.info(f"Webhook set successfully: {webhook_url}")
                    return JSONResponse(content={"status": "success", "webhook_url": webhook_url})
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Telegram API error: {result.get('description')}"
                    )
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to set webhook")

    except Exception as e:
        logger.error(f"Error setting webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/webhook-info")
async def get_webhook_info() -> JSONResponse:
    """Pobiera informacje o aktualnym webhook.

    Returns:
        JSONResponse z informacjami o webhook

    Raises:
        HTTPException: W przypadku błędu komunikacji z Telegram API
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/getWebhookInfo"
            )

            if response.status_code == 200:
                return JSONResponse(content=response.json())
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to get webhook info")

    except Exception as e:
        logger.error(f"Error getting webhook info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-message")
async def send_telegram_message(chat_id: int, message: str) -> JSONResponse:
    """Wysyła wiadomość przez Telegram Bot API.

    Args:
        chat_id: ID czatu Telegram
        message: Tekst wiadomości

    Returns:
        JSONResponse z wynikiem wysłania wiadomości

    Raises:
        HTTPException: W przypadku błędu wysłania wiadomości
    """
    try:
        success = await telegram_bot_handler._send_message(chat_id, message)

        if success:
            return JSONResponse(content={"status": "success", "message": "Message sent"})
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")

    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-connection")
async def test_telegram_connection() -> JSONResponse:
    """Testuje połączenie z Telegram Bot API.

    Returns:
        JSONResponse z informacjami o bot

    Raises:
        HTTPException: W przypadku błędu komunikacji z Telegram API
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/getMe"
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("ok"):
                    bot_info = result.get("result", {})
                    logger.info(f"Telegram bot connection test successful: {bot_info}")
                    return JSONResponse(content={
                        "status": "success",
                        "bot_info": bot_info
                    })
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Telegram API error: {result.get('description')}"
                    )
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to test connection")

    except Exception as e:
        logger.error(f"Error testing Telegram connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings")
async def get_telegram_settings() -> JSONResponse:
    """Pobiera ustawienia Telegram Bot.

    Returns:
        JSONResponse z ustawieniami bota
    """
    try:
        settings_data = {
            "enabled": bool(settings.TELEGRAM_BOT_TOKEN),
            "botToken": settings.TELEGRAM_BOT_TOKEN,
            "botUsername": settings.TELEGRAM_BOT_USERNAME,
            "webhookUrl": settings.TELEGRAM_WEBHOOK_URL,
            "webhookSecret": settings.TELEGRAM_WEBHOOK_SECRET,
            "maxMessageLength": settings.TELEGRAM_MAX_MESSAGE_LENGTH,
            "rateLimitPerMinute": settings.TELEGRAM_RATE_LIMIT_PER_MINUTE,
        }

        return JSONResponse(content={"status": "success", "data": settings_data})

    except Exception as e:
        logger.error(f"Error getting Telegram settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings")
async def update_telegram_settings(settings_data: Dict[str, Any]) -> JSONResponse:
    """Aktualizuje ustawienia Telegram Bot.

    Args:
        settings_data: Nowe ustawienia bota

    Returns:
        JSONResponse z zaktualizowanymi ustawieniami

    Raises:
        HTTPException: W przypadku błędu aktualizacji ustawień
    """
    try:
        # W rzeczywistej implementacji tutaj byłaby logika zapisywania ustawień
        # do bazy danych lub pliku konfiguracyjnego
        logger.info(f"Telegram settings update requested: {settings_data}")

        # Zwróć zaktualizowane ustawienia
        updated_settings = {
            "enabled": settings_data.get("enabled", False),
            "botToken": settings_data.get("botToken", ""),
            "botUsername": settings_data.get("botUsername", ""),
            "webhookUrl": settings_data.get("webhookUrl", ""),
            "webhookSecret": settings_data.get("webhookSecret", ""),
            "maxMessageLength": settings_data.get("maxMessageLength", 4096),
            "rateLimitPerMinute": settings_data.get("rateLimitPerMinute", 30),
        }

        return JSONResponse(content={"status": "success", "data": updated_settings})

    except Exception as e:
        logger.error(f"Error updating Telegram settings: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 