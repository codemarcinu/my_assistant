# FoodSave AI - Inteligentny Asystent Spiżarni

## 📁 Struktura Projektu

```
AIASISSTMARUBO/
├── myappassistant/                    # Backend Python (FastAPI)
│   ├── src/                          # Kod źródłowy backendu
│   ├── tests/                        # Testy backendu
│   ├── scripts/                      # Skrypty pomocnicze
│   ├── docs/                         # Dokumentacja backendu
│   ├── monitoring/                   # Konfiguracja monitoringu
│   ├── data/                         # Dane i konfiguracje
│   ├── archive/                      # Archiwalne pliki
│   ├── docker-compose.yaml           # Konfiguracja Docker
│   ├── pyproject.toml                # Zależności Python
│   ├── myappassistant-chat-frontend/ # Frontend React (Vite)
│   │   ├── src/                      # Kod źródłowy frontendu
│   │   ├── tests/                    # Testy E2E (Playwright)
│   │   ├── package.json              # Zależności Node.js
│   │   └── README.md                 # Dokumentacja frontendu
│   └── README.md                     # Dokumentacja backendu
└── package.json                      # Skrypty główne
```

## 🚀 Szybki Start

### ⚠️ Ważne: Frontend znajduje się w katalogu `myappassistant/myappassistant-chat-frontend/`!

### Instalacja wszystkich zależności
```bash
npm run install:all
```

### Backend (Python)
```bash
npm run dev:backend
# lub ręcznie:
cd myappassistant
pip install -r requirements.txt
python -m uvicorn src.main:app --reload
```

### Frontend (React)
```bash
npm run dev:frontend
# lub ręcznie:
cd myappassistant/myappassistant-chat-frontend
npm install
npm run dev
```

### Testy E2E
```bash
npm run test:e2e
# lub ręcznie:
cd myappassistant/myappassistant-chat-frontend
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
**Rozwiązanie:** Upewnij się, że jesteś w katalogu `myappassistant/myappassistant-chat-frontend/`:
```bash
cd myappassistant/myappassistant-chat-frontend
npm run dev
```

### Błąd: "Command not found: python"
**Rozwiązanie:** Zainstaluj Python lub użyj `python3`:
```bash
cd myappassistant
python3 -m uvicorn src.main:app --reload
```

### Błąd: "Module not found"
**Rozwiązanie:** Zainstaluj zależności:
```bash
# Backend
cd myappassistant
pip install -r requirements.txt

# Frontend
cd myappassistant/myappassistant-chat-frontend
npm install
```

## 📚 Dokumentacja

- [Backend README](myappassistant/README.md)
- [Frontend README](myappassistant/myappassistant-chat-frontend/README.md)
- [Development Roadmap](myappassistant/myappassistant-chat-frontend/DEVELOPMENT_ROADMAP.md)

## 🧪 Testowanie

```bash
npm run test:frontend   # Testy jednostkowe frontendu
npm run test:e2e        # Testy E2E frontendu
cd myappassistant       # Testy backendu
pytest
```

## 🐳 Docker

```bash
cd myappassistant
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

MIT License - zobacz plik [LICENSE](myappassistant/LICENSE) dla szczegółów. 