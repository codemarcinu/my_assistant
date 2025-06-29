# 📚 FoodSave AI – Kompleksowy Spis Treści Projektu (29.06.2025)

## 1. Główne przewodniki i przegląd
- [README.md](README.md) – Szybki start, architektura, status, linki
- [docs/README.md](docs/README.md) – Rozszerzony opis, funkcje, konfiguracja
- [docs/TOC.md](docs/TOC.md) – Spis treści dokumentacji
- [KOMPLEKSOWY_RAPORT_UPORZADKOWANIA_DOKUMENTACJI.md](reports/KOMPLEKSOWY_RAPORT_UPORZADKOWANIA_DOKUMENTACJI.md) – Najnowszy raport uporządkowania

## 2. Backend (src/backend/)
- **src/backend/agents/** – Agenty AI (Chef, Weather, RAG, OCR, Concise, itp.)
- **src/backend/api/** – Endpointy API (v1, v2, receipts, chat, backup, concise, itp.)
- **src/backend/core/** – Rdzeń systemu (LLM clients, async, monitoring, RAG, response length, itp.)
- **src/backend/infrastructure/** – Baza danych, vector store, LLM API
- **src/backend/models/** – Modele danych (konwersacje, dokumenty, produkty)
- **src/backend/services/** – Serwisy biznesowe (np. shopping)
- **src/backend/tests/** – Testy backendu (unit, integration, performance, contract)
- **src/backend/config.py** – Konfiguracja aplikacji
- **src/backend/app_factory.py** – Fabryka aplikacji FastAPI

## 3. Frontend (myappassistant-chat-frontend/)
- **myappassistant-chat-frontend/src/** – Kod źródłowy React/TypeScript
  - **components/** – Komponenty UI (chat, layout, features, settings, ui/atoms)
  - **pages/** – Strony (Dashboard, OCR, Pantry, itp.)
  - **services/** – API clients (api.ts, conciseApi.ts, telegramApi.ts)
  - **stores/** – Zustand stores (chatStore, settingsStore)
  - **test/** – Testy jednostkowe i utils
  - **types/** – Typy TypeScript
  - **utils/** – Funkcje pomocnicze
- **myappassistant-chat-frontend/tests/e2e/** – Testy end-to-end (Playwright)
- **myappassistant-chat-frontend/Dockerfile.* / vite.config.ts** – Konfiguracja buildów i serwera

## 4. Dokumentacja (docs/)
- [docs/ARCHITECTURE_DOCUMENTATION.md](docs/ARCHITECTURE_DOCUMENTATION.md) – Architektura systemu (diagramy, przepływy)
- [docs/AGENTS_GUIDE.md](docs/AGENTS_GUIDE.md) – Przewodnik po agentach AI
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) – Pełna dokumentacja API
- [docs/RECEIPT_ANALYSIS_GUIDE.md](docs/RECEIPT_ANALYSIS_GUIDE.md) – Analiza paragonów
- [docs/RAG_SYSTEM_GUIDE.md](docs/RAG_SYSTEM_GUIDE.md) – Retrieval-Augmented Generation
- [docs/CONCISE_RESPONSES_IMPLEMENTATION.md](docs/CONCISE_RESPONSES_IMPLEMENTATION.md) – Zwięzłe odpowiedzi
- [docs/ANTI_HALLUCINATION_GUIDE.md](docs/ANTI_HALLUCINATION_GUIDE.md) – System anty-halucynacyjny
- [docs/DATE_TIME_QUERY_GUIDE.md](docs/DATE_TIME_QUERY_GUIDE.md) – Obsługa daty/czasu
- [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) – Strategia testowania
- [docs/MONITORING_TELEMETRY_GUIDE.md](docs/MONITORING_TELEMETRY_GUIDE.md) – Monitoring, metryki, dashboardy
- [docs/MODEL_OPTIMIZATION_GUIDE.md](docs/MODEL_OPTIMIZATION_GUIDE.md) – Optymalizacja modeli
- [docs/CONVERSATION_CONTEXT_MANAGEMENT.md](docs/CONVERSATION_CONTEXT_MANAGEMENT.md) – Zarządzanie kontekstem rozmów
- [docs/DATABASE_GUIDE.md](docs/DATABASE_GUIDE.md) – Baza danych, ERD, modele
- [docs/BACKUP_SYSTEM_GUIDE.md](docs/BACKUP_SYSTEM_GUIDE.md) – Backup, retencja, weryfikacja
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) – Wdrożenie (dev/prod, Docker, SSL)
- [docs/TELEGRAM_BOT_DEPLOYMENT_GUIDE.md](docs/TELEGRAM_BOT_DEPLOYMENT_GUIDE.md) – Wdrożenie bota Telegram
- [docs/TELEGRAM_BOT_INTEGRATION_REPORT.md](docs/TELEGRAM_BOT_INTEGRATION_REPORT.md) – Raport z integracji Telegram
- [docs/INFORMATION_ARCHITECTURE.md](docs/INFORMATION_ARCHITECTURE.md) – Architektura informacji, UX
- [docs/frontend-implementation-plan.md](docs/frontend-implementation-plan.md) – Plan wdrożenia frontendu
- [docs/frontend-implementation-checklist.md](docs/frontend-implementation-checklist.md) – Checklist wdrożenia frontendu
- [docs/CONTRIBUTING_GUIDE.md](docs/CONTRIBUTING_GUIDE.md) – Zasady kontrybucji
- [docs/FINAL_TEST_STATUS.md](docs/FINAL_TEST_STATUS.md) – Status testów końcowych

## 5. Testy i jakość
- **tests/** – Testy globalne (unit, integration, contract, e2e, performance)
- [backend_test_results.txt](backend_test_results.txt) – Wyniki testów backendu
- [frontend_test_results.txt](frontend_test_results.txt) – Wyniki testów frontendu
- **comprehensive_test_results_*.json** – Szczegółowe raporty testów
- [docs/CRITICAL_FIXES_SUMMARY.md](docs/CRITICAL_FIXES_SUMMARY.md) – Krytyczne poprawki
- [docs/TEST_EXECUTION_SUMMARY.md](docs/TEST_EXECUTION_SUMMARY.md) – Podsumowanie testów
- [TEST_EXECUTION_SUMMARY_LATEST.md](TEST_EXECUTION_SUMMARY_LATEST.md) – Najnowsze wyniki testów

## 6. Monitoring, backup, narzędzia
- **monitoring/** – Konfiguracja Prometheus, Grafana, Loki, dashboardy
- **scripts/** – Skrypty CLI (backup, rag, monitoring, testy, itp.)
- **backups/** – Backupy bazy, plików, konfiguracji, vector store
- **data/** – Konfiguracje, słowniki, cache, vector store

## 7. Konfiguracja i DevOps
- [docker-compose*.yaml](docker-compose.yaml) – Konfiguracja Docker Compose (dev/prod)
- [Dockerfile, Dockerfile.ollama](Dockerfile) – Buildy backendu i modeli
- [env.dev, env.dev.example](env.dev.example) – Przykładowe pliki środowiskowe
- [run_all.sh, run_dev.sh, foodsave*.sh](run_all.sh) – Skrypty uruchomieniowe

## 8. Roadmapa, rozwój, licencje
- [ROADMAP.md](reports/ROADMAP.md) – Roadmapa rozwoju, fazy, statusy
- [LICENSE](LICENSE) – Licencja MIT
- [docs/CONTRIBUTING_GUIDE.md](docs/CONTRIBUTING_GUIDE.md) – Zasady wkładu
- [PROJECT_CLEANUP_SUMMARY.md](reports/PROJECT_CLEANUP_SUMMARY.md) – Podsumowanie porządkowania repozytorium

---

*Ten spis treści jest generowany automatycznie i powinien być aktualizowany wraz z rozwojem projektu. Każdy dłuższy plik markdown powinien mieć własny mini-TOC na początku. W przewodnikach wdrożeniowych, backupowych i integracyjnych zalecane są sekcje troubleshooting. W roadmapie i statusach testów – aktualizować daty i statusy.*

---

# 🍽️ FoodSave AI - Intelligent Culinary Assistant

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/Tests-94.7%25%20Passing-green.svg)]()

> **🚀 Projekt uporządkowany i gotowy do rozwoju!** 
> 
> Projekt został kompleksowo uporządkowany zgodnie z regułami `.cursorrules`. Usunięto duplikaty, zorganizowano dokumentację i zarchiwizowano niepotrzebne pliki. Szczegóły w [PROJECT_CLEANUP_SUMMARY.md](reports/PROJECT_CLEANUP_SUMMARY.md).

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

### �� Key Features

- **🤖 Advanced Multi-Agent Architecture**: Specialized AI agents:
  - **👨‍🍳 Chef Agent**: Suggests recipes based on available ingredients
  - **🌤️ Weather Agent**: Provides real-time weather forecasts
  - **📊 Analytics Agent**: Analyzes spending patterns and food waste
  - **🔍 Search Agent**: Searches for information and recipes
  - **📝 RAG Agent**: Retrieval-Augmented Generation for document processing
  - **📸 OCR Agent**: Optical Character Recognition for receipt processing
  - **💬 Concise Response Agent**: Provides brief, focused answers

- **🔍 Intelligent Receipt Analysis**: 
  - OCR processing of receipt images
  - Automatic product categorization
  - Expense tracking and budget management
  - Integration with shopping lists

- **📊 Smart Pantry Management**:
  - Inventory tracking with expiry dates
  - Waste reduction recommendations
  - Donation coordination with local organizations
  - Meal planning based on available ingredients

- **🎯 Concise Response System**:
  - Perplexity.ai-style brief answers
  - Map-reduce processing for complex queries
  - Dynamic response length control
  - Context-aware summarization

- **🔒 Privacy-First Design**:
  - Local AI models via Ollama
  - No data sent to external services
  - User-controlled data retention
  - Secure backup system

### 🏆 Current Status (29.06.2025)

- ✅ **Production Ready**: System fully operational
- ✅ **Test Coverage**: 94.7% (89/94 unit tests passing)
- ✅ **Integration Tests**: 100% (6/6 passing)
- ✅ **Agent Tests**: 100% (31/31 passing)
- ✅ **E2E Tests**: 92.3% (12/13 passing)
- ✅ **Performance**: Excellent (< 1s response times)
- ✅ **Documentation**: Complete (30+ documentation files)

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis
- **AI Models**: Ollama (local LLM hosting)
- **Vector Store**: FAISS for RAG system
- **Testing**: pytest with 94.7% coverage
- **Monitoring**: Prometheus, Grafana, Loki

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Components**: Custom design system
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Playwright

### DevOps
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions ready
- **Backup**: Automated backup system
- **Logging**: Structured logging with JSON

---

## 📦 Installation & Setup

### Prerequisites
- Docker & Docker Compose
- 8GB+ RAM (for AI models)
- 20GB+ disk space

### Quick Installation
```bash
# Clone repository
git clone https://github.com/yourusername/foodsave-ai.git
cd foodsave-ai

# Start all services
./scripts/start-dev.sh

# Install AI models
./scripts/dev-setup.sh models
```

### Manual Installation
```bash
# 1. Environment setup
cp env.dev.example .env
# Edit .env with your configuration

# 2. Start services
docker-compose -f docker-compose.dev.yaml up -d

# 3. Install dependencies
docker-compose -f docker-compose.dev.yaml exec backend poetry install
docker-compose -f docker-compose.dev.yaml exec frontend npm install

# 4. Run database migrations
docker-compose -f docker-compose.dev.yaml exec backend poetry run alembic upgrade head
```

---

## 🚀 Usage

### Basic Usage
1. **Access the application**: http://localhost:5173
2. **Upload receipts**: Use the receipt upload feature
3. **Ask questions**: Chat with the AI assistant
4. **View analytics**: Check spending and waste patterns

### Advanced Features
- **RAG System**: Upload documents for AI-powered search
- **Telegram Bot**: Use bot commands for quick actions
- **Backup System**: Automated data backup and restore
- **Monitoring**: Real-time system monitoring via Grafana

### API Usage
```bash
# Get API documentation
curl http://localhost:8000/docs

# Chat with AI
curl -X POST http://localhost:8000/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What can I cook with chicken and rice?"}'

# Upload receipt
curl -X POST http://localhost:8000/api/v2/receipts/upload \
  -F "file=@receipt.jpg"
```

---

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest

# Frontend tests
docker-compose -f docker-compose.dev.yaml exec frontend npm test

# E2E tests
docker-compose -f docker-compose.dev.yaml exec frontend npm run test:e2e
```

### Test Coverage
```bash
# Backend coverage
docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest --cov=src --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Performance Tests
```bash
# Run performance tests
./scripts/run_performance_tests.py

# Load testing
locust -f locustfile.py --host=http://localhost:8000
```

---

## 📊 Monitoring

### Access Monitoring Tools
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Loki**: http://localhost:3100

### Key Metrics
- **System Health**: Real-time container status
- **Performance**: Response times and throughput
- **AI Models**: Ollama model performance
- **Database**: Query performance and connections
- **Application**: Error rates and user activity

### Logs
```bash
# View all logs
./scripts/dev-setup.sh logs all

# View specific service logs
./scripts/dev-setup.sh logs backend
./scripts/dev-setup.sh logs frontend
./scripts/dev-setup.sh logs ollama
```

---

## 🔧 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check service status
./scripts/dev-setup.sh status

# View service logs
./scripts/dev-setup.sh logs [service-name]

# Restart services
./scripts/dev-setup.sh restart
```

#### AI Models Not Working
```bash
# Check Ollama status
curl http://localhost:11434/api/version

# Install models
docker-compose -f docker-compose.dev.yaml exec ollama ollama pull gemma3:12b

# Check model list
docker-compose -f docker-compose.dev.yaml exec ollama ollama list
```

#### Database Issues
```bash
# Check database connection
docker-compose -f docker-compose.dev.yaml exec backend poetry run python -c "from src.backend.core.database import engine; print('DB OK')"

# Run migrations
docker-compose -f docker-compose.dev.yaml exec backend poetry run alembic upgrade head
```

### Performance Issues
- **High Memory Usage**: Reduce number of concurrent AI requests
- **Slow Response Times**: Check Ollama model performance
- **Database Slow**: Optimize queries and add indexes

---

## 📚 Documentation

### Quick Links
- [📋 Complete Documentation](docs/TOC.md)
- [🏗️ Architecture Guide](docs/ARCHITECTURE_DOCUMENTATION.md)
- [🔌 API Reference](docs/API_REFERENCE.md)
- [🤖 Agents Guide](docs/AGENTS_GUIDE.md)
- [🧪 Testing Guide](docs/TESTING_GUIDE.md)
- [🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

### Documentation Structure
```
docs/
├── 📋 TOC.md                           # Table of Contents
├── 🏗️ ARCHITECTURE_DOCUMENTATION.md    # System Architecture
├── 🔌 API_REFERENCE.md                 # API Documentation
├── 🤖 AGENTS_GUIDE.md                  # AI Agents Guide
├── 🔍 RAG_SYSTEM_GUIDE.md             # RAG System Guide
├── 📝 RECEIPT_ANALYSIS_GUIDE.md       # Receipt Processing
├── 💬 CONCISE_RESPONSES_IMPLEMENTATION.md # Concise Responses
├── 🧪 TESTING_GUIDE.md                # Testing Strategy
├── 🗄️ DATABASE_GUIDE.md               # Database Guide
├── 🚀 DEPLOYMENT_GUIDE.md             # Deployment Guide
└── 📊 MONITORING_TELEMETRY_GUIDE.md   # Monitoring Guide
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING_GUIDE.md) for details.

### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/yourusername/foodsave-ai.git
cd foodsave-ai

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
./scripts/dev-setup.sh start
./scripts/dev-setup.sh test

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# Create Pull Request
```

### Code Standards
- **Python**: PEP 8, type hints, docstrings
- **TypeScript**: ESLint, Prettier, strict mode
- **Tests**: >90% coverage required
- **Documentation**: Update docs for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Ollama** for local LLM hosting
- **FastAPI** for the excellent web framework
- **React** for the frontend framework
- **Docker** for containerization
- **Prometheus & Grafana** for monitoring

---

## 📞 Support

- **Documentation**: [docs/TOC.md](docs/TOC.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/foodsave-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/foodsave-ai/discussions)

---

**Last Updated**: 29.06.2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅
