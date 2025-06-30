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