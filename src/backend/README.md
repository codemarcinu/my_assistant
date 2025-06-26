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