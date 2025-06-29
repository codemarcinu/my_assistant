from __future__ import annotations

import os
import secrets
from typing import List, Optional

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

    # Security Configuration
    SECURITY_ENCRYPTION_KEY: str = secrets.token_urlsafe(32)
    SECURITY_KEY_SALT: str = secrets.token_urlsafe(16)
    SECURITY_MAX_REQUESTS_PER_MINUTE: int = 60
    SECURITY_MAX_REQUESTS_PER_HOUR: int = 1000
    SECURITY_MAX_LOGIN_ATTEMPTS: int = 5
    SECURITY_LOCKOUT_DURATION: int = 15
    SECURITY_MIN_PASSWORD_LENGTH: int = 12
    SECURITY_REQUIRE_UPPERCASE: bool = True
    SECURITY_REQUIRE_LOWERCASE: bool = True
    SECURITY_REQUIRE_DIGITS: bool = True
    SECURITY_REQUIRE_SPECIAL: bool = True
    SECURITY_PASSWORD_HISTORY: int = 5
    SECURITY_SESSION_TIMEOUT: int = 30
    SECURITY_MAX_SESSIONS: int = 3
    SECURITY_MAX_INPUT_LENGTH: int = 10000
    SECURITY_MAX_FILE_SIZE_MB: int = 10
    SECURITY_AUDIT_LOG_ENABLED: bool = True
    SECURITY_AUDIT_LOG_PATH: str = os.getenv("SECURITY_AUDIT_LOG_PATH", "./logs/security_audit.log")

    # Enhanced Backup Configuration
    BACKUP_LOCAL_DIR: str = os.getenv("BACKUP_LOCAL_DIR", "./backups")
    CLOUD_BACKUP_ENABLED: bool = False
    CLOUD_PROVIDER: str = "aws"
    CLOUD_BUCKET: Optional[str] = None
    CLOUD_REGION: str = "us-east-1"
    BACKUP_ENCRYPTION_ENABLED: bool = True
    BACKUP_ENCRYPTION_KEY: Optional[str] = None
    BACKUP_DAILY_RETENTION: int = 7
    BACKUP_WEEKLY_RETENTION: int = 4
    BACKUP_MONTHLY_RETENTION: int = 12
    BACKUP_YEARLY_RETENTION: int = 5
    AUTO_BACKUP_ENABLED: bool = True
    BACKUP_SCHEDULE_HOUR: int = 2
    BACKUP_SCHEDULE_MINUTE: int = 0
    BACKUP_VERIFY_ENABLED: bool = True
    BACKUP_CHECKSUM_VERIFICATION: bool = True
    BACKUP_COMPRESSION_LEVEL: int = 6
    BACKUP_COMPRESSION_TYPE: str = "gzip"

    # AWS Configuration (for cloud backups)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_DEFAULT_REGION: str = "us-east-1"
    AWS_S3_BUCKET: Optional[str] = None
    AWS_S3_ENDPOINT_URL: Optional[str] = None  # For custom S3-compatible storage

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
    OLLAMA_MODEL: str = "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"  # Główny model (polski + angielski)
    DEFAULT_CODE_MODEL: str = "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"  # Model do kodu
    DEFAULT_CHAT_MODEL: str = "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"  # Model do ogólnej konwersacji
    DEFAULT_MODEL: str = "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"  # Model domyślny dla planisty
    DEFAULT_EMBEDDING_MODEL: str = "nomic-embed-text"  # Model do embeddingów

    # Lista dostępnych modeli (w kolejności preferencji)
    AVAILABLE_MODELS: List[str] = [
        "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0",  # Główny model (polski + angielski)
        "SpeakLeash/bielik-11b-v2.3-instruct:Q5_K_M",  # Model zapasowy dla złożonych zadań
        "gemma3:12b",  # Model multimodalny (dla zadań z obrazami)
        "gemma3:8b",  # Lżejszy model
        "llama3.2:3b",  # Bardzo lekki model
        "mistral:7b",  # Model alternatywny
    ]

    # Strategia fallback modeli
    FALLBACK_STRATEGY: str = "progressive"  # progressive, round_robin, quality_first
    ENABLE_MODEL_FALLBACK: bool = True
    FALLBACK_TIMEOUT: int = 60  # sekundy przed przełączeniem na fallback

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

    # System Agentowy - Nowa Architektura
    USE_PLANNER_EXECUTOR: bool = True  # Włącz nową architekturę planisty-egzekutora
    ENABLE_CONVERSATION_SUMMARY: bool = True  # Włącz pamięć podsumowującą
    CONVERSATION_SUMMARY_THRESHOLD: int = 5  # Minimalna liczba wiadomości do podsumowania
    
    # Konfiguracja Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    CELERY_TASK_TIME_LIMIT: int = 30 * 60  # 30 minut
    CELERY_TASK_SOFT_TIME_LIMIT: int = 25 * 60  # 25 minut
    
    # Konfiguracja pamięci konwersacji
    MEMORY_MAX_CONTEXTS: int = 1000
    MEMORY_CLEANUP_THRESHOLD_RATIO: float = 0.8
    MEMORY_ENABLE_PERSISTENCE: bool = True
    MEMORY_ENABLE_SEMANTIC_CACHE: bool = True
    
    # Konfiguracja planisty
    PLANNER_TEMPERATURE: float = 0.1  # Niska temperatura dla spójności planów
    PLANNER_MAX_TOKENS: int = 4000  # Maksymalna liczba tokenów dla planisty
    
    # Konfiguracja syntezatora
    SYNTHESIZER_TEMPERATURE: float = 0.3  # Średnia temperatura dla kreatywności
    SYNTHESIZER_MAX_TOKENS: int = 2000  # Maksymalna liczba tokenów dla syntezatora
    
    # Konfiguracja egzekutora
    EXECUTOR_MAX_STEPS: int = 10  # Maksymalna liczba kroków w planie
    EXECUTOR_STEP_TIMEOUT: int = 60  # Timeout dla pojedynczego kroku (sekundy)

    # Ta linia mówi Pydantic, aby wczytał zmienne z pliku .env w głównym katalogu
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


# Tworzymy jedną, globalną instancję ustawień,
# której będziemy używać w całej aplikacji.
settings = Settings()

# Ustawienie OLLAMA_URL na localhost dla środowiska lokalnego
def get_ollama_url():
    import os
    url = os.environ.get('OLLAMA_URL')
    if url:
        return url
    # Domyślnie localhost dla dev
    return 'http://localhost:11434'

OLLAMA_URL = get_ollama_url()
