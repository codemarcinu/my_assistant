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
├── .env.example           # Wzorcowy plik środowiskowy
├── .env                   # Twój plik środowiskowy (NIE commituj!)
├── run_project.sh         # Skrypt uruchamiający całość
├── README.md
└── ...
```

## 🚀 Szybki Start

### 1. Przygotowanie środowiska

- Wymagane: Docker, Docker Compose, Node.js >= 18, Python >= 3.12
- Skopiuj plik środowiskowy:
```bash
cp .env.example .env
```
- (Opcjonalnie) Uzupełnij .env swoimi kluczami API, hasłami itp.

### 2. Uruchomienie wszystkich usług

**Najprościej:**
```bash
./run_project.sh
```

**Ręcznie:**
```bash
docker-compose up -d --build
```

### 3. Dostęp do aplikacji
- Backend API:     http://localhost:8000
- Frontend:        http://localhost:3000
- API Docs:        http://localhost:8000/docs
- Health Check:    http://localhost:8000/health

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

## 🧪 Testowanie

```bash
npm run test:frontend   # Testy jednostkowe frontendu
npm run test:e2e        # Testy E2E frontendu
cd src/backend          # Testy backendu
poetry run pytest
```

## 🐳 Docker Compose

- Wszystkie usługi (backend, frontend, postgres, redis, ollama, monitoring) uruchamiane są przez `docker-compose.yaml`.
- Każdy serwis ma zdefiniowany healthcheck.
- Frontend budowany jest z katalogu `foodsave-frontend`.

## 🧪 Best Practices for Async Tests

- Każda funkcja async testowana pytestem musi mieć dekorator `@pytest.mark.asyncio`.

## 📄 Licencja

MIT License - zobacz plik [LICENSE](src/backend/LICENSE) dla szczegółów.

## Zasady i dobre praktyki
- Kod backendu tylko w `src/backend/`, testy w `src/backend/tests/`
- Frontend w `foodsave-frontend/`
- Jeden plik `pyproject.toml` i `docker-compose.yaml` w głównym katalogu
- Szczegółowe zasady w `.cursorrules`

---

Zaktualizowano dokumentację zgodnie z najnowszą strukturą i zaleceniami. 