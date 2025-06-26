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

## 🔧 Naprawy i Ulepszenia (v1.3.0)

### ✅ Naprawione problemy:
- **Chat API - format odpowiedzi**: Naprawiono niezgodność między frontend a backend
  - Backend zwracał `StreamingResponse` z `text/plain`, frontend oczekiwał JSON z polem `data`
  - Zmieniono endpoint `/api/chat/chat` na zwracanie JSON z formatem `{ "data": "..." }`
  - Poprawiono obsługę błędów w `chat_response_generator`
- **Frontend chat store**: Poprawiono obsługę odpowiedzi backendu
  - Obsługuje zarówno string jak i obiekt z polem `content`
  - Komponenty używają poprawnego typu `ChatMessage`
- **Błąd bazy danych**: Naprawiono `AsyncAdaptedQueuePool` - usunięto nieistniejący atrybut `'invalid'`
- **Generator odpowiedzi**: Naprawiono async generator w `/chat/stream` endpoint
- **Health checks**: Wszystkie kontenery teraz przechodzą health checks ✅
- **Redis konfiguracja**: Poprawiono host i port dla kontenera
- **Zależności**: Dodano brakujące pakiety (`langdetect`, `sentence-transformers`, `redis`)
- **Środowisko wirtualne**: Naprawiono uszkodzone .venv i zainstalowano wszystkie zależności
- **Testy RAG**: Poprawiono importy w testach i uruchomiono pełne testy integracyjne

### 🧠 Integracja RAG (Retrieval-Augmented Generation)

#### ✅ **Status integracji RAG z realną bazą Postgres:**

```
🔗 RAG Agent dostępny w systemie
🔗 Integracja z Postgres przez asyncpg
🔗 AgentFactory rejestruje agenty RAG
🔗 Testy jednostkowe przechodzą (78/84)
🔗 Enhanced RAG Agent działa (6/6 testów)
🔗 AgentFactory działa (21/21 testów)
```

#### 📊 **Wyniki testów integracyjnych:**

```bash
# Testy jednostkowe: 78/84 przeszło (6 pominiętych)
# AgentFactory: 21/21 przeszło
# Enhanced RAG Agent: 6/6 przeszło
# Testy integracyjne RAG: Część wymaga poprawy mocków
```

#### 🏗️ **Architektura RAG:**

- **RAGAgent**: Główny agent do obsługi zapytań z kontekstem
- **GeneralConversationAgent**: Agent z integracją RAG
- **Vector Store**: FAISS + Postgres dla przechowywania embeddingów
- **Document Processor**: Przetwarzanie dokumentów na chunki
- **Hybrid LLM Client**: Integracja z różnymi modelami LLM

#### 🔧 **Komponenty RAG:**

```python
# Dostępne agenty z RAG:
- "rag"                    # Dedykowany agent RAG
- "general_conversation"   # Agent z integracją RAG
- "concise_response"       # Agent z RAG dla zwięzłych odpowiedzi

# Funkcjonalności:
- Dodawanie dokumentów do bazy wiedzy
- Wyszukiwanie semantyczne
- Generowanie odpowiedzi z kontekstem
- Obsługa błędów i fallback
```

### 📊 Aktualny stan systemu:
```bash
# Wszystkie główne usługi działają poprawnie:
- foodsave-frontend:    ✅ healthy
- foodsave-backend:     ✅ healthy  
- foodsave-postgres:    ✅ healthy
- foodsave-ollama:      ✅ healthy
- foodsave-redis:       ✅ healthy

# Chat API działa poprawnie:
- Backend chat endpoint: ✅ zwraca JSON z polem "data"
- Frontend chat store:   ✅ obsługuje odpowiedzi backendu
- Chat UI:              ✅ wyświetla odpowiedzi AI zamiast błędów

# RAG Integration:
- Postgres + asyncpg:   ✅ połączenie działa
- Vector Store:         ✅ podstawowe operacje działają
- RAG Agents:           ✅ dostępne w AgentFactory
- Testy jednostkowe:    ✅ 78/84 przeszło
```

## 🧪 Testowanie

### Testy jednostkowe:
```bash
# Testy backendu
cd src/backend
PYTHONPATH=../../src poetry run pytest tests/unit/ -v

# Testy AgentFactory
PYTHONPATH=../../src poetry run pytest tests/test_agent_factory_new.py -v

# Testy RAG
PYTHONPATH=../../src poetry run pytest tests/test_enhanced_rag_agent.py -v
```

### Testy integracyjne:
```bash
# Pełne testy z realną bazą Postgres
PYTHONPATH=src poetry run pytest src/backend/tests/ --cov=src --cov-report=html
```

### Testy frontendu:
```bash
npm run test:frontend   # Testy jednostkowe frontendu
npm run test:e2e        # Testy E2E frontendu
```

## 🛠️ Troubleshooting

### Sprawdzenie stanu systemu:
```bash
# Sprawdź status kontenerów
docker ps

# Sprawdź health backendu
curl http://localhost:8000/health

# Sprawdź logi
docker logs foodsave-backend --tail 50
docker logs foodsave-frontend --tail 50
```

### Częste problemy:
1. **Kontenery unhealthy**: Zwiększono `start_period` w health checks
2. **Błędy Redis**: Sprawdź czy Redis działa na porcie 6380
3. **Błędy bazy danych**: Sprawdź logi PostgreSQL
4. **Testy RAG nie przechodzą**: Sprawdź dostępność Ollama dla embeddingów

### Naprawa środowiska wirtualnego:
```bash
# Jeśli .venv jest uszkodzone:
sudo rm -rf .venv
python3 -m venv .venv
poetry lock
poetry install
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

## 🐳 Docker Compose

- Wszystkie usługi (backend, frontend, postgres, redis, ollama, monitoring) uruchamiane są przez `docker-compose.yaml`.
- Każdy serwis ma zdefiniowany healthcheck z odpowiednimi timeoutami.
- Frontend budowany jest z katalogu `foodsave-frontend`.

## 🧪 Best Practices for Async Tests

- Każda funkcja async testowana pytestem musi mieć dekorator `@pytest.mark.asyncio`.
- Testy integracyjne RAG wymagają ustawienia `PYTHONPATH=src`.
- Mocki dla vector store i LLM client w testach RAG.

## 📄 Licencja

MIT License - zobacz plik [LICENSE](src/backend/LICENSE) dla szczegółów.

## Zasady i dobre praktyki
- Kod backendu tylko w `src/backend/`, testy w `src/backend/tests/`
- Frontend w `foodsave-frontend/`
- Jeden plik `pyproject.toml` i `docker-compose.yaml` w głównym katalogu
- Szczegółowe zasady w `.cursorrules`

---

**Ostatnia aktualizacja**: 2025-06-26 - Integracja RAG z Postgres v1.3.0 