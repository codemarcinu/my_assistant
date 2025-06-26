# 🚀 FoodSave AI - Frontend

Nowoczesny, responsywny interfejs użytkownika dla FoodSave AI - inteligentnego asystenta zarządzania spiżarnią i zakupami, zbudowany w React 19 + TypeScript + Tailwind CSS v4 + Cosmic Design System.

## ✨ Funkcjonalności

### 🏠 Dashboard
- **WeatherCard**: Aktualna pogoda z ikonami
- **ChatContainer**: Inteligentny chat z AI, loading, skeletony, concise responses
- **Moduły kontekstowe**: PantryModule, ReceiptUploadModule
- **FAB**: Floating Action Button do szybkich akcji

### 📦 Zarządzanie Spiżarnią
- **PantryModule**: Szybki podgląd produktów z terminami, statusy, badge
- **PantryPage**: Pełne zarządzanie (dodawanie, edycja, usuwanie)
- **Kategorie produktów**: Automatyczne sortowanie
- **Alerty terminów**: Produkty z kończącym się terminem

### 🛒 Zarządzanie Zakupami
- **ReceiptUploadModule**: Upload paragonów z OCR, drag&drop, progres, walidacja
- **ShoppingPage**: Historia zakupów i paragonów
- **Analiza paragonów**: Automatyczne wyodrębnianie danych
- **Generowanie list zakupów**: Na podstawie spiżarni

### 📄 Zarządzanie Dokumentami RAG
- **RAGManagerModule**: Pełne zarządzanie dokumentami, upload, kategorie, wyszukiwanie, podgląd, pytania do AI, CRUD

### ⚙️ Ustawienia
- **Zarządzanie modelami AI**: Status Ollama, Tesseract
- **Integracja Telegram**: Bot API configuration
- **Zarządzanie bazą danych**: Export, backup, clear
- **RAG Management**: Pełna sekcja zarządzania dokumentami

### 🎨 Theme System
- **ThemeToggle**: Przełącznik jasny/ciemny
- **localStorage**: Zapisywanie preferencji
- **System preference**: Automatyczne wykrywanie
- **Cosmic Design System**: Spójny system kolorów

## 🏗️ Architektura i Routing

- Routing oparty o React Router v7, lazy loading stron (`Suspense`, `lazy`)
- Sidebar z emoji, aktywne stany, pełna dostępność (ARIA)
- Layout: Sidebar, Header (widget pogody, status), Footer, responsywność (mobile-first)

### Struktura projektu
```
src/
├── components/
│   ├── layout/Sidebar.tsx, Header.tsx, MainLayout.tsx
│   ├── chat/ChatContainer.tsx, ConciseResponseBubble.tsx, ChatBubble.tsx
│   ├── modules/PantryModule.tsx, ReceiptUploadModule.tsx, RAGManagerModule.tsx
│   └── ui/ (Button, Badge, Card, Modal, Input, Spinner, LoadingSpinner, ErrorFallback)
├── pages/
│   ├── DashboardPage.tsx, PantryPage.tsx, ShoppingPage.tsx, SettingsPage.tsx
└── App.tsx
```

## 💬 Chat System

- Komponent czatu (`ChatContainer`) korzysta z globalnego store (Zustand), obsługuje loading, skeletony, zwięzłe odpowiedzi AI (ConciseResponseBubble)
- Przykładowe komendy aktywują odpowiednie moduły (np. „co mam do jedzenia” → PantryModule)
- Zwięzłe odpowiedzi AI są wyświetlane w specjalnych bąbelkach z typem (info, warning, success, error)
- Pełna obsługa trybu jasny/ciemny, automatyczne przewijanie, loading spinner

## 📦 Moduły

- **PantryModule**: szybki podgląd produktów, statusy (świeży, kończy się, przeterminowany), badge, mock API
- **ReceiptUploadModule**: drag&drop, progres uploadu, walidacja, UX feedback, obsługa PDF/JPG/PNG
- **RAGManagerModule**: upload, kategorie, wyszukiwanie, podgląd, pytania do AI, CRUD

## 🧩 UI/UX

- Wszystkie komponenty UI zgodne z Cosmic Design System, typowane, dostępne, modularne
- Animacje: fade-in, bounce-in, skeletony, transitions
- Pełna obsługa trybu jasny/ciemny, automatyczne wykrywanie, localStorage

## 🧪 Testowanie

- Kod gotowy do testów jednostkowych (Vitest, Testing Library) i e2e (Playwright)
- Przykładowe komendy testowe:
```bash
npm run test
npm run test:e2e
npm run test:coverage
```

## 🔄 Integracja z Backendem

- API endpoints są mockowane, gotowe do podmiany na realne
- Opisane endpointy dla czatu, spiżarni, paragonów, RAG

## 🚀 Szybki Start

### Wymagania
```bash
Node.js >= 18
npm >= 9
```

### Instalacja
```bash
cd foodsave-frontend
npm install
```

### Development
```bash
npm run dev
# Otwórz http://localhost:3000
```

### Build
```bash
npm run build
npm run preview
```

### Docker Compose

- Frontend uruchamiany jest przez `docker-compose.yaml` z katalogu głównego projektu.
- Port domyślny: 3000
- Hot reload i healthcheck w trybie dev.

### Docker (standalone)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 🎯 Roadmap i Zaawansowane Funkcje

- Lazy loading, code splitting, skeletony, optymalizacja bundle
- Gotowość pod PWA, WebSocket, push notifications, CI/CD, monitoring
- Pełna zgodność z `.cursorrules` (typy, error boundaries, podział na małe funkcje, docstringi, brak any, accessibility, brak mutowalnych domyślnych argumentów, importy absolutne)

## 📄 Licencja

MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

---

**FoodSave AI Frontend** – Nowoczesny, responsywny interfejs użytkownika z Cosmic Design System, pełną obsługą RAG i polskim UI. 🚀
