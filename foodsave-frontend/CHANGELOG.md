# 📝 FoodSave AI Frontend – Changelog

## [Unreleased] – 2024-06-xx

### 🔧 Naprawy i optymalizacje

- **Naprawa błędów streaming response w backendzie**
  - Rozwiązanie błędu "TypeError: 'coroutine' object is not iterable" w streaming HTTP responses
  - Konwersja synchronicznych generatorów na asynchroniczne w LLM client
  - Implementacja robust pattern z threading i queue dla kompatybilności z FastAPI streaming
  - Aktualizacja endpointów `/api/chat` i `/api/v2/chat` dla prawidłowej obsługi streaming responses
  - Zastosowanie best practices dla asynchronicznego streamingu w FastAPI

- **Optymalizacja konfiguracji API**
  - Usunięcie niepotrzebnych kluczy API: `WEATHER_API_KEY`, `NEWS_API_KEY`, `BING_SEARCH_API_KEY`
  - Uproszczenie konfiguracji weather agent - tylko `OPENWEATHER_API_KEY`
  - Usunięcie newsapi i bing search z domyślnej konfiguracji web search
  - Zachowanie tylko Wikipedia jako źródło wyszukiwania (bez klucza API)

### 🚀 Najważniejsze zmiany

- **Nowa architektura frontendu**
  - Przebudowa routingu na React Router v7 z lazy loadingiem (`Suspense`, `lazy`).
  - Nowy layout: Sidebar (emoji, aktywne stany, ARIA), Header (widget pogody, status), Footer, pełna responsywność (mobile-first).

- **System czatu**
  - Nowy komponent `ChatContainer` z obsługą loading, skeletonów, concise responses (bąbelki z typem: info, warning, success, error).
  - Globalny store (Zustand) do zarządzania stanem czatu.
  - Przykładowe komendy aktywujące odpowiednie moduły (np. "co mam do jedzenia" → PantryModule).

- **Moduły**
  - **PantryModule**: szybki podgląd produktów, statusy (świeży, kończy się, przeterminowany), badge, mock API.
  - **ReceiptUploadModule**: drag&drop, progres uploadu, walidacja, UX feedback, obsługa PDF/JPG/PNG.
  - **RAGManagerModule**: upload, kategorie, wyszukiwanie, podgląd, pytania do AI, CRUD.

- **UI/UX**
  - Wszystkie komponenty UI zgodne z Cosmic Design System, typowane, dostępne, modularne.
  - Animacje: fade-in, bounce-in, skeletony, transitions.
  - Pełna obsługa trybu jasny/ciemny, automatyczne wykrywanie, localStorage.

- **Testowanie**
  - Kod gotowy do testów jednostkowych (Vitest, Testing Library) i e2e (Playwright).
  - Przykładowe komendy testowe: `npm run test`, `npm run test:e2e`, `npm run test:coverage`.

- **Integracja z backendem**
  - API endpoints mockowane, gotowe do podmiany na realne.
  - Opisane endpointy dla czatu, spiżarni, paragonów, RAG.

- **Zaawansowane funkcje i roadmap**
  - Lazy loading, code splitting, skeletony, optymalizacja bundle.
  - Gotowość pod PWA, WebSocket, push notifications, CI/CD, monitoring.
  - Pełna zgodność z `.cursorrules` (typy, error boundaries, podział na małe funkcje, docstringi, brak any, accessibility, brak mutowalnych domyślnych argumentów, importy absolutne).

### 🗂️ Zaktualizowane pliki
- `README.md` – pełna aktualizacja opisu architektury, funkcji, testowania, roadmapy.
- `FRONTEND_IMPLEMENTATION.md` – szczegółowa dokumentacja implementacji, struktury projektu, UI/UX, testowania, integracji.

## [Unreleased]
- Dodano integracyjny test backendu dla endpointu /api/v2/chat/stream (FastAPI)
---

**Uwaga:**  
Zmiany te stanowią duży krok w stronę produkcyjnej gotowości frontendu, zapewniając nowoczesny, modularny i w pełni typowany kod zgodny z najlepszymi praktykami. 