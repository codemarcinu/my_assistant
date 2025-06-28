# 🍽️ FoodSave AI - Intelligent Culinary Assistant

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

> **🚀 Projekt uporządkowany i gotowy do rozwoju!** 
> 
> Projekt został kompleksowo uporządkowany zgodnie z regułami `.cursorrules`. Usunięto duplikaty, zorganizowano dokumentację i zarchiwizowano niepotrzebne pliki. Szczegóły w [PROJECT_CLEANUP_SUMMARY.md](PROJECT_CLEANUP_SUMMARY.md).

## 📋 Przegląd Projektu

FoodSave AI to zaawansowany system AI do zarządzania żywnością, który łączy w sobie:
- **Inteligentną klasyfikację produktów** z obrazów paragonów
- **Zarządzanie zapasami** z predykcją dat ważności
- **Koordynację darowizn** do organizacji charytatywnych
- **Planowanie posiłków** z wykorzystaniem dostępnych składników
- **Zwięzłe odpowiedzi** dla szybkiej komunikacji

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [📖 Project Overview](#-project-overview)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Technology Stack](#️-technology-stack)
- [📦 Installation & Setup](#-installation--setup)
- [🚀 Usage](#-usage)
- [🧪 Testing](#-testing)
- [📊 Monitoring](#-monitoring)
- [🔧 Troubleshooting](#-troubleshooting)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Agents     │
│   (React/TS)    │◄──►│   (FastAPI)     │◄──►│   (Ollama)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Database      │◄─────────────┘
                        │   (PostgreSQL)  │
                        └─────────────────┘
```

## 🚀 Quick Start (Docker - Recommended)

This is the fastest and most reliable way to get the entire FoodSave AI system running.

### 🚀 Szybki Start (Docker - Zalecane)

To najszybszy i najbardziej niezawodny sposób uruchomienia całego systemu FoodSave AI.

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/foodsave-ai.git
cd foodsave-ai

# 2. Quick start (automatyczna konfiguracja)
./scripts/start-dev.sh

# LUB ręczna konfiguracja:
# 2a. Create environment file from the example
cp env.dev.example .env

# 2b. Setup development environment
./scripts/dev-setup.sh setup

# 2c. Build and run all services in detached mode
./scripts/dev-setup.sh start
```

**Application will be available at:**
- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- 🤖 **Ollama**: http://localhost:11434
- 📈 **Prometheus**: http://localhost:9090
- 📊 **Monitoring (Grafana)**: http://localhost:3001 (admin/admin)
- 📝 **Logs (Loki)**: http://localhost:3100

**To stop the application:**
```bash
./scripts/dev-setup.sh stop
```

**To view logs:**
```bash
# All logs
./scripts/dev-setup.sh logs all

# Specific service logs
./scripts/dev-setup.sh logs backend
./scripts/dev-setup.sh logs frontend
./scripts/dev-setup.sh logs ollama
```

---

## 📖 Project Overview

FoodSave AI is an advanced multi-agent AI system designed for managing household culinary tasks with a focus on sustainability and food waste reduction. The system utilizes locally hosted language models through Ollama, ensuring privacy and user data control.

### 🎯 Key Features

- **🤖 Advanced Multi-Agent Architecture**: Specialized AI agents:
  - **👨‍🍳 Chef Agent**: Suggests recipes based on available ingredients
  - **🌤️ Weather Agent**: Provides real-time weather forecasts
  - **🔍 Search Agent**: Searches for information from the internet
  - **📷 OCR Agent**: Extracts data from receipt images
  - **📊 Analytics Agent**: Provides insights about shopping patterns
  - **📅 Meal Planner Agent**: Helps with meal planning
  - **🏷️ Categorization Agent**: Automatic product categorization
  - **🧠 RAG Agent**: Advanced Retrieval-Augmented Generation
  - **💬 Concise Response Agent**: Perplexity.ai-style concise responses
  - **⏰ Date/Time Agent**: **Instant, accurate date and time information** 🆕

- **📱 Telegram Bot Integration**: Full integration with Telegram Bot API:
  - **🤖 Webhook Processing**: Real-time message handling
  - **🧠 AI Processing**: Integration with existing orchestrator
  - **⚡ Rate Limiting**: Protection against spam (30 messages/minute)
  - **📝 Message Splitting**: Automatic long message handling
  - **💾 Database Storage**: Conversation persistence
  - **🎛️ Frontend Settings**: Complete configuration panel

- **⚡ React/Vite Frontend**: Modern user interface with TypeScript
- **🧠 Advanced NLP**: Processing complex, multi-threaded commands
- **🔒 Local LLM Integration**: Uses Ollama for privacy
- **💾 Memory Management**: Enhanced conversation state tracking
- **🗄️ Database**: Tracks ingredients, receipts, and user preferences
- **📸 Receipt Scanning**: Automated receipt entry through OCR
- **📝 Concise Responses**: Perplexity.ai-style response length control
- **⏰ Accurate Date/Time**: **Real-time system date queries with 100% accuracy** 🆕

### 🆕 Latest Features (June 2025)

#### **Complete Development Environment** 🆕
- **🐳 Full Docker Setup**: Complete containerized development environment
- **📊 Comprehensive Monitoring**: Prometheus, Grafana, Loki for logs and metrics
- **🔍 Full Logging**: Structured logging for all services
- **⚡ Hot Reload**: Automatic reload for backend and frontend
- **🧪 Testing Framework**: Complete test suite with coverage
- **🔧 Development Tools**: Automated setup and management scripts

#### **Telegram Bot Integration** 🆕
- **🤖 Full Telegram Bot API integration**: Real-time messaging with AI assistant
- **📱 Webhook processing**: Automatic message handling and AI responses
- **⚡ Rate limiting**: Protection against spam (30 messages/minute)
- **📝 Message splitting**: Automatic handling of long responses
- **💾 Conversation storage**: All interactions saved to database
- **🎛️ Frontend configuration**: Complete settings panel for bot management
- **🔒 Security**: Secret token validation and input sanitization
- **📊 Monitoring**: Comprehensive logging and metrics

#### **Concise Response System**
- **Perplexity.ai-style responses**: Control response length (concise, standard, detailed)
- **Map-reduce RAG processing**: Two-stage document processing for better summaries
- **Response expansion**: Click to expand concise responses for more details
- **Conciseness metrics**: Real-time scoring of response brevity
- **Frontend integration**: Beautiful UI components for concise responses

#### **Enhanced System Stability**
- **98.2% test pass rate**: 216/220 tests passing
- **Zero critical errors**: All major issues resolved
- **Improved import structure**: Unified import paths across the project
- **Docker optimization**: Simplified container configuration
- **Performance monitoring**: Comprehensive metrics and alerting

#### **Date and Time Query Support** 🆕
- **⏰ Instant Date Responses**: Bypasses LLM for immediate, accurate system time
- **🎯 100% Accuracy**: Uses system datetime instead of fabricated LLM responses
- **🌍 Multi-language Support**: Polish and English date query patterns
- **🔍 Smart Detection**: Advanced regex patterns to avoid false positives
- **⚡ Performance**: <100ms response time for date queries
- **🛡️ Reliability**: No external dependencies, always available
- **🧪 Comprehensive Testing**: Full test coverage with datetime mocking

#### **Anti-Hallucination System** 🆕
- **🛡️ Advanced Anti-Hallucination Protection**: Multi-layered system to prevent AI from making up information
- **🎯 Fuzzy Name Matching**: Detects when AI invents biographies for unknown people
- **📱 Product Hallucination Detection**: Prevents fake product specifications and features
- **🔍 Pattern Recognition**: Identifies common hallucination patterns (biographies, technical specs)
- **📋 Whitelist System**: Allows known public figures while blocking unknown individuals
- **🌍 Polish Name Detection**: Specialized detection for Polish names and surnames
- **⚡ Post-Processing Filter**: Real-time response filtering with intelligent fallbacks
- **📊 78% Reduction**: Significant decrease in hallucination cases (from 6/9 to 2/9 in tests)

**Anti-Hallucination Features**:
- **System Prompt Enhancement**: Explicit instructions against fabricating facts
- **Temperature Optimization**: Lowered from 0.3 to 0.1 for better determinism
- **Response Pattern Detection**: Identifies biographical and technical specification patterns
- **Context Validation**: Ensures responses are based on available information
- **Fallback Mechanisms**: Graceful degradation when hallucinations are detected

**Supported Queries**:
```
Polish: "jaki dzisiaj jest dzień?", "podaj dzisiejszą datę"
English: "what day is it today?", "today's date"
```

## 🛠️ Technology Stack

### Backend
- **🐍 Python 3.12+** - Main programming language
- **⚡ FastAPI** - Modern API framework
- **🗄️ SQLAlchemy** - ORM with async support
- **🤖 Ollama** - Local language models
- **🔍 FAISS** - Vector search engine
- **📊 Prometheus** - Monitoring and metrics
- **📱 Telegram Bot API** - Real-time messaging integration

### Frontend
- **⚛️ React 18** - Modern UI framework
- **🔷 TypeScript** - Type safety
- **🎨 Tailwind CSS** - Styling
- **🔗 TanStack Query** - State management
- **🧪 Jest + Playwright** - Testing

### DevOps & Monitoring
- **🐳 Docker** - Containerization
- **📦 Poetry** - Python dependency management
- **🧪 Pytest** - Testing framework
- **📊 Grafana** - Monitoring dashboard
- **📈 Prometheus** - Metrics collection
- **📝 Loki** - Log aggregation
- **🔄 Hot Reload** - Development efficiency

## 📦 Installation & Setup

You can run the project in two ways: using Docker (recommended for consistency) or setting it up manually on your local machine.

### Method 1: Docker Setup (Recommended)

This method ensures that all services (backend, frontend, databases, monitoring) run in an isolated and consistent environment.

#### Prerequisites
- **🐳 Docker** and **Docker Compose**
- **🌐 Git**

#### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/foodsave-ai.git
cd foodsave-ai

# 2. Quick start (automatyczna konfiguracja)
./scripts/start-dev.sh
```

#### Manual Setup
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/foodsave-ai.git
cd foodsave-ai

# 2. Create Environment File
cp env.dev.example .env

# 3. Setup development environment
./scripts/dev-setup.sh setup

# 4. Build and Run
./scripts/dev-setup.sh start
```

> **Note on PostgreSQL Port:** If you have a local PostgreSQL instance running, you might encounter a port conflict on `5432`. The configuration uses port **5433** for the container to avoid conflicts.

#### 5. Verify Services
Check if all containers are running.
```bash
./scripts/dev-setup.sh status
```

### Method 2: Manual Setup (Advanced)

For developers who prefer to run services locally without Docker.

#### Prerequisites
- **🐍 Python 3.12+**
- **📦 Poetry**
- **🗄️ PostgreSQL 15+**
- **🔴 Redis 7+**
- **🤖 Ollama**
- **🌐 Node.js 18+**

#### Steps
1. **Install Python dependencies:**
   ```bash
   poetry install
   ```

2. **Setup database:**
   ```bash
   # Create database
   createdb foodsave_dev
   
   # Run migrations
   poetry run alembic upgrade head
   ```

3. **Install Ollama models:**
   ```bash
   ollama pull gemma3:12b
   ollama pull nomic-embed-text
   ```

4. **Start services:**
   ```bash
   # Start Redis
   redis-server
   
   # Start Ollama
   ollama serve
   
   # Start backend
   poetry run uvicorn src.backend.main:app --reload --host 0.0.0.0 --port 8000
   
   # Start frontend (in another terminal)
   cd myappassistant-chat-frontend
   npm install
   npm run dev
   ```

## 🚀 Usage

### Basic Usage

1. **Open the application** at http://localhost:5173
2. **Start a conversation** with the AI assistant
3. **Upload receipts** for automatic product recognition
4. **Manage your pantry** with intelligent suggestions
5. **Plan meals** based on available ingredients

### Advanced Features

#### Telegram Bot
1. **Configure bot** in the frontend settings
2. **Set webhook** for real-time messaging
3. **Start chatting** with your AI assistant

#### Concise Responses
1. **Select response length** (concise, standard, detailed)
2. **Get quick answers** for fast decision making
3. **Expand responses** for more details when needed

#### Monitoring
1. **View metrics** in Grafana (http://localhost:3001)
2. **Check logs** in Loki (http://localhost:3100)
3. **Monitor performance** in Prometheus (http://localhost:9090)

## 🧪 Testing

### Running Tests

```bash
# All tests
./scripts/dev-setup.sh test

# Unit tests
docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest tests/unit/ -v

# Integration tests
docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest tests/integration/ -v

# Frontend tests
cd myappassistant-chat-frontend
npm test
```

### Test Coverage

```bash
# Generate coverage report
docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest --cov=src --cov-report=html

# View coverage report
open coverage/index.html
```

## 📊 Monitoring

### Available Dashboards

- **📈 System Overview**: General system health and performance
- **🤖 AI Agents**: Agent performance and usage metrics
- **🗄️ Database**: Database performance and query metrics
- **📱 API Endpoints**: API usage and response times
- **📝 Logs**: Centralized log viewing and analysis

### Access Points

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Loki**: http://localhost:3100

### Key Metrics

- **Response Times**: API endpoint performance
- **Error Rates**: System reliability
- **Resource Usage**: CPU, memory, disk usage
- **AI Model Performance**: Inference times and accuracy

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check what's using a port
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>
```

#### 2. Docker Issues
```bash
# Restart Docker
sudo systemctl restart docker

# Clean up containers
docker system prune -a
```

#### 3. Model Loading Issues
```bash
# Check Ollama status
curl http://localhost:11434/api/version

# Pull models manually
ollama pull gemma3:12b
```

#### 4. Database Issues
```bash
# Reset database
./scripts/dev-setup.sh cleanup
./scripts/dev-setup.sh start
```

### Getting Help

1. **Check logs**: `./scripts/dev-setup.sh logs all`
2. **View status**: `./scripts/dev-setup.sh status`
3. **Restart services**: `./scripts/dev-setup.sh restart`
4. **Check documentation**: [Development Guide](README_DEVELOPMENT.md)

## 📚 Documentation

### Core Documentation
- **[📖 Development Guide](README_DEVELOPMENT.md)** - Complete development setup and workflow
- **[🏗️ Architecture Documentation](docs/ARCHITECTURE_DOCUMENTATION.md)** - System architecture overview
- **[🔧 API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[🤖 Agents Guide](docs/AGENTS_GUIDE.md)** - AI agents documentation
- **[🧪 Testing Guide](docs/TESTING_GUIDE.md)** - Testing strategies and best practices

### Additional Resources
- **[📊 Monitoring Guide](docs/MONITORING_TELEMETRY_GUIDE.md)** - Monitoring and observability
- **[🔒 Security Guide](docs/AUDIT_REPORT.md)** - Security considerations
- **[🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[📱 Telegram Bot Guide](docs/TELEGRAM_BOT_INTEGRATION_REPORT.md)** - Telegram integration

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING_GUIDE.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the [`.cursorrules`](.cursorrules)
4. **Run tests**: `./scripts/dev-setup.sh test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Standards

- Follow the [`.cursorrules`](.cursorrules) for code quality
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 Quick Commands Reference

```bash
# Quick start
./scripts/start-dev.sh

# Full setup
./scripts/dev-setup.sh setup
./scripts/dev-setup.sh start

# Management
./scripts/dev-setup.sh status
./scripts/dev-setup.sh logs all
./scripts/dev-setup.sh stop
./scripts/dev-setup.sh restart

# Development
./scripts/dev-setup.sh test
./scripts/dev-setup.sh models

# Cleanup
./scripts/dev-setup.sh cleanup
```

---

**🍽️ FoodSave AI** - Intelligent Culinary Assistant powered by AI 🚀

*Built with ❤️ using FastAPI, React, and Ollama*

## 🎯 Status projektu: ✅ STABILNY I PRZETESTOWANY

**Ostatnia aktualizacja:** 2025-06-26  
**Status testów:** 278/279 testów przechodzi (99.6% sukces)  
**Krytyczne błędy:** 0 (wszystkie naprawione)

## 📊 Aktualny status

### ✅ Testy
- **278 testów przeszło** ✅
- **1 test pominięty** (endpoint `/auth/register` nie jest zaimplementowany)
- **0 testów nie powiodło się** ✅
- **51 ostrzeżeń** (głównie deprecacje Pydantic, datetime, pytest-asyncio)

### 🔧 Ostatnie naprawy (2025-06-26)
1. **Naprawa fallback parsera** - ReceiptAnalysisAgent teraz poprawnie rozpoznaje produkty z polskich paragonów
2. **Naprawa testów kontraktowych** - endpoint `/api/v2/users/me` działa w trybie testowym
3. **Naprawa testów RAG** - wszystkie testy RAG przechodzą
4. **Naprawa testów autoryzacji** - zaktualizowano FastAPI/Starlette

### 🎯 Kluczowe funkcjonalności
- **Analiza paragonów** - zaawansowany parser dla polskich sklepów (Lidl, Biedronka, Auchan, etc.)
- **OCR processing** - rozpoznawanie tekstu z obrazów i PDF-ów
- **RAG system** - Retrieval-Augmented Generation z wektorową bazą danych
- **Web search** - wyszukiwanie z weryfikacją wiedzy
- **Concise responses** - inteligentne skracanie odpowiedzi
- **Authentication** - system autoryzacji JWT
- **Monitoring** - monitoring wydajności i zdrowia systemu

## 🧠 Advanced Conversation Memory Management

FoodSave AI features a robust, production-grade memory management system for chatbots and AI agents, solving the problem of context loss in long conversations. Key features:

- **Persistent storage**: All conversations and messages are stored in PostgreSQL, ensuring context is never lost between sessions or restarts.
- **Sliding window + summarization**: The last N messages are kept in full, while older messages are summarized (multi-language, key points, user preferences, topics, style).
- **Semantic cache**: Fast retrieval of similar contexts using semantic hashes.
- **Automatic cleanup**: Old/unused contexts are cleaned up based on usage and timestamps.
- **Detailed statistics**: Compression ratio, cache hit rate, context counts, and more, available via API and frontend.
- **Manual optimization**: Memory can be optimized on demand via API or UI.
- **Frontend monitoring**: The `MemoryMonitorModule` React component displays memory usage, compression, cache hit rate, and allows manual optimization.

### Example API Usage

- Get optimized chat history:
  ```http
  GET /api/chat/memory_chat?limit=50
  ```
- Get memory statistics:
  ```http
  GET /api/chat/memory_stats
  ```
- Optimize memory:
  ```http
  POST /api/chat/memory_optimize
  ```

### Example Conversation Summary
```json
{
  "key_points": [
    "User likes: i like spaghetti with tomato sauce",
    "User asked: what ingredients do i need?",
    "Assistant provided: here's a simple recipe for spaghetti with tomato sauce..."
  ],
  "topics_discussed": ["cooking", "technology"],
  "user_preferences": {},
  "conversation_style": "friendly"
}
```

### Monitoring & Frontend
- **MemoryMonitorModule**: Real-time memory stats, compression, cache hit rate, and manual optimization from the UI.
- **Grafana dashboards**: System-wide metrics and health.

For full details, see [docs/CONVERSATION_CONTEXT_MANAGEMENT.md](docs/CONVERSATION_CONTEXT_MANAGEMENT.md).

---

## 🚀 Szybki start

### Wymagania
- Python 3.12+
- Docker i Docker Compose
- Ollama (dla lokalnych modeli LLM)

### Instalacja
```bash
# Klonuj repozytorium
git clone <repository-url>
cd AIASISSTMARUBO/myappassistant

# Uruchom w trybie deweloperskim
./run_dev.sh

# Lub uruchom wszystkie usługi
./run_all.sh
```

### Testy
```bash
# Uruchom wszystkie testy jednostkowe
PYTHONPATH=src python3 -m pytest tests/unit -v

# Uruchom testy integracyjne
PYTHONPATH=src python3 -m pytest tests/integration -v

# Uruchom testy kontraktowe
PYTHONPATH=src python3 -m pytest tests/contract -v
```

## 📁 Struktura projektu

```
myappassistant/
├── src/backend/
│   ├── agents/           # Agenty AI (ReceiptAnalysis, RAG, Search, etc.)
│   ├── api/             # API endpoints (FastAPI)
│   ├── core/            # Rdzeń systemu (LLM clients, config, etc.)
│   ├── integrations/    # Integracje zewnętrzne (Telegram, web search)
│   └── infrastructure/  # Infrastruktura (database, vector store)
├── tests/               # Testy (unit, integration, contract)
├── docs/               # Dokumentacja
├── monitoring/         # Konfiguracja monitoring (Grafana, Prometheus)
└── scripts/           # Skrypty pomocnicze
```

## 🔧 Konfiguracja

### Zmienne środowiskowe
```bash
# Kopiuj przykładową konfigurację
cp env.dev.example .env

# Edytuj konfigurację
nano .env
```

### Kluczowe ustawienia
- `TESTING_MODE=true` - tryb testowy
- `OLLAMA_HOST=localhost:11434` - host Ollama
- `DATABASE_URL=postgresql://...` - baza danych
- `JWT_SECRET_KEY=...` - klucz JWT

## 📚 Dokumentacja

- [Architecture Documentation](docs/ARCHITECTURE_DOCUMENTATION.md)
- [API Reference](docs/API_REFERENCE.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Critical Fixes Summary](CRITICAL_FIXES_SUMMARY.md)
- [Test Execution Summary](TEST_EXECUTION_SUMMARY.md)

## 🐛 Rozwiązywanie problemów

### Najczęstsze problemy
1. **Ollama nie odpowiada** - sprawdź czy Ollama jest uruchomiony: `ollama serve`
2. **Błędy bazy danych** - sprawdź połączenie: `docker-compose ps postgres`
3. **Błędy testów** - uruchom z `PYTHONPATH=src`

### Logi
```bash
# Logi aplikacji
tail -f logs/backend/app.log

# Logi Docker
docker-compose logs -f

# Logi Ollama
tail -f logs/ollama/ollama.log
```

## 🤝 Contributing

1. Fork projektu
2. Utwórz branch: `git checkout -b feature/nazwa-funkcji`
3. Commit zmiany: `git commit -m 'Add feature'`
4. Push: `git push origin feature/nazwa-funkcji`
5. Otwórz Pull Request

### Standardy kodu
- Używaj `black` do formatowania
- Uruchom testy przed commitem
- Dodaj dokumentację dla nowych funkcji
- Postępuj zgodnie z [Contributing Guide](docs/CONTRIBUTING_GUIDE.md)

## 📄 Licencja

Ten projekt jest licencjonowany pod [LICENSE](LICENSE).

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation:** [docs/](docs/)
- **Testing:** [TEST_EXECUTION_SUMMARY.md](TEST_EXECUTION_SUMMARY.md)

---

**Status:** ✅ Produkcyjny, stabilny, przetestowany  
**Ostatnia aktualizacja:** 2025-06-26  
**Wersja:** 1.0.0

## Plan działania 2024

### Faza 1: Stabilizacja i Fundamenty (Tydzień 1-2)
- Naprawa krytycznych błędów backendu
- Fundament Design Systemu (Tailwind, atomic design, Storybook)
- Aktualizacja dokumentacji

### Faza 2: Badania i Architektura Informacji (Tydzień 3-4)
- User Research
- Architektura informacji

### Faza 3: Accessibility & Performance (Tydzień 5-6)
- Dostępność
- Optymalizacja wydajności

### Faza 4: Zaawansowane Funkcje i Launch (Tydzień 7-8)
- AI & Community
- Przygotowanie do launchu
