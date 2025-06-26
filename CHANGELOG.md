# Changelog

Wszystkie istotne zmiany w projekcie FoodSave AI będą dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
i projekt przestrzega [Semantic Versioning](https://semver.org/lang/pl/).

## [1.3.0] - 2025-06-26

### 🧠 Dodano - Integracja RAG z realną bazą Postgres

#### ✅ **Status integracji RAG:**
- **RAG Agent dostępny w systemie** - Dedykowany agent do obsługi zapytań z kontekstem
- **Integracja z Postgres przez asyncpg** - Realne połączenie z bazą danych
- **AgentFactory rejestruje agenty RAG** - Automatyczna rejestracja w systemie
- **Testy jednostkowe przechodzą** - 78/84 testów jednostkowych przeszło
- **Enhanced RAG Agent działa** - 6/6 testów podstawowej funkcjonalności RAG
- **AgentFactory działa** - 21/21 testów rejestracji agentów przeszło

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

#### 📊 **Wyniki testów integracyjnych:**
```bash
# Testy jednostkowe: 78/84 przeszło (6 pominiętych)
# AgentFactory: 21/21 przeszło
# Enhanced RAG Agent: 6/6 przeszło
# Testy integracyjne RAG: Część wymaga poprawy mocków
```

### 🔧 Naprawiono
- **Środowisko wirtualne**: Naprawiono uszkodzone .venv i zainstalowano wszystkie zależności
- **Testy RAG**: Poprawiono importy w testach i uruchomiono pełne testy integracyjne
- **Importy w testach**: Naprawiono `ModuleNotFoundError` w testach przez ustawienie `PYTHONPATH=src`
- **Logger**: Utworzono katalog `logs/backend` dla plików logów

### 🧪 Testowanie
- **Testy jednostkowe**: 78/84 testów przeszło (6 pominiętych)
- **Testy AgentFactory**: 21/21 testów przeszło
- **Testy Enhanced RAG**: 6/6 testów przeszło
- **Testy integracyjne**: Część wymaga poprawy mocków dla vector store i LLM client

### 📋 Zmiany techniczne
- Dodano `asyncpg` do zależności dla połączenia z Postgres
- Poprawiono konfigurację testów z `PYTHONPATH=src`
- Zaktualizowano `poetry.lock` z nowymi zależnościami
- Naprawiono importy w `test_chat_endpoint.py`

### ⚠️ Znane problemy
- **Ollama embedding service**: Serwer embeddingów nie odpowiada, co wpływa na testy RAG
- **Testy integracyjne RAG**: Część testów nie przechodzi z powodu niepoprawnie skonfigurowanych mocków
- **Vector store w testach**: Vector store jest pusty w niektórych testach integracyjnych

## [1.2.0] - 2025-06-26

### 🔧 Naprawiono
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
```

## [1.1.0] - 2025-06-25

### 🚀 Dodano
- **Integracja z Ollama**: Dodano obsługę lokalnych modeli LLM
- **System agentów**: Implementacja różnych typów agentów AI
- **Vector store**: Integracja z FAISS dla wyszukiwania semantycznego
- **Redis cache**: Dodano cache dla poprawy wydajności
- **Monitoring**: Dodano Prometheus metrics i health checks

### 🔧 Naprawiono
- **Docker Compose**: Poprawiono konfigurację wszystkich usług
- **Zależności**: Zaktualizowano wszystkie pakiety Python i Node.js
- **Konfiguracja**: Dodano pliki .env.example z przykładowymi ustawieniami

## [1.0.0] - 2025-06-24

### 🎉 Pierwsza wersja
- **Backend**: FastAPI z Python 3.12
- **Frontend**: Next.js 14 z TypeScript
- **Baza danych**: PostgreSQL
- **Docker**: Kompletna konfiguracja kontenerów
- **Podstawowe funkcjonalności**: Chat, OCR, zarządzanie spiżarnią

---

## Typy zmian

- `➕ Dodano` - nowe funkcje
- `🔧 Zmieniono` - zmiany w istniejących funkcjach
- `✅ Naprawione` - poprawki błędów
- `🗑️ Usunięto` - usunięte funkcje
- `📊 Stan systemu` - informacje o stabilności 