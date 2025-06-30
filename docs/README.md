# FoodSave AI - Inteligentny System Zarządzania Żywnością

## 🍽️ Przegląd Systemu

FoodSave AI to zaawansowany system analizy paragonów i zarządzania żywnością, wykorzystujący sztuczną inteligencję do automatycznego przetwarzania, kategoryzacji i analizy zakupów spożywczych. System jest zoptymalizowany dla polskiego rynku i obsługuje ponad 40 sieci handlowych.

## 🚀 Kluczowe Funkcje

### 📸 Zaawansowana Analiza Paragonów
- **OCR Processing**: Ekstrakcja tekstu z obrazów paragonów używając Tesseract OCR
- **Inteligentna Kategoryzacja**: Kategoryzacja produktów używając modeli Bielik AI + Google Product Taxonomy
- **Normalizacja Sklepów**: Automatyczna normalizacja nazw sklepów używając słownika polskich sklepów
- **Normalizacja Nazw Produktów**: Czyszczenie i standaryzacja nazw produktów
- **Strukturalna Ekstrakcja Danych**: Wyciąganie informacji o sklepie, produktach, cenach, datach i VAT

### 🤖 Komponenty AI
- **Bielik 4.5b v3.0**: Kategoryzacja produktów i ogólna konwersacja
- **Bielik 11b v2.3**: Analiza paragonów i strukturalna ekstrakcja danych
- **Hybrydowe Podejście**: Łączy inteligencję AI z dopasowaniem słownikowym
- **Ocena Pewności**: Wiele mechanizmów fallback z poziomami pewności

### 🏪 Fokus na Polski Rynek
- **40+ Polskich Sklepów**: Kompleksowy słownik polskich sieci handlowych
- **35 Kategorii FMCG**: Filtrowana Google Product Taxonomy dla polskiego rynku
- **100+ Reguł Produktów**: Normalizacja nazw produktów dla popularnych polskich produktów
- **Obsługa VAT**: Polskie stawki VAT i obliczenia

### 🎯 Inteligentna Kategoryzacja
- **Kategorie Wielopoziomowe**: Hierarchiczna kategoryzacja produktów
- **Wsparcie Dwujęzyczne**: Polskie i angielskie nazwy kategorii
- **Dopasowanie Słów Kluczowych**: Szybka kategoryzacja dla znanych produktów
- **Fallback AI**: Bielik AI dla nieznanych produktów

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

## 📊 Przepływ Danych

```
Obraz Paragonu → OCR → Analiza Tekstu → Dane Strukturalne
                                    ↓
                            Kategoryzacja Produktów (Bielik + GPT)
                            Normalizacja Sklepu
                            Normalizacja Nazwy Produktu
                                    ↓
                            Odpowiedź JSON z Metadanymi
```

## 🛠️ Stack Technologiczny

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

## 🚀 Szybki Start

### Wymagania
- Docker i Docker Compose
- Python 3.12+
- Node.js 18+

### 1. Klonowanie Repozytorium
```bash
git clone <repository-url>
cd AIASISSTMARUBO
```

### 2. Uruchomienie Systemu (Nowy Skrypt)
```bash
# Uruchom intuicyjny panel sterowania
./foodsave-all.sh

# Lub użyj tradycyjnych komend
docker-compose up -d
```

### 3. Pobranie Modeli Bielik
```bash
# Pobierz wymagane modele Bielik
docker exec -it ollama ollama pull bielik-4.5b-v3.0
docker exec -it ollama ollama pull bielik-11b-v2.3
```

### 4. Dostęp do Aplikacji
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Monitoring**: http://localhost:3001

## 🎮 Panel Sterowania (foodsave-all.sh)

Nowy intuicyjny skrypt `foodsave-all.sh` oferuje:

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

## 📖 Dokumentacja API

### Endpointy Analizy Paragonów

#### Upload Paragonu
```http
POST /api/v2/receipts/upload
Content-Type: multipart/form-data

file: [obraz_paragonu]
```

#### Analiza Paragonu
```http
POST /api/v2/receipts/analyze
Content-Type: application/x-www-form-urlencoded

ocr_text: [wyekstrahowany_tekst]
```

### Przykładowa Odpowiedź
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

## 📁 Struktura Projektu

```
AIASISSTMARUBO/
├── src/backend/                 # Aplikacja backend
│   ├── agents/                  # Agenty AI
│   ├── api/                     # Endpointy API
│   ├── core/                    # Serwisy główne
│   ├── models/                  # Modele danych
│   └── tests/                   # Testy backend
├── myappassistant-chat-frontend/ # Aplikacja frontend
│   ├── src/                     # Komponenty React
│   ├── components/              # Komponenty UI
│   └── tests/                   # Testy frontend
├── data/config/                 # Pliki konfiguracyjne
│   ├── filtered_gpt_categories.json
│   ├── polish_stores.json
│   └── product_name_normalization.json
├── docs/                        # Dokumentacja
├── monitoring/                  # Setup monitoringu
├── foodsave-all.sh             # Panel sterowania
└── docker-compose.yaml          # Konfiguracja Docker
```

## 🔧 Konfiguracja

### Zmienne Środowiskowe
```bash
# Backend
BACKEND_PORT=8000
DATABASE_URL=postgresql://user:pass@localhost/foodsave
REDIS_URL=redis://localhost:6379

# AI Models
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
BIELIK_MODEL=bielik-4.5b-v3.0

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Pliki Konfiguracyjne
- `data/config/filtered_gpt_categories.json` - Kategorie produktów
- `data/config/polish_stores.json` - Słownik polskich sklepów
- `data/config/product_name_normalization.json` - Reguły normalizacji

## 📊 Status Projektu

### 🏆 Kluczowe Osiągnięcia
- **Gotowy do Produkcji**: System w pełni operacyjny
- **Pokrycie Testów**: 94.7% (89/94 testy jednostkowe przechodzą)
- **Testy Integracyjne**: 100% (6/6 przechodzi)
- **Testy Agentów**: 100% (31/31 przechodzi)
- **Testy E2E**: 92.3% (12/13 przechodzi)
- **Wydajność**: Doskonała (< 1s czasy odpowiedzi)

### 🏗️ Architektura
- **System Multi-Agent**: 38 wyspecjalizowanych agentów AI
- **Integracja RAG**: Zaawansowany system retrieval
- **Mikrousługi**: Pełna konteneryzacja Docker
- **Monitoring**: Kompletny stack obserwowalności

## 📚 Dokumentacja

### Główne Pliki Dokumentacji
- **[README_MAIN.md](docs/README_MAIN.md)** - Główny przewodnik projektu
- **[TOC.md](docs/TOC.md)** - Spis treści wszystkich dokumentów
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Kompletna dokumentacja API
- **[ARCHITECTURE_DOCUMENTATION.md](docs/ARCHITECTURE_DOCUMENTATION.md)** - Architektura systemu
- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Przewodnik testowania
- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Przewodnik wdrażania

### Szybkie Linki
- [Panel Sterowania](./foodsave-all.sh)
- [Dokumentacja API](docs/API_REFERENCE.md)
- [Architektura](docs/ARCHITECTURE_DOCUMENTATION.md)
- [Testy](docs/TESTING_GUIDE.md)
- [Wdrażanie](docs/DEPLOYMENT_GUIDE.md)

## 🤝 Wsparcie

### Rozwiązywanie Problemów
1. Użyj opcji "Sprawdź środowisko" w `foodsave-all.sh`
2. Sprawdź logi systemu w opcji "Pokaż logi"
3. Zobacz [przewodnik rozwiązywania problemów](docs/TESTING_GUIDE.md)

### Kontakt
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Dokumentacja**: [docs/](docs/)
- **Status**: [Panel sterowania](./foodsave-all.sh)

## 📄 Licencja

Ten projekt jest licencjonowany pod licencją MIT - zobacz plik [LICENSE](LICENSE) dla szczegółów.

---

**FoodSave AI** - Inteligentne zarządzanie żywnością z wykorzystaniem AI 🍽️🤖 