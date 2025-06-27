# FoodSave AI - Backend (FastAPI)

Nowoczesny backend dla inteligentnego asystenta spiżarni, oparty o FastAPI, Python 3.12, SQLAlchemy, Pydantic, Prometheus, OpenTelemetry, z pełną obsługą async, testów i healthchecków.

## 🚀 Szybki Start

### 1. Wymagania
- Python 3.12+
- Poetry (zalecane)
- Docker (jeśli chcesz uruchomić całość przez Compose)

### 2. Instalacja zależności
```bash
cd src/backend
poetry install
```

### 3. Uruchomienie backendu
```bash
poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Testy
```bash
poetry run pytest
poetry run pytest --cov=src --cov-report=html
```

## 🧪 Testowanie
- Wszystkie testy async muszą mieć dekorator `@pytest.mark.asyncio`.
- Testy jednostkowe i integracyjne w `src/backend/tests/`.
- Pokrycie kodu: `pytest --cov=src --cov-report=html`

## 🏗️ Struktura katalogów
```
src/backend/
├── main.py                # FastAPI app instance
├── app_factory.py         # Tworzenie instancji FastAPI
├── api/                   # Endpointy (routery)
├── agents/                # Klasy agentów, orchestratory
├── core/                  # Baza, cache, monitoring, utils
├── models/                # SQLAlchemy + Pydantic
├── services/              # Logika domenowa
├── tests/                 # Testy unit/integration
├── requirements.txt       # Dodatkowe zależności
├── Dockerfile             # Docker backendu
└── ...
```

## 🐳 Docker Compose
- Backend uruchamiany przez `docker-compose.yaml` (serwis: backend)
- Port domyślny: 8000
- Healthcheck: `/health`

## 🔄 Monitoring i Health
- `/health` — ogólny health check (200 OK)
- `/ready` — gotowość do obsługi żądań
- `/metrics` — Prometheus metrics

## 🔐 Bezpieczeństwo
- Zmienna środowiskowa `SECRET_KEY` (w .env)
- Brak kluczy w kodzie źródłowym
- CORS: domyślnie tylko `http://localhost:3000`
- Wymagane klucze API: `OPENWEATHER_API_KEY`, `PERPLEXITY_API_KEY` (opcjonalne)

## 🔑 Konfiguracja API Keys
Dla pełnej funkcjonalności aplikacji, ustaw następujące klucze w pliku `.env`:

```bash
# Wymagane dla pogody
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Opcjonalne dla zaawansowanych funkcji
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

**Uwaga**: Aplikacja działa również bez kluczy API - funkcje wymagające kluczy będą wyłączone automatycznie.

## 🧩 Najważniejsze zależności
- FastAPI, Uvicorn, SQLAlchemy, Pydantic, Prometheus, OpenTelemetry, Redis, pytest, slowapi (rate limiting)

## 🧰 Troubleshooting
- Sprawdź logi: `docker compose logs -f backend`
- Sprawdź health: `curl http://localhost:8000/health`
- Sprawdź migracje DB: `alembic upgrade head`
- Sprawdź konfigurację: `.env` i `config.py`

## 📄 Licencja
MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

---

Zgodność z `.cursorrules` i najlepszymi praktykami FastAPI.

## 🔄 Streaming Responses

Backend obsługuje streaming responses dla czatu AI z następującymi endpointami:
- `/api/chat` - Podstawowy endpoint czatu ze streamingiem
- `/api/v2/chat` - Rozszerzony endpoint czatu z dodatkowymi funkcjami

### Implementacja streaming
- Asynchroniczne generatory dla kompatybilności z FastAPI
- Konwersja synchronicznych generatorów LLM na asynchroniczne
- Robust pattern z threading i queue dla stabilności
- Obsługa błędów i graceful degradation

### Przykład użycia
```python
# Streaming response w FastAPI
async def chat_stream_generator():
    async for chunk in llm_client.stream_chat(messages):
        yield f"data: {chunk}\n\n"
```

## Testowanie endpointów API v2

Aby przetestować streamingowy endpoint `/api/v2/chat/stream`, dodaj test integracyjny w pliku `src/backend/tests/test_chat_endpoint.py`:

```python
from fastapi.testclient import TestClient
from fastapi import status
from src.backend.main import app

def test_chat_stream_basic():
    client = TestClient(app)
    payload = {"message": "Hello, how are you?", "session_id": "test-session"}
    response = client.post("/api/v2/chat/stream", json=payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.text
    assert "błąd" not in response.text.lower()
```

### Wymagane zależności
- pytest
- pytest-asyncio
- httpx
- email-validator
- passlib
- slowapi
- aiofiles
- pyjwt

Testy uruchamiaj poleceniem:

```
docker compose exec backend poetry run pytest src/backend/tests/test_chat_endpoint.py -v
```

## ⚡️ Alternatywna obsługa vector store na GPU (PyTorch)

- Domyślnie backend używa FAISS (CPU).
- Alternatywna implementacja na GPU: `src/backend/core/vector_store_gpu.py` (PyTorch, cosine similarity, wsparcie CUDA).
- Testy: `test_gpu_vector_store.py` (uruchom: `python test_gpu_vector_store.py`).
- Integracja: zamień import na `from src.backend.core.vector_store_gpu import GPUVectorStore` i użyj `GPUVectorStore` zamiast `VectorStore`.

--- 