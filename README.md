# FoodSave AI - Inteligentny Asystent Spiżarni

## 📁 Struktura Projektu

```
AIASISSTMARUBO/
├── src/
│   └── backend/           # Python 3.12 + FastAPI (cały kod backendu i testy)
│       ├── agents/
│       ├── api/
│       ├── core/
│       ├── models/
│       ├── services/
│       ├── tests/         # testy backendu (pytest)
│       └── ...
├── foodsave-frontend/     # Next.js 14 (TypeScript strict)
│   ├── src/
│   ├── tests/
│   └── ...
├── docker-compose.yaml    # Główna konfiguracja usług
├── pyproject.toml         # Konfiguracja backendu (Poetry)
├── README.md
└── ...
```

## 🚀 Szybki Start

### ⚠️ Ważne: Frontend znajduje się w katalogu `foodsave-frontend/`!

### Instalacja wszystkich zależności
```bash
npm run install:all
```

### Backend (Python)
```bash
npm run dev:backend
# lub ręcznie:
cd src/backend
poetry install
PYTHONPATH=src pytest tests
```

### Frontend (React)
```bash
npm run dev:frontend
# lub ręcznie:
cd foodsave-frontend
npm install
npm run dev
```

### Testy E2E
```bash
npm run test:e2e
# lub ręcznie:
cd foodsave-frontend
npm run test:e2e
```

## 📋 Dostępne Skrypty

```bash
npm run install:all      # Instaluje zależności frontendu i backendu
npm run dev:frontend     # Uruchamia frontend w trybie development
npm run dev:backend      # Uruchamia backend w trybie development
npm run test:frontend    # Uruchamia testy jednostkowe frontendu
npm run test:e2e         # Uruchamia testy E2E
npm run build:frontend   # Buduje frontend do produkcji
npm run clean            # Czyści node_modules z obu katalogów
```

## ❌ Typowe Błędy i Rozwiązania

### Błąd: "Missing script: dev"
```
npm ERR! Missing script: "dev"
```
**Rozwiązanie:** Upewnij się, że jesteś w katalogu `foodsave-frontend/`:
```bash
cd foodsave-frontend
npm run dev
```

### Błąd: "Command not found: python"
**Rozwiązanie:** Zainstaluj Python lub użyj `python3`:
```bash
cd src/backend
python3 -m uvicorn src.main:app --reload
```

### Błąd: "Module not found"
**Rozwiązanie:** Zainstaluj zależności:
```bash
# Backend
cd src/backend
poetry install

# Frontend
cd foodsave-frontend
npm install
```

## 📚 Dokumentacja

- [Backend README](src/backend/README.md)
- [Frontend README](foodsave-frontend/README.md)
- [Development Roadmap](foodsave-frontend/DEVELOPMENT_ROADMAP.md)

## 🧪 Testowanie

```bash
npm run test:frontend   # Testy jednostkowe frontendu
npm run test:e2e        # Testy E2E frontendu
cd src/backend          # Testy backendu
poetry run pytest
```

## 🐳 Docker

```bash
cd src/backend
docker-compose up -d
```

## 🧪 Best Practices for Async Tests

- Every async test function **must** be decorated with `@pytest.mark.asyncio`:

```python
import pytest

@pytest.mark.asyncio
async def test_example():
    ...
```

- This ensures proper execution and compatibility with pytest-asyncio.
- Run all tests with:

```bash
poetry run pytest
```

- Run coverage:

```bash
poetry run pytest --cov=src --cov-report=html
```

## 📄 Licencja

MIT License - zobacz plik [LICENSE](src/backend/LICENSE) dla szczegółów. 

## Uruchamianie backendu

```bash
cd src/backend
poetry install
PYTHONPATH=src pytest tests
```

## Uruchamianie frontendu

```bash
cd foodsave-frontend
npm install
npm run dev
```

## Testy backendu

```bash
cd src/backend
PYTHONPATH=src pytest tests --cov=src --cov-report=html
```

## Testy frontendu

```bash
cd foodsave-frontend
npm run test
```

## Zasady i dobre praktyki
- Kod backendu tylko w `src/backend/`, testy w `src/backend/tests/`
- Frontend w `foodsave-frontend/`
- Jeden plik `pyproject.toml` i `docker-compose.yaml` w głównym katalogu
- Szczegółowe zasady w `.cursorrules`

---

Zaktualizowano strukturę projektu i dokumentację zgodnie z najlepszymi praktykami. 