# 🍽️ AIASISSTMARUBO - Inteligentny System Zarządzania Żywnością

**Ostatnia aktualizacja:** 26.06.2025  
**Status:** ✅ WSZYSTKIE TESTY PRZESZŁY (14/14)  
**Wersja:** Production Ready

---

## 🎯 **O PROJEKCIE**

AIASISSTMARUBO to zaawansowany system AI do zarządzania żywnością, który łączy:
- 🤖 **Inteligentne agenty AI** (Ollama LLM)
- 📷 **OCR paragonów** (Tesseract)
- 🗄️ **Baza danych produktów** (PostgreSQL/SQLite)
- 🔍 **RAG (Retrieval-Augmented Generation)**
- 🌤️ **Integracja z pogodą i wiadomościami**

---

## ✅ **STATUS TESTOWY (26.06.2025)**

### **Wyniki testów E2E:**
- **Łącznie testów:** 14
- **Przeszło:** 14 (100%)
- **Czas wykonania:** ~3.5s
- **Status:** **KOMPLETNY SUKCES**

### **Przetestowane funkcjonalności:**
- ✅ Połączenie z Ollama LLM
- ✅ Upload i OCR paragonów
- ✅ Operacje na bazie danych
- ✅ Agenty AI (jedzenie, planowanie, pogoda, wiadomości)
- ✅ Integracja RAG
- ✅ Endpointy zdrowia i metryki
- ✅ Pełny przepływ użytkownika

**📊 [Szczegółowy raport testowy](TEST_REPORT_2025-06-26.md)**

---

## 🏗️ **ARCHITEKTURA**

```
AIASISSTMARUBO/
├── src/backend/               # Python 3.12 + FastAPI
│   ├── main.py               # Instancja FastAPI "app"
│   ├── api/                  # End-pointy (routery)
│   ├── models/               # SQLAlchemy + Pydantic
│   ├── services/             # Logika domenowa
│   ├── agents/               # Agenty AI
│   └── tests/                # Unit + integration + E2E
├── foodsave-frontend/        # Next.js 14 (TypeScript strict)
│   └── tests/                # Jest + Playwright
├── docker-compose.yaml       # Komplet usług + healthchecks
└── .env[example]             # Wymagane zmienne środowiskowe
```

---

## 🚀 **SZYBKI START**

### **1. Klonowanie i setup**
```bash
git clone <repository-url>
cd AIASISSTMARUBO
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# lub .venv\Scripts\activate  # Windows
```

### **2. Instalacja zależności**
```bash
pip install -r requirements.txt
cd foodsave-frontend && npm install
```

### **3. Konfiguracja środowiska**
```bash
cp .env.example .env
# Edytuj .env z odpowiednimi wartościami
```

### **4. Uruchomienie Ollama**
```bash
# Zainstaluj Ollama z https://ollama.ai
ollama serve
ollama pull llama3.2:3b
ollama pull mistral:7b
```

### **5. Uruchomienie systemu**
```bash
# Backend
cd src/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (w nowym terminalu)
cd foodsave-frontend
npm run dev
```

---

## 🧪 **TESTY**

### **Uruchomienie testów E2E:**
```bash
cd src/backend
python -m pytest tests/test_production_e2e.py -v
```

### **Wszystkie testy:**
```bash
# Backend
python -m pytest -v

# Frontend
npm run test
npm run test:e2e
```

---

## 🔧 **KONFIGURACJA**

### **Wymagane zmienne środowiskowe:**
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/foodsave
TEST_DATABASE_URL=sqlite+aiosqlite:///./test.db

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# API Keys
PERPLEXITY_API_KEY=your_key_here

# Security
SECRET_KEY=your_secret_key
TESTING_MODE=false
```

---

## 📡 **API ENDPOINTS**

### **Główne endpointy:**
- `POST /api/chat/chat` - Chat z agentami AI
- `POST /api/v2/receipts/upload` - Upload paragonów
- `GET /health` - Status zdrowia
- `GET /ready` - Gotowość systemu
- `GET /metrics` - Metryki wydajności

### **Dokumentacja API:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🤖 **AGENTY AI**

### **Dostępne agenty:**
1. **Food Agent** - Pytania o jedzenie i żywienie
2. **Meal Planning Agent** - Planowanie posiłków
3. **Weather Agent** - Informacje o pogodzie
4. **News Agent** - Aktualności i wiadomości
5. **RAG Agent** - Wyszukiwanie w dokumentach

### **Przykłady użycia:**
```python
# Pytanie o jedzenie
response = await chat_agent.ask("Jakie produkty są dobre na śniadanie?")

# Planowanie posiłków
response = await meal_agent.plan_meals("Zaplanuj posiłki na tydzień")

# Informacje o pogodzie
response = await weather_agent.get_weather("Jaka jest pogoda w Warszawie?")
```

---

## 📊 **MONITORING I METRYKI**

### **Health Checks:**
- `/health` - Ogólny status systemu
- `/ready` - Gotowość do obsługi requestów
- `/metrics` - Metryki Prometheus

### **Logi:**
- Backend: `logs/backend/backend.log`
- Ollama: `logs/ollama/`
- Database: `logs/postgres/`

---

## 🐳 **DOCKER**

### **Uruchomienie z Docker Compose:**
```bash
docker-compose up -d
```

### **Usługi:**
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- Database: `localhost:5432`
- Ollama: `http://localhost:11434`

---

## 🔍 **ROZWÓJ**

### **Struktura kodu:**
- **Clean Architecture** - Separacja warstw
- **Dependency Injection** - Łatwe testowanie
- **Async/Await** - Wydajne operacje I/O
- **Type Hints** - Bezpieczeństwo typów

### **Konwencje:**
- **Python:** PEP 8, Black, isort
- **TypeScript:** ESLint, Prettier
- **Commits:** Conventional Commits
- **Tests:** pytest, Jest, Playwright

---

## 📈 **ROADMAP**

### **Q2 2025 (Aktualne):**
- ✅ Testy E2E zrealizowane
- ✅ Integracja z Ollama
- ✅ System RAG
- 🔄 Testy z realnymi modelami LLM

### **Q3 2025:**
- [ ] Rozszerzone agenty AI
- [ ] Integracja z kalendarzem
- [ ] Notyfikacje push
- [ ] Mobile app

### **Q4 2025:**
- [ ] Machine Learning dla predykcji
- [ ] Integracja z sklepami online
- [ ] Social features
- [ ] Analytics dashboard

---

## 🤝 **KONTYBUCJA**

### **Jak pomóc:**
1. Fork repository
2. Utwórz feature branch
3. Dodaj testy
4. Uruchom testy: `python -m pytest`
5. Submit pull request

### **Wymagania:**
- Python 3.12+
- Node.js 18+
- Ollama
- PostgreSQL (opcjonalnie)

---

## 📄 **LICENCJA**

MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

---

## 📞 **KONTAKT**

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email:** your-email@example.com

---

*Ostatnia aktualizacja: 26.06.2025*  
*Status: Production Ready* 🚀 