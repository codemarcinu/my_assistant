# FoodSave AI / MyAppAssistant

Inteligentny system zarządzania żywnością z wykorzystaniem AI - analiza paragonów, kategoryzacja produktów, zarządzanie zapasami.

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

## 📚 Dokumentacja

Pełna dokumentacja projektu znajduje się w katalogu [`docs/`](./docs/).

### 📋 Główne Pliki Dokumentacji
- [Spis treści dokumentacji](./docs/TOC.md)
- [Automatyczny indeks wszystkich plików](./docs/INDEX.md)
- [Główny przewodnik i szybki start](./docs/README_MAIN.md)
- [Panel sterowania - przewodnik](./docs/PANEL_STEROWANIA_GUIDE.md)
- [Podsumowanie dokumentacji](./docs/DOCUMENTATION_SUMMARY.md)

### 🔗 Szybkie Linki
- [Dokumentacja API](./docs/API_REFERENCE.md)
- [Architektura systemu](./docs/ARCHITECTURE_DOCUMENTATION.md)
- [Przewodnik testowania](./docs/TESTING_GUIDE.md)
- [Przewodnik wdrażania](./docs/DEPLOYMENT_GUIDE.md)

## 🍽️ Funkcje Systemu

- **📸 Analiza paragonów** - OCR i inteligentna kategoryzacja produktów
- **🏪 Słownik polskich sklepów** - 40+ sieci handlowych
- **🤖 Modele AI Bielik** - Lokalne modele języka polskiego
- **📊 Zarządzanie zapasami** - Predykcja dat ważności
- **🎯 Planowanie posiłków** - Wykorzystanie dostępnych składników
- **🔄 Koordynacja darowizn** - Integracja z organizacjami charytatywnymi

## 🛠️ Technologie

- **Backend**: FastAPI, Python 3.12+, SQLAlchemy
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **AI**: Ollama, Bielik 4.5b/11b, Tesseract OCR
- **Baza danych**: PostgreSQL, Redis, FAISS
- **Infrastruktura**: Docker, Docker Compose, Prometheus, Grafana

## 📊 Status Projektu

- ✅ **Gotowy do produkcji** - System w pełni operacyjny
- ✅ **Testy**: 94.7% pokrycie (89/94 testy jednostkowe)
- ✅ **Dokumentacja**: 41+ plików, kompleksowa
- ✅ **Panel sterowania**: Intuicyjny interfejs zarządzania

## 🤝 Wsparcie

### Rozwiązywanie Problemów
1. Użyj opcji "Sprawdź środowisko" w `./foodsave-all.sh`
2. Sprawdź logi systemu w opcji "Pokaż logi"
3. Zobacz [przewodnik rozwiązywania problemów](./docs/TESTING_GUIDE.md)

### Kontakt
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
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