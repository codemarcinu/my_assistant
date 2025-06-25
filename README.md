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
