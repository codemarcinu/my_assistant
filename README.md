# 🍽️ AIASISSTMARUBO - Inteligentny System Zarządzania Żywnością

**Ostatnia aktualizacja:** 26.06.2025  
**Status:** ✅ WSZYSTKIE TESTY PRZESZŁY (14/14) + E2E LLM  
**Wersja:** Production Ready

---

## 🎯 **O PROJEKCIE**

AIASISSTMARUBO to zaawansowany system AI do zarządzania żywnością, który łączy:
- 🤖 **Inteligentne agenty AI** (Ollama LLM z modelem Bielik 11B jako domyślnym)
- 📷 **OCR paragonów** (Tesseract)
- 🗄️ **Baza danych produktów** (PostgreSQL/SQLite)
- 🔍 **RAG (Retrieval-Augmented Generation)**
- 🌤️ **Integracja z pogodą i wiadomościami**

---

## ✅ **STATUS TESTOWY (26.06.2025)**

### **Wyniki testów E2E:**
- **Łącznie testów:** 14 + 3 modele LLM
- **Przeszło:** 17 (100%)
- **Czas wykonania:** ~3.5s + testy LLM
- **Status:** **KOMPLETNY SUKCES**

### **Przetestowane modele LLM:**
- ✅ **Bielik 11B Q4_K_M** - Model domyślny (37.40s, najszybszy)
- ✅ **Mistral 7B** - Model fallback (44.91s, równowaga)
- ✅ **Gemma3 12B** - Model zaawansowany (50.39s, najwyższa jakość)

### **Przetestowane funkcjonalności:**
- ✅ Połączenie z Ollama LLM (wszystkie modele)
- ✅ Upload i OCR paragonów
- ✅ Operacje na bazie danych
- ✅ Agenty AI (jedzenie, planowanie, pogoda, wiadomości)
- ✅ Integracja RAG
- ✅ Endpointy zdrowia i metryki
- ✅ Pełny przepływ użytkownika
- ✅ Monitoring GPU (RTX 3060 12GB)

**📊 [Szczegółowy raport testowy](docs/reports/TEST_REPORT_2025-06-26.md)**  
**🧠 [Raport E2E modeli LLM](docs/reports/RAPORT_E2E_MODELI_LLM.md)**

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
├── docs/                     # Dokumentacja projektu
│   ├── reports/              # Raporty testowe
│   ├── architecture/         # Dokumentacja architektury
│   └── guides/               # Przewodniki
├── test-results/             # Wyniki testów
├── logs/                     # Logi systemu
└── scripts/                  # Skrypty pomocnicze
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

### **4. Uruchomienie Ollama z modelami**
```bash
# Zainstaluj Ollama z https://ollama.ai
ollama serve

# Pobierz modele (w kolejności preferencji)
ollama pull bielik:11b-q4_k_m        # Model domyślny (polski)
ollama pull mistral:7b               # Model fallback
ollama pull gemma3:12b               # Model zaawansowany (większe okno kontekstowe)
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

### **Testy modeli LLM z monitoringiem GPU:**
```bash
# Test pojedynczego modelu
./scripts/monitor_gpu_during_test.sh "poetry run pytest tests/test_gemma3_12b_e2e.py::TestGemma312BE2E::test_gemma3_food_knowledge -v" "logs/gpu-monitoring/gpu_usage_test.log"

# Test wszystkich modeli sekwencyjnie
./scripts/run_llm_tests.sh
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

# Ollama - Model domyślny i fallback
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=bielik:11b-q4_k_m          # Model domyślny (polski)
OLLAMA_FALLBACK_MODEL=mistral:7b        # Model fallback
OLLAMA_ADVANCED_MODEL=gemma3:12b        # Model zaawansowany

# API Keys
PERPLEXITY_API_KEY=your_key_here

# Security
SECRET_KEY=your_secret_key
TESTING_MODE=false
```

### **Strategia modeli LLM:**
```
🎯 MODEL DOMYŚLNY: Bielik 11B Q4_K_M
├── Najszybszy (37.40s)
├── Nativne wsparcie języka polskiego
├── Zoptymalizowany (Q4_K_M)
└── Idealny dla aplikacji polskojęzycznych

🔄 MODEL FALLBACK: Mistral 7B
├── Równowaga szybkość/jakość (44.91s)
├── Wsparcie wielojęzyczne
├── Stabilne działanie
└── Używany gdy Bielik nie odpowiada

🧠 MODEL ZAAWANSOWANY: Gemma3 12B
├── Najwyższa jakość (50.39s)
├── Większe okno kontekstowe
├── Najbardziej szczegółowe analizy
└── Używany dla złożonych zadań
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

### **Monitoring GPU:**
- **GPU:** NVIDIA RTX 3060 (12GB VRAM)
- **Wykorzystanie:** ~7,236 MiB przez Ollama
- **Status:** ✅ Optymalne dla wszystkich modeli

### **Logi:**
- Backend: `logs/backend/backend.log`
- Ollama: `logs/ollama/`
- Database: `logs/postgres/`
- GPU Monitoring: `logs/gpu-monitoring/`

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

## 📚 **DOKUMENTACJA**

### **Struktura dokumentacji:**
- **[📖 Dokumentacja główna](docs/README.md)** - Centralny hub dokumentacji
- **[📊 Raporty testowe](docs/reports/)** - Szczegółowe raporty testów
- **[🏗️ Architektura](docs/architecture/)** - Dokumentacja architektury
- **[📋 Przewodniki](docs/guides/)** - Przewodniki użytkownika

### **Kluczowe dokumenty:**
- **[Założenia projektu](docs/architecture/PROJECT_ASSUMPTIONS.md)** - Strategia modeli LLM
- **[Przewodnik routingu](docs/guides/INTENT_ROUTING_GUIDE.md)** - Routing intencji
- **[Historia zmian](CHANGELOG.md)** - Changelog projektu

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
- ✅ Integracja z Ollama (wszystkie modele)
- ✅ System RAG
- ✅ Testy z realnymi modelami LLM
- ✅ Monitoring GPU
- ✅ Strategia fallback modeli

### **Q3 2025:**
- [ ] Rozszerzone agenty AI
- [ ] Integracja z kalendarzem
- [ ] Notyfikacje push
- [ ] Mobile app
- [ ] Auto-scaling dla modeli

### **Q4 2025:**
- [ ] Machine Learning dla predykcji
- [ ] Integracja z sklepami online
- [ ] Social features
- [ ] Analytics dashboard
- [ ] Fine-tuning modeli

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
- Ollama z modelami LLM
- PostgreSQL (opcjonalnie)
- GPU NVIDIA (zalecane)

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