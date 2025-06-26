from __future__ import annotations

import os
import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict

# Set User-Agent environment variable early to prevent warnings
os.environ.setdefault(
    "USER_AGENT", "FoodSave-AI/1.0.0 (https://github.com/foodsave-ai)"
)


class Settings(BaseSettings):
    """
    Główna klasa do zarządzania ustawieniami aplikacji.
    Ustawienia są wczytywane ze zmiennych środowiskowych lub pliku .env.
    """

    APP_NAME: str = "Osobisty Asystent AI"
    APP_VERSION: str = "0.1.0"

    # Environment configuration
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    TELEMETRY_ENABLED: bool = False

    # User Agent for HTTP requests
    USER_AGENT: str = "FoodSave-AI/1.0.0 (https://github.com/foodsave-ai)"

    # JWT Configuration
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6380
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    REDIS_USE_CACHE: bool = True

    # Konfiguracja dla klienta Ollama
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Modele językowe - z fallback na działające modele
    OLLAMA_MODEL: str = "gemma3:12b"  # Główny model
    DEFAULT_CODE_MODEL: str = "gemma3:12b"  # Model do kodu
    DEFAULT_CHAT_MODEL: str = "gemma3:12b"  # Model do ogólnej konwersacji
    DEFAULT_EMBEDDING_MODEL: str = "nomic-embed-text"  # Model do embeddingów

    # Lista dostępnych modeli (w kolejności preferencji)
    AVAILABLE_MODELS: list = [
        "gemma3:12b",  # Główny model
        "mistral:7b",  # Fallback model
        "llama3.2:3b",  # Dodatkowy fallback
        "SpeakLeash/bielik-1.5b-v3.0-instruct:FP16",  # Polski model
    ]

    # Konfiguracja dla modelu MMLW (opcjonalny, lepszy dla języka polskiego)
    USE_MMLW_EMBEDDINGS: bool = True  # Automatycznie włączone
    MMLW_MODEL_NAME: str = "sdadas/mmlw-retrieval-roberta-base"

    # Konfiguracja bazy danych
    DATABASE_URL: str = "sqlite+aiosqlite:///./foodsave_dev.db"

    # CORS Configuration
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000"
    )

    # API keys for external services
    LLM_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""
    PERPLEXITY_API_KEY: str = ""

    # Konfiguracja Tesseract OCR
    TESSDATA_PREFIX: str = "/usr/share/tesseract-ocr/5/"

    # Telegram Bot Configuration
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBHOOK_URL: str = ""
    TELEGRAM_WEBHOOK_SECRET: str = secrets.token_urlsafe(32)
    
    # Telegram Bot Settings
    TELEGRAM_BOT_USERNAME: str = "foodsave_ai_bot"
    TELEGRAM_BOT_NAME: str = "FoodSave AI Assistant"
    TELEGRAM_MAX_MESSAGE_LENGTH: int = 4096
    TELEGRAM_RATE_LIMIT_PER_MINUTE: int = 30

    # Ta linia mówi Pydantic, aby wczytał zmienne z pliku .env w głównym katalogu
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


# Tworzymy jedną, globalną instancję ustawień,
# której będziemy używać w całej aplikacji.
settings = Settings()
