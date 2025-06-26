# 🏗️ STRUKTURA PROJEKTU AIASISSTMARUBO

**Ostatnia aktualizacja:** 26.06.2025  
**Status:** ✅ ZORGANIZOWANA I UPROSZCZONA

---

## 📁 **STRUKTURA KATALOGÓW**

```
AIASISSTMARUBO/
├── 📚 docs/                          # Dokumentacja projektu
│   ├── 📖 README.md                  # Centralny hub dokumentacji
│   ├── 📊 reports/                   # Raporty testowe
│   │   ├── TEST_REPORT_2025-06-26.md
│   │   └── RAPORT_E2E_MODELI_LLM.md
│   ├── 🏗️ architecture/             # Dokumentacja architektury
│   │   ├── PROJECT_ASSUMPTIONS.md
│   │   ├── PROJECT_STRUCTURE.md      # Ten plik
│   │   └── LLM_STRATEGY_UPDATE_SUMMARY.md
│   └── 📋 guides/                    # Przewodniki użytkownika
│       └── INTENT_ROUTING_GUIDE.md
├── 🧪 test-results/                  # Wyniki testów (gitignored)
│   ├── test_results_*.json
│   └── intent_*_test_results_*.json
├── 📊 logs/                          # Logi systemu (gitignored)
│   ├── gpu-monitoring/               # Monitoring GPU
│   │   └── gpu_usage_*.log
│   ├── backend/                      # Logi backendu
│   ├── ollama/                       # Logi Ollama
│   └── postgres/                     # Logi bazy danych
├── 🔧 scripts/                       # Skrypty pomocnicze
│   ├── run_llm_tests.sh
│   ├── monitor_gpu_during_test.sh
│   ├── test_intent_*.py
│   └── test_api_simple.py
├── 🐍 src/backend/                   # Backend Python + FastAPI
│   ├── main.py                       # Instancja FastAPI
│   ├── api/                          # Endpointy API
│   ├── agents/                       # Agenty AI
│   ├── models/                       # Modele SQLAlchemy
│   ├── services/                     # Logika biznesowa
│   ├── core/                         # Komponenty core
│   ├── tests/                        # Testy backendu
│   └── migrations/                   # Migracje Alembic
├── ⚛️ foodsave-frontend/             # Frontend Next.js
│   ├── src/                          # Kod źródłowy
│   ├── components/                   # Komponenty React
│   ├── pages/                        # Strony aplikacji
│   ├── tests/                        # Testy frontendu
│   └── package.json
├── 🐳 docker-compose.yaml            # Konfiguracja Docker
├── 📋 README.md                      # Główny README
├── 📝 CHANGELOG.md                   # Historia zmian
├── 🔧 README_SETUP.md                # Instrukcje instalacji
├── 🐍 pyproject.toml                 # Konfiguracja Python
├── 📦 package.json                   # Konfiguracja Node.js
└── 🚫 .gitignore                     # Pliki ignorowane przez Git
```

---

## 🎯 **ZASADY ORGANIZACJI**

### **📚 Dokumentacja (`docs/`)**
- **Centralny hub:** `docs/README.md` - punkt wejścia do dokumentacji
- **Raporty:** `docs/reports/` - szczegółowe raporty testowe
- **Architektura:** `docs/architecture/` - dokumentacja techniczna
- **Przewodniki:** `docs/guides/` - instrukcje użytkownika

### **🧪 Testy i wyniki (`test-results/`, `logs/`)**
- **Wyniki testów:** `test-results/` - pliki JSON z wynikami
- **Monitoring GPU:** `logs/gpu-monitoring/` - logi wykorzystania GPU
- **Logi systemowe:** `logs/` - logi wszystkich komponentów
- **Gitignored:** Wszystkie pliki tymczasowe są ignorowane przez Git

### **🔧 Skrypty (`scripts/`)**
- **Testy LLM:** `run_llm_tests.sh` - testy modeli z monitoringiem
- **Monitoring GPU:** `monitor_gpu_during_test.sh` - monitoring zasobów
- **Testy API:** `test_*.py` - skrypty testowe

### **🐍 Backend (`src/backend/`)**
- **Clean Architecture:** Separacja warstw (api, services, models)
- **Agenty AI:** `agents/` - inteligentne agenty z fallback
- **Testy:** `tests/` - unit, integration, E2E
- **Migracje:** `migrations/` - zarządzanie bazą danych

### **⚛️ Frontend (`foodsave-frontend/`)**
- **Next.js 14:** App Router, TypeScript strict
- **Komponenty:** `components/` - React components
- **Strony:** `pages/` - strony aplikacji
- **Testy:** `tests/` - Jest + Playwright

---

## 🔄 **PRZEPŁYW DANYCH**

### **Architektura systemu:**
```
🌐 Frontend (Next.js) 
    ↓ HTTP/WebSocket
🔧 Backend (FastAPI)
    ↓ API Calls
🤖 Agenty AI (Ollama LLM)
    ↓ Database
🗄️ PostgreSQL/SQLite
    ↓ Vector Store
🔍 RAG System (ChromaDB)
```

### **Strategia modeli LLM:**
```
🎯 Bielik 11B (domyślny) → 🔄 Mistral 7B (fallback) → 🧠 Gemma3 12B (zaawansowany)
```

---

## 📊 **MONITORING I METRYKI**

### **Health Checks:**
- `/health` - Status systemu
- `/ready` - Gotowość do obsługi
- `/metrics` - Metryki Prometheus

### **Monitoring GPU:**
- **NVIDIA RTX 3060:** 12GB VRAM
- **Wykorzystanie:** ~7,236 MiB przez Ollama
- **Logi:** `logs/gpu-monitoring/`

### **Testy:**
- **E2E:** 14 testów funkcjonalnych
- **LLM:** 3 modele z monitoringiem
- **Pokrycie:** 100% przejścia

---

## 🚀 **DEPLOYMENT**

### **Docker Compose:**
```bash
docker-compose up -d
```

### **Usługi:**
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000
- **Database:** localhost:5432
- **Ollama:** http://localhost:11434

### **Environment:**
- **Development:** `.env` (gitignored)
- **Production:** Docker secrets
- **Testing:** SQLite in-memory

---

## 🔧 **KONFIGURACJA**

### **Backend (Python):**
- **Python:** 3.12+
- **Framework:** FastAPI
- **Database:** SQLAlchemy + Alembic
- **LLM:** Ollama integration
- **Testing:** pytest + pytest-asyncio

### **Frontend (Next.js):**
- **Framework:** Next.js 14
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Testing:** Jest + Playwright

### **Infrastructure:**
- **Containerization:** Docker + Docker Compose
- **Database:** PostgreSQL (prod) / SQLite (dev)
- **Monitoring:** Prometheus + Grafana
- **Logging:** Structured logging

---

## 📋 **PLIKI KONFIGURACYJNE**

### **Główne pliki:**
- `pyproject.toml` - Konfiguracja Python
- `package.json` - Konfiguracja Node.js
- `docker-compose.yaml` - Infrastruktura
- `pytest.ini` - Konfiguracja testów
- `.env.example` - Przykładowe zmienne środowiskowe

### **Dokumentacja:**
- `README.md` - Główny plik projektu
- `CHANGELOG.md` - Historia zmian
- `docs/README.md` - Hub dokumentacji
- `README_SETUP.md` - Instrukcje instalacji

---

## 🎯 **BEST PRACTICES**

### **Kod:**
- **Type hints:** Wszystkie funkcje Python
- **Async/await:** Wydajne operacje I/O
- **Clean Architecture:** Separacja warstw
- **Dependency Injection:** Łatwe testowanie

### **Testy:**
- **Unit tests:** Każda funkcja
- **Integration tests:** Komponenty
- **E2E tests:** Pełny przepływ
- **Coverage:** >90% backend, >80% frontend

### **Dokumentacja:**
- **README:** Zawsze aktualny
- **API docs:** Swagger/OpenAPI
- **Changelog:** Wszystkie zmiany
- **Architecture:** Diagramy i opisy

---

## 🔍 **NAWIGACJA**

### **Szybkie linki:**
- **[📖 Dokumentacja główna](README.md)**
- **[📊 Raporty testowe](docs/reports/)**
- **[🏗️ Architektura](docs/architecture/)**
- **[📋 Przewodniki](docs/guides/)**
- **[🔧 Skrypty](scripts/)**

### **Kluczowe pliki:**
- **[README.md](README.md)** - Start tutaj
- **[docs/README.md](docs/README.md)** - Dokumentacja
- **[CHANGELOG.md](CHANGELOG.md)** - Historia zmian
- **[docker-compose.yaml](docker-compose.yaml)** - Deployment

---

*Ostatnia aktualizacja: 26.06.2025*  
*Status: Zorganizowana i uproszczona* 🚀 