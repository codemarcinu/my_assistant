"""
Telegram Bot Integration for FoodSave AI.

This module provides integration with Telegram Bot API, allowing users
to interact with the AI assistant directly through Telegram.
"""

from typing import Dict, Any, Optional
import logging
import asyncio
from datetime import datetime
import httpx
from fastapi import HTTPException
from pydantic import BaseModel

from backend.core.hybrid_llm_client import hybrid_llm_client
from backend.core.rag_integration import rag_integration
from backend.infrastructure.database.database import get_db
from backend.models.conversation import Conversation
from backend.config import settings

logger = logging.getLogger(__name__)


class TelegramUpdate(BaseModel):
    """Model dla webhook updates z Telegram."""
    update_id: int
    message: Optional[Dict[str, Any]] = None
    callback_query: Optional[Dict[str, Any]] = None


class TelegramMessage(BaseModel):
    """Model dla wiadomości Telegram."""
    message_id: int
    from_user: Dict[str, Any]
    chat: Dict[str, Any]
    text: Optional[str] = None
    date: int


class TelegramBotHandler:
    """Handler dla integracji z Telegram Bot API."""

    def __init__(self) -> None:
        """Inicjalizuje handler Telegram Bot."""
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.api_base_url = f"https://api.telegram.org/bot{self.bot_token}"
        self.rate_limiter: Dict[int, datetime] = {}  # Simple rate limiting

    async def process_webhook(self, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Przetwarza webhook update z Telegram.

        Args:
            update_data: Dane webhook z Telegram API

        Returns:
            Dict z wynikiem przetwarzania

        Raises:
            Exception: W przypadku błędu przetwarzania
        """
        try:
            update = TelegramUpdate(**update_data)

            if update.message:
                return await self._handle_message(update.message)
            elif update.callback_query:
                return await self._handle_callback_query(update.callback_query)
            else:
                logger.warning(f"Unknown update type: {update_data}")
                return {"status": "ignored", "reason": "unknown_update_type"}

        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            return {"status": "error", "error": str(e)}

    async def _handle_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Obsługuje wiadomości tekstowe.

        Args:
            message_data: Dane wiadomości z Telegram

        Returns:
            Dict z wynikiem obsługi wiadomości
        """
        try:
            message = TelegramMessage(**message_data)
            user_id = message.from_user["id"]
            chat_id = message.chat["id"]
            text = message.text

            if not text:
                return {"status": "ignored", "reason": "no_text"}

            # Rate limiting
            if not self._check_rate_limit(user_id):
                await self._send_message(chat_id, "⚠️ Zbyt wiele wiadomości. Spróbuj za chwilę.")
                return {"status": "rate_limited"}

            # Przetwarzanie przez AI
            ai_response = await self._process_with_ai(text, user_id)

            # Wysłanie odpowiedzi
            await self._send_message(chat_id, ai_response)

            # Zapisanie do bazy danych
            await self._save_conversation(user_id, text, ai_response)

            return {
                "status": "success",
                "user_id": user_id,
                "response_length": len(ai_response)
            }

        except Exception as e:
            logger.error(f"Error handling message: {e}")
            return {"status": "error", "error": str(e)}

    async def _process_with_ai(self, user_message: str, user_id: int) -> str:
        """Przetwarza wiadomość przez AI.

        Args:
            user_message: Wiadomość użytkownika
            user_id: ID użytkownika Telegram

        Returns:
            Odpowiedź AI jako string
        """
        try:
            # Użyj istniejącego orchestrator
            from backend.agents.orchestrator_factory import create_orchestrator
            from backend.infrastructure.database.database import get_db

            async for db in get_db():
                orchestrator = create_orchestrator(db)

                # Przetwórz zapytanie
                response = await orchestrator.process_query(
                    query=user_message,
                    session_id=f"telegram_{user_id}",
                )

                if response.success:
                    return response.text or "Przepraszam, nie udało się przetworzyć zapytania."
                else:
                    return f"❌ Błąd: {response.error or 'Nieznany błąd'}"

        except Exception as e:
            logger.error(f"AI processing error: {e}")
            return "❌ Przepraszam, wystąpił błąd podczas przetwarzania zapytania."

    async def _send_message(self, chat_id: int, text: str) -> bool:
        """Wysyła wiadomość przez Telegram Bot API.

        Args:
            chat_id: ID czatu Telegram
            text: Tekst wiadomości

        Returns:
            True jeśli wiadomość została wysłana pomyślnie
        """
        try:
            # Podziel długie wiadomości
            if len(text) > settings.TELEGRAM_MAX_MESSAGE_LENGTH:
                chunks = self._split_message(text)
                for chunk in chunks:
                    await self._send_single_message(chat_id, chunk)
                    await asyncio.sleep(0.1)  # Rate limiting
            else:
                await self._send_single_message(chat_id, text)

            return True

        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return False

    async def _send_single_message(self, chat_id: int, text: str) -> None:
        """Wysyła pojedynczą wiadomość.

        Args:
            chat_id: ID czatu Telegram
            text: Tekst wiadomości
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base_url}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML"
                },
                timeout=10.0
            )

            if response.status_code != 200:
                logger.error(f"Telegram API error: {response.status_code} - {response.text}")

    def _split_message(self, text: str, max_length: int = 4000) -> list[str]:
        """Dzieli długie wiadomości na części.

        Args:
            text: Tekst do podziału
            max_length: Maksymalna długość części

        Returns:
            Lista części wiadomości
        """
        if len(text) <= max_length:
            return [text]

        chunks = []
        current_chunk = ""

        for line in text.split('\n'):
            if len(current_chunk) + len(line) + 1 <= max_length:
                current_chunk += line + '\n'
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = line + '\n'

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def _check_rate_limit(self, user_id: int) -> bool:
        """Sprawdza rate limiting dla użytkownika.

        Args:
            user_id: ID użytkownika Telegram

        Returns:
            True jeśli użytkownik nie przekroczył limitu
        """
        now = datetime.now()
        if user_id in self.rate_limiter:
            last_message_time = self.rate_limiter[user_id]
            if (now - last_message_time).seconds < 60 / settings.TELEGRAM_RATE_LIMIT_PER_MINUTE:
                return False

        self.rate_limiter[user_id] = now
        return True

    async def _save_conversation(self, user_id: int, user_message: str, ai_response: str) -> None:
        """Zapisuje konwersację do bazy danych.

        Args:
            user_id: ID użytkownika Telegram
            user_message: Wiadomość użytkownika
            ai_response: Odpowiedź AI
        """
        try:
            async for db in get_db():
                conversation = Conversation(
                    user_id=f"telegram_{user_id}",
                    user_message=user_message,
                    assistant_response=ai_response,
                    session_id=f"telegram_{user_id}",
                    intent_type="telegram_chat",
                    created_at=datetime.now()
                )

                db.add(conversation)
                await db.commit()

        except Exception as e:
            import traceback
            logger.error(f"Error saving conversation: {e}\n{traceback.format_exc()}")

    async def _handle_callback_query(self, callback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Obsługuje callback queries z Telegram.

        Args:
            callback_data: Dane callback query

        Returns:
            Dict z wynikiem obsługi callback
        """
        try:
            # Implementacja obsługi callback queries
            logger.info(f"Received callback query: {callback_data}")
            return {"status": "success", "type": "callback_query"}

        except Exception as e:
            logger.error(f"Error handling callback query: {e}")
            return {"status": "error", "error": str(e)}


# Global instance
telegram_bot_handler = TelegramBotHandler() 