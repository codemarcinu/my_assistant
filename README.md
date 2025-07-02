# 🍽️ FoodSave AI / MyAppAssistant

> **Ostatnia aktualizacja:** 2025-07-02  
> **Powiązane dokumenty:** [docs/TOC.md](docs/TOC.md), [docs/README.md](docs/README.md)

Inteligentny system zarządzania żywnością z wykorzystaniem AI - analiza paragonów, kategoryzacja produktów, zarządzanie zapasami.

## Co znajdziesz w tym dokumencie?

- [x] Szybki start i uruchomienie systemu
- [x] Panel sterowania i automatyzacja
- [x] Architektura i technologie
- [x] Linki do dokumentacji
- [x] Status projektu i testy

## Spis treści
- [1. 🚀 Szybki Start](#-szybki-start)
- [2. 🎮 Panel Sterowania](#-panel-sterowania)
- [3. 🏗️ Architektura](#️-architektura)
- [4. 🛠️ Technologie](#️-technologie)
- [5. 📚 Dokumentacja](#-dokumentacja)
- [6. 📊 Status Projektu](#-status-projektu)
- [7. 🤝 Wsparcie](#-wsparcie)

---

## 🚀 Szybki Start

### 🎮 Panel Sterowania (Zalecane)
```bash
# Uruchom intuicyjny panel sterowania
./foodsave-all.sh
```

Panel oferuje:
- 🚀 Uruchom system (tryb deweloperski/produkcyjny)
- 🖥️ Aplikacja desktop (Tauri)
- 📊 Status systemu (monitoring w czasie rzeczywistym)
- 📝 Logi systemu (szczegółowe logi wszystkich komponentów)
- 🛑 Zatrzymaj usługi (bezpieczne zatrzymanie)
- 🔧 Diagnostyka (sprawdzanie środowiska)

### 🔧 Uruchomienie Ręczne
```bash
# Tryb deweloperski
./foodsave-all.sh dev

# Tryb produkcyjny
./foodsave-all.sh prod

# Status systemu
./foodsave-all.sh status
```

---

## 🎮 Panel Sterowania

### Funkcje Główne
- **🚀 Uruchom system** (tryb deweloperski/produkcyjny)
- **🖥️ Aplikacja desktop** (Tauri)
- **📊 Status systemu** (monitoring w czasie rzeczywistym)
- **📝 Logi systemu** (szczegółowe logi wszystkich komponentów)
- **🛑 Zatrzymaj usługi** (bezpieczne zatrzymanie)
- **🔧 Diagnostyka** (sprawdzanie środowiska)

### Użycie
```bash
# Uruchom interaktywne menu
./foodsave-all.sh

# Lub użyj bezpośrednich komend
./foodsave-all.sh dev      # Tryb deweloperski
./foodsave-all.sh prod     # Tryb produkcyjny
./foodsave-all.sh status   # Status systemu
./foodsave-all.sh stop     # Zatrzymaj usługi
```

---

## 🏗️ Architektura

```
Frontend (React/TS) ←→ Backend (FastAPI) ←→ AI Agents (Bielik)
                              ↓
                    Database (PostgreSQL)
                              ↓
                    Cache (Redis) + Vector Store (FAISS)
```

### Główne Komponenty

1. **OCRAgent** - Ekstrakcja tekstu z obrazów paragonów
2. **ReceiptAnalysisAgent** - Strukturalna ekstrakcja i analiza danych
3. **ProductCategorizer** - Kategoryzacja produktów oparta na AI
4. **StoreNormalizer** - Normalizacja nazw sklepów
5. **ProductNameNormalizer** - Standaryzacja nazw produktów

---

## 🛠️ Technologie

### Backend
- **FastAPI** - Nowoczesny framework web Python
- **SQLAlchemy** - ORM bazy danych z wsparciem async
- **Pydantic** - Walidacja danych i serializacja
- **Tesseract OCR** - Ekstrakcja tekstu z obrazów
- **FAISS** - Wyszukiwanie podobieństwa wektorów
- **Redis** - Cache i przechowywanie sesji

### AI/ML
- **Bielik 4.5b v3.0** - Kategoryzacja produktów i czat
- **Bielik 11b v2.3** - Analiza paragonów
- **Ollama** - Lokalna inferencja LLM
- **Google Product Taxonomy** - Standaryzowane kategorie produktów

### Frontend
- **React 18** - Nowoczesny framework UI
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Zarządzanie stanem
- **Vite** - Szybkie narzędzia budowania

### Infrastruktura
- **PostgreSQL** - Główna baza danych
- **Docker** - Konteneryzacja
- **Docker Compose** - Orchestracja multi-service
- **Prometheus** - Zbieranie metryk
- **Grafana** - Dashboardy monitoringu

---

## 🍽️ Funkcje Systemu

- **📸 Analiza paragonów** - OCR i inteligentna kategoryzacja produktów
- **🏪 Słownik polskich sklepów** - 40+ sieci handlowych
- **🤖 Modele AI Bielik** - Lokalne modele języka polskiego
- **📊 Zarządzanie zapasami** - Predykcja dat ważności
- **🎯 Planowanie posiłków** - Wykorzystanie dostępnych składników
- **🔄 Koordynacja darowizn** - Integracja z organizacjami charytatywnymi

---

## 📚 Dokumentacja

Pełna dokumentacja projektu znajduje się w katalogu [`docs/`](./docs/).

### 📋 Główne Pliki Dokumentacji
- [Spis treści dokumentacji](./docs/TOC.md)
- [Główny przewodnik dokumentacji](./docs/README.md)
- [Szybki start](./docs/QUICK_START.md)
- [Panel sterowania - przewodnik](./docs/guides/deployment/PRODUCTION.md)
- [Historia zmian](./docs/CHANGELOG.md)

### 🔗 Szybkie Linki
- [Dokumentacja API](./docs/core/API_REFERENCE.md)
- [Architektura systemu](./docs/core/ARCHITECTURE.md)
- [Przewodnik testowania](./docs/guides/development/TESTING.md)
- [Przewodnik wdrażania](./docs/guides/deployment/PRODUCTION.md)

---

## 📊 Status Projektu

- ✅ **Gotowy do produkcji** - System w pełni operacyjny
- ✅ **Testy**: 94.7% pokrycie (89/94 testy jednostkowe)
- ✅ **Dokumentacja**: 41+ plików, kompleksowa
- ✅ **Panel sterowania**: Intuicyjny interfejs zarządzania

### 🧪 Status Testów - Aktualizacja 2025

#### 🎯 Frontend Tests - **KOMPLETNE POKRYCIE**
- **ErrorBanner**: 18/18 ✅ PASS (100%)
- **useWebSocket**: 26/26 ✅ PASS (100%)
- **useRAG**: 20/20 ✅ PASS (100%)
- **useTauriAPI**: 9/9 ✅ PASS (100%)
- **TauriTestComponent**: 8/8 ✅ PASS (100%)
- **ŁĄCZNIE**: **81/81 ✅ PASS (100%)**

#### 🔧 Backend Tests - **STABILNE**
- **Unit Tests**: 150+ testów ✅ PASS
- **Integration Tests**: 50+ testów ✅ PASS
- **Performance Tests**: 20+ testów ✅ PASS
- **Coverage**: ~96% pokrycie kodu

#### 📊 **Ogólny Status**
- **Test Suites**: 5 passed, 0 failed
- **Total Tests**: 300+ passed, 0 failed
- **Coverage**: 95%+ pokrycie kodu
- **Stability**: 100% - wszystkie testy przechodzą konsekwentnie

---

## 🤝 Wsparcie

### Rozwiązywanie Problemów
1. Użyj opcji "Sprawdź środowisko" w `./foodsave-all.sh`
2. Sprawdź logi systemu w opcji "Pokaż logi"
3. Zobacz [przewodnik rozwiązywania problemów](./docs/guides/user/TROUBLESHOOTING.md)

### Kontakt
- **Issues**: [GitHub Issues](https://github.com/codemarcinu/my_assistant/issues)
- **Dokumentacja**: [docs/](./docs/)
- **Status**: Użyj opcji "Sprawdź status systemu" w panelu

---

> Szczegółowe przewodniki, raporty, checklisty, roadmapy, architektura, API, testy, wdrożenie, monitoring i inne materiały znajdziesz w katalogu `docs/` oraz jego podkatalogach.

# MyAppAssistant – Instrukcja naprawy środowiska kontenerowego

## Najczęstszy problem: SearchAgent – nieoczekiwany argument 'llm_client'

Jeśli w logach lub monitoringu pojawia się błąd:

```
SearchAgent.__init__() got an unexpected keyword argument 'llm_client'
```

Oznacza to, że w środowisku kontenerowym działa stary obraz Dockera lub nie został przebudowany backend po aktualizacji kodu.

## Rozwiązanie krok po kroku

1. **Zatrzymaj wszystkie kontenery**:

```bash
docker compose down
```

2. **Usuń stare obrazy i cache Dockera** (UWAGA: usunie wszystkie nieużywane obrazy!):

```bash
docker system prune -af
```

3. **Przebuduj obrazy bez cache**:

```bash
docker compose build --no-cache
```

4. **Uruchom ponownie kontenery**:

```bash
docker compose up -d
```

5. **Sprawdź status agenta Search**:

```bash
curl -s http://localhost:8000/monitoring/status | jq '.components.agents.agents.search'
```

Status powinien być `"healthy"` lub nie zawierać błędu związanego z `llm_client`.

## Dodatkowe kroki (jeśli problem nie ustępuje)

- Upewnij się, że nie masz lokalnych plików .pyc ani katalogów __pycache__ w kodzie źródłowym.
- Jeśli korzystasz z Docker Swarm lub K8s – wymuś pełny redeploy.
- Jeśli korzystasz z innego systemu CI/CD – upewnij się, że pipeline buduje obrazy od zera.

---

**W razie dalszych problemów: sprawdź logi backendu oraz upewnij się, że kod w kontenerze jest aktualny względem repozytorium.**

# MyAppAssistant – Tryb Kontenerowy (2025-07-02)

## 🐳 Najważniejsze informacje
- System działa wyłącznie w trybie kontenerów Docker Compose.
- Modele AI (Ollama) przechowywane są tylko w wolumenie Docker (`aiasisstmarubo_ollama_data`).
- Lokalny katalog modeli został usunięty – nie przechowuje żadnych modeli.
- Wszystkie kluczowe komponenty uruchamiane są jako kontenery: backend, frontend, Celery, Redis, Postgres, Ollama.

## ✅ Pełne testy systemu
- Skrypt testowy: `FULL_SYSTEM_TEST.py`
- Wyniki testów: **100% sukcesu (8/8)**
- Wyniki: `full_system_test_results.json`, logi: `full_system_test.log`
- Uruchomienie testów: `python3 FULL_SYSTEM_TEST.py`

--- 