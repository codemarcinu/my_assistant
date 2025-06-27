# 📚 Dokumentacja AIASISSTMARUBO

**Ostatnia aktualizacja:** 26.06.2025  
**Status:** ✅ Production Ready

---

## 🎯 **O PROJEKCIE**

AIASISSTMARUBO to zaawansowany system AI do zarządzania żywnością, który łączy inteligentne agenty AI, OCR paragonów, bazę danych produktów, system RAG oraz integracje z pogodą i wiadomościami.

---

## 📖 **STRUKTURA DOKUMENTACJI**

### 🚀 **Rozpoczęcie pracy**
- **[README.md](../README.md)** - Główny plik projektu z szybkim startem
- **[README_SETUP.md](../README_SETUP.md)** - Szczegółowe instrukcje instalacji
- **[CHANGELOG.md](../CHANGELOG.md)** - Historia zmian i wersji

### 🧠 **Architektura i strategia**
- **[PROJECT_ASSUMPTIONS.md](../PROJECT_ASSUMPTIONS.md)** - Założenia projektu i strategia modeli LLM
- **[INTENT_ROUTING_GUIDE.md](../INTENT_ROUTING_GUIDE.md)** - Przewodnik po routingu intencji
- **[LLM_STRATEGY_UPDATE_SUMMARY.md](../LLM_STRATEGY_UPDATE_SUMMARY.md)** - Podsumowanie strategii LLM

### 📊 **Raporty i testy**
- **[TEST_REPORT_2025-06-26.md](../TEST_REPORT_2025-06-26.md)** - Szczegółowy raport testowy
- **[RAPORT_E2E_MODELI_LLM.md](../RAPORT_E2E_MODELI_LLM.md)** - Raport testów E2E modeli LLM
- **[TELEGRAM_BOT_INTEGRATION_REPORT.md](TELEGRAM_BOT_INTEGRATION_REPORT.md)** - Raport integracji z Telegram

### 🏗️ **Dokumentacja techniczna**
- **[API Documentation](../src/backend/README.md)** - Dokumentacja API backendu
- **[Frontend Documentation](../myappassistant-chat-frontend/README.md)** - Dokumentacja frontendu
- **[Docker Documentation](../docker-compose.yaml)** - Konfiguracja kontenerów

---

## 🔍 **SZYBKIE LINKI**

### **Uruchomienie systemu**
```bash
# Szybki start
./run_project.sh

# Lub ręcznie
docker-compose up -d
```

### **Testy**
```bash
# Testy E2E
cd src/backend && python -m pytest tests/test_production_e2e.py -v

# Testy modeli LLM
./run_llm_tests.sh
```

### **API Endpoints**
- **Swagger UI:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health
- **Metrics:** http://localhost:8000/metrics

---

## 📈 **STATUS PROJEKTU**

### **✅ Zrealizowane funkcjonalności**
- 🤖 Integracja z Ollama LLM (3 modele z fallback)
- 📷 OCR paragonów (Tesseract)
- 🗄️ Baza danych produktów (PostgreSQL/SQLite)
- 🔍 System RAG (Retrieval-Augmented Generation)
- 🌤️ Integracja z pogodą i wiadomościami
- 📊 Monitoring i metryki (Prometheus)
- 🐳 Docker Compose z health checks
- 🧪 Testy E2E (100% przejścia)

### **🎯 Model domyślny: Bielik 11B Q4_K_M**
- **Czas odpowiedzi:** 37.40s (najszybszy)
- **Język:** Polski (nativne wsparcie)
- **GPU Memory:** 7,236 MiB
- **Status:** ✅ Produkcyjny

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

## 📞 **KONTAKT**

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)

---

*Ostatnia aktualizacja: 26.06.2025*  
*Status: Production Ready* 🚀 