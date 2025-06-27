# MyAppAssistant - AI-Powered Receipt Analysis System

## Overview

MyAppAssistant is a comprehensive AI-powered receipt analysis system built with FastAPI and React, featuring advanced OCR capabilities, intelligent product categorization using Bielik AI models, and Google Product Taxonomy integration.

## 🚀 Key Features

### 📸 Advanced Receipt Analysis
- **OCR Processing**: Extract text from receipt images using Tesseract OCR
- **Intelligent Categorization**: Product categorization using Bielik AI models + Google Product Taxonomy
- **Store Normalization**: Automatic store name normalization using Polish store dictionary
- **Product Name Normalization**: Clean and standardize product names
- **Structured Data Extraction**: Extract store info, items, prices, dates, and VAT details

### 🤖 AI-Powered Components
- **Bielik 4.5b v3.0**: Product categorization and general conversation
- **Bielik 11b v2.3**: Receipt analysis and structured data extraction
- **Hybrid Approach**: Combines AI intelligence with dictionary-based matching
- **Confidence Scoring**: Multiple fallback mechanisms with confidence levels

### 🏪 Polish Market Focus
- **40+ Polish Stores**: Comprehensive dictionary of Polish retail chains
- **35 FMCG Categories**: Filtered Google Product Taxonomy for Polish market
- **100+ Product Rules**: Product name normalization for common Polish products
- **VAT Handling**: Polish VAT rates and calculations

### 🎯 Smart Categorization
- **Multi-level Categories**: Hierarchical product categorization
- **Bilingual Support**: Polish and English category names
- **Keyword Matching**: Fast categorization for known products
- **AI Fallback**: Bielik AI for unknown products

## 🏗️ Architecture

```
Frontend (React/TS) ←→ Backend (FastAPI) ←→ AI Agents (Bielik)
                              ↓
                    Database (PostgreSQL)
                              ↓
                    Cache (Redis) + Vector Store (FAISS)
```

### Core Components

1. **OCRAgent** - Text extraction from receipt images
2. **ReceiptAnalysisAgent** - Structured data extraction and analysis
3. **ProductCategorizer** - AI-powered product categorization
4. **StoreNormalizer** - Store name normalization
5. **ProductNameNormalizer** - Product name standardization

## 📊 Data Flow

```
Receipt Image → OCR → Text Analysis → Structured Data
                                    ↓
                            Product Categorization (Bielik + GPT)
                            Store Normalization
                            Product Name Normalization
                                    ↓
                            JSON Response with Metadata
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM with async support
- **Pydantic** - Data validation and serialization
- **Tesseract OCR** - Text extraction from images
- **FAISS** - Vector similarity search
- **Redis** - Caching and session storage

### AI/ML
- **Bielik 4.5b v3.0** - Product categorization and chat
- **Bielik 11b v2.3** - Receipt analysis
- **Ollama** - Local LLM inference
- **Google Product Taxonomy** - Standardized product categories

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **Vite** - Fast build tooling

### Infrastructure
- **PostgreSQL** - Primary database
- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.12+
- Node.js 18+

### 1. Clone Repository
```bash
git clone <repository-url>
cd AIASISSTMARUBO
```

### 2. Start Services
```bash
# Start all services
docker-compose up -d

# Or start development environment
./run_dev.sh
```

### 3. Pull Bielik Models
```bash
# Pull required Bielik models
docker exec -it ollama ollama pull bielik-4.5b-v3.0
docker exec -it ollama ollama pull bielik-11b-v2.3
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Monitoring**: http://localhost:3001

## 📖 API Documentation

### Receipt Analysis Endpoints

#### Upload Receipt
```http
POST /api/v2/receipts/upload
Content-Type: multipart/form-data

file: [receipt_image]
```

#### Analyze Receipt
```http
POST /api/v2/receipts/analyze
Content-Type: application/x-www-form-urlencoded

ocr_text: [extracted_text]
```

### Example Response
```json
{
  "status_code": 200,
  "data": {
    "store_name": "BIEDRONKA",
    "normalized_store_name": "Biedronka",
    "store_chain": "Biedronka",
    "store_type": "discount_store",
    "date": "2025-06-15 00:00",
    "items": [
      {
        "name": "Mleko 3.2% 1L",
        "normalized_name": "Mleko 3.2% 1L",
        "quantity": 1.0,
        "unit_price": 4.99,
        "total_price": 4.99,
        "category": "Nabiał > Mleko i śmietana",
        "category_en": "Dairy Products > Milk & Cream",
        "category_confidence": 0.9,
        "category_method": "bielik_ai"
      }
    ],
    "total_amount": 4.99
  }
}
```

## 📁 Project Structure

```
AIASISSTMARUBO/
├── src/backend/                 # Backend application
│   ├── agents/                  # AI agents
│   ├── api/                     # API endpoints
│   ├── core/                    # Core services
│   ├── models/                  # Data models
│   └── tests/                   # Backend tests
├── myappassistant-chat-frontend/ # Frontend application
│   ├── src/                     # React components
│   ├── components/              # UI components
│   └── tests/                   # Frontend tests
├── data/config/                 # Configuration files
│   ├── filtered_gpt_categories.json
│   ├── polish_stores.json
│   └── product_name_normalization.json
├── docs/                        # Documentation
├── monitoring/                  # Monitoring setup
└── docker-compose.yaml          # Docker configuration
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/myapp

# Redis
REDIS_URL=redis://localhost:6379

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# Application
ENVIRONMENT=development
LOG_LEVEL=info
```

### Configuration Files

#### Google Product Taxonomy
`data/config/filtered_gpt_categories.json`
- 35 FMCG categories with Polish translations
- Keywords for fast categorization
- Hierarchical structure

#### Polish Stores Dictionary
`data/config/polish_stores.json`
- 40+ Polish stores with variations
- Store types and metadata
- Normalization rules

#### Product Name Normalization
`data/config/product_name_normalization.json`
- 100+ product normalization rules
- Category mappings
- Quantity handling

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd src/backend
pytest

# Frontend tests
cd myappassistant-chat-frontend
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
- **Backend**: >80% code coverage
- **Frontend**: >70% code coverage
- **Integration**: Full API endpoint testing
- **E2E**: Critical user flows

## 📈 Monitoring

### Metrics
- OCR accuracy and processing time
- Categorization confidence scores
- API response times and error rates
- System resource usage

### Dashboards
- **Grafana**: Real-time monitoring dashboards
- **Prometheus**: Metrics collection and alerting
- **Loki**: Centralized logging

## 🔒 Security

### Authentication
- JWT-based authentication
- Token refresh mechanism
- Role-based access control

### Data Protection
- Input validation with Pydantic
- SQL injection prevention
- File upload restrictions
- GDPR compliance measures

## 🚀 Deployment

### Production Setup
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yaml up -d

# Monitor deployment
docker-compose logs -f
```

### Environment Configuration
- Development, staging, and production environments
- Environment-specific configuration files
- Secret management with environment variables

## 📚 Documentation

- [API Reference](API_REFERENCE.md) - Complete API documentation
- [Architecture Guide](ARCHITECTURE_DOCUMENTATION.md) - System architecture
- [Receipt Analysis Guide](RECEIPT_ANALYSIS_GUIDE.md) - Receipt processing details
- [Testing Guide](TESTING_GUIDE.md) - Testing strategies and examples
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript for frontend code
- Write comprehensive tests
- Update documentation for new features
- Maintain >80% test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the [docs](.) directory
- **API**: Use the interactive API docs at `/docs`

## 🎯 Roadmap

### Planned Features
- [ ] Machine learning model training on Polish data
- [ ] Real-time learning from user feedback
- [ ] Advanced analytics and spending insights
- [ ] Integration with accounting software
- [ ] Mobile application
- [ ] Multi-language support

### Performance Improvements
- [ ] Custom model optimization
- [ ] Advanced caching strategies
- [ ] Horizontal scaling support
- [ ] Real-time processing optimization

---

**Last Updated**: 2025-01-27  
**Version**: 2.0.0  
**Status**: Production Ready ✅ 