# FoodSave AI - Setup Instructions

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.12+ (for development)
- Node.js 18+ (for frontend development)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd AIASISSTMARUBO

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

### 2. Run with Docker (Recommended)

```bash
# Start all services
./run_project.sh

# Or manually:
docker compose up -d --build
```

### 3. Verify Installation

- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
AIASISSTMARUBO/
├── src/backend/               # Python 3.12 + FastAPI
│   ├── main.py                # FastAPI app instance
│   ├── api/                   # API endpoints (routers)
│   ├── models/                # SQLAlchemy + Pydantic models
│   ├── services/              # Business logic
│   └── tests/                 # Unit + integration tests
├── foodsave-frontend/         # Next.js 14 (TypeScript strict)
│   └── tests/                 # Jest + Playwright tests
├── docker-compose.yaml        # Complete services + healthchecks
├── .env.example               # Required environment variables
├── pytest.ini                 # Test configuration
└── run_project.sh             # Startup script
```

## 🔧 Development Setup

### Backend Development

```bash
cd src/backend

# Install dependencies
poetry install

# Run tests
poetry run pytest

# Run with hot reload
poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd foodsave-frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test
npm run test:e2e

# Type check
npm run type-check
```

## 🧪 Testing

### Backend Tests

- Wszystkie testy asynchroniczne muszą mieć dekorator `@pytest.mark.asyncio` nad każdą funkcją async:

```python
import pytest

@pytest.mark.asyncio
async def test_example():
    ...
```

- Przykład uruchomienia testów:

```bash
cd src/backend
poetry run pytest
poetry run pytest --cov=src --cov-report=html
```

- Uruchamianie wybranych typów testów:

```bash
poetry run pytest -m unit
poetry run pytest -m integration
poetry run pytest -m e2e
```

### Frontend Tests

```bash
cd foodsave-frontend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 📊 Monitoring

### Health Checks

- **Backend**: `GET /health` - Overall system health
- **Readiness**: `GET /ready` - Service readiness
- **Metrics**: `GET /metrics` - Prometheus metrics

### Monitoring Services (Optional)

```bash
# Start with monitoring
docker compose --profile monitoring up -d

# Access monitoring tools
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

## 🔐 Security

### Environment Variables

Never commit sensitive data. Use `.env` file for:

- Database credentials
- API keys
- Secret keys
- Service URLs

### CORS Configuration

CORS is configured for development:
- Allowed origins: `http://localhost:3000`
- Credentials: enabled
- Methods: all

## 🐳 Docker Services

### Core Services

- **backend**: FastAPI application (port 8000)
- **frontend**: Next.js application (port 3000)
- **postgres**: PostgreSQL database (port 5433)
- **redis**: Redis cache (port 6379)
- **ollama**: Local LLM models (port 11434)

### Optional Services

- **prometheus**: Metrics collection (port 9090)
- **grafana**: Monitoring dashboard (port 3001)
- **loki**: Log aggregation (port 3100)

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 8000, 3000, 5433 are available
2. **Docker permissions**: Ensure user is in docker group
3. **Memory issues**: Increase Docker memory limit for Ollama
4. **GPU issues**: Ensure NVIDIA Docker runtime is installed

### Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Reset Environment

```bash
# Stop and remove all containers
docker compose down -v

# Remove all images
docker compose down --rmi all

# Start fresh
./run_project.sh
```

## 📋 Production Checklist

Before deploying to production:

- [ ] Run `./scripts/pr_checklist.sh`
- [ ] All tests pass (`poetry run pytest`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] No TODO/FIXME in code
- [ ] Environment variables configured
- [ ] SSL/TLS configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## 🤝 Contributing

1. Follow `.cursorrules` guidelines
2. Write tests for new features
3. Use type hints and Pydantic models
4. Follow the project structure
5. Run validation: `python3 scripts/validate_rules.py`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 