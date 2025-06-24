# 🚀 Frontend Implementation - FoodSave AI

## 📋 Przegląd Projektu

Kompletna implementacja frontendu dla FoodSave AI - inteligentnego asystenta zarządzania spiżarnią i zakupami, zbudowana w React 19 + TypeScript + Tailwind CSS v4 + Cosmic Design System.

## 🎨 Cosmic Design System

### Kolory
```css
/* Podstawowe kolory */
--cosmic-bg: #ffffff
--cosmic-text: #1a1a1a
--cosmic-primary-container-bg: #f8f9fa

/* Akcje */
--cosmic-bright-green: #10b981
--cosmic-accent-green: #059669
--cosmic-bright-red: #ef4444
--cosmic-red: #dc2626

/* Neutralne */
--cosmic-neutral-0: #ffffff
--cosmic-neutral-1: #f8f9fa
--cosmic-neutral-2: #e9ecef
--cosmic-neutral-3: #dee2e6
--cosmic-neutral-4: #ced4da
--cosmic-neutral-5: #adb5bd
--cosmic-neutral-6: #6c757d
--cosmic-neutral-7: #495057
--cosmic-neutral-8: #343a40
--cosmic-neutral-9: #212529

/* Akcenty */
--cosmic-accent: #3b82f6
--cosmic-ext-blue: #1d4ed8
--cosmic-accent-blue: #2563eb
--cosmic-blue: #1e40af
--cosmic-ext-yellow: #f59e0b
--cosmic-yellow: #d97706
```

## 🏗️ Architektura

### Struktura Komponentów
```
src/
├── components/
│   ├── ThemeToggle.tsx          # Przełącznik trybu jasny/ciemny
│   ├── Layout.tsx               # Główny layout z sidebar
│   ├── WeatherCard.tsx          # Karta pogody
│   ├── ChatBox.tsx              # Interfejs czatu
│   ├── modules/
│   │   ├── PantryModule.tsx     # Szybki podgląd spiżarni
│   │   ├── ReceiptUploadModule.tsx # Upload paragonów OCR
│   │   └── RAGManagerModule.tsx # Zarządzanie dokumentami RAG
│   └── ui/                      # Komponenty UI
├── pages/
│   ├── DashboardPage.tsx        # Strona główna
│   ├── PantryPage.tsx           # Zarządzanie spiżarnią
│   ├── ShoppingPage.tsx         # Historia zakupów
│   └── SettingsPage.tsx         # Ustawienia + RAG
└── App.tsx                      # Główny komponent aplikacji
```

## 🎯 Funkcjonalności

### 1. **Dashboard (Strona Główna)**
- **WeatherCard**: Aktualna pogoda z ikonami
- **ChatBox**: Interfejs czatu z AI
- **Moduły kontekstowe**: PantryModule, ReceiptUploadModule
- **FAB**: Floating Action Button do szybkich akcji

### 2. **Zarządzanie Spiżarnią**
- **PantryModule**: Szybki podgląd produktów z terminami
- **PantryPage**: Pełne zarządzanie (dodawanie, edycja, usuwanie)
- **Kategorie produktów**: Automatyczne sortowanie
- **Alerty terminów**: Produkty z kończącym się terminem

### 3. **Zarządzanie Zakupami**
- **ReceiptUploadModule**: Upload paragonów z OCR
- **ShoppingPage**: Historia zakupów i paragonów
- **Analiza paragonów**: Automatyczne wyodrębnianie danych
- **Generowanie list zakupów**: Na podstawie spiżarni

### 4. **Zarządzanie Dokumentami RAG**
- **RAGManagerModule**: Pełne zarządzanie dokumentami
- **Upload**: Wszystkie formaty plików
- **Kategorie**: Umowy, Faktury, Notatki, Inne
- **Wyszukiwanie**: Po nazwie i kategorii
- **Podgląd**: Modal z treścią dokumentu
- **Pytania do AI**: Zadawanie pytań do dokumentów
- **Usuwanie**: Bezpieczne usuwanie dokumentów

### 5. **Ustawienia**
- **Zarządzanie modelami AI**: Status Ollama, Tesseract
- **Integracja Telegram**: Bot API configuration
- **Zarządzanie bazą danych**: Export, backup, clear
- **RAG Management**: Pełna sekcja zarządzania dokumentami

### 6. **Theme System**
- **ThemeToggle**: Przełącznik jasny/ciemny
- **localStorage**: Zapisywanie preferencji
- **System preference**: Automatyczne wykrywanie
- **Cosmic Design System**: Spójny system kolorów

## 🎨 Design System

### Responsywność
- **Mobile-first**: Optymalizacja dla urządzeń mobilnych
- **Breakpoints**: sm, md, lg, xl
- **Flexbox/Grid**: Nowoczesne layouty

### Animacje
```css
/* Przejścia */
transition-all duration-300
animate-fade-in
animate-bounce-in

/* Hover effects */
hover:bg-cosmic-accent-green
hover:scale-105
```

### Accessibility
- **ARIA labels**: Pełne wsparcie dla screen readerów
- **Focus management**: Widoczne focus states
- **Keyboard navigation**: Pełna obsługa klawiatury
- **Color contrast**: Wysoki kontrast w obu trybach

## 🔧 Technologie

### Core
- **React 19**: Najnowsza wersja z concurrent features
- **TypeScript**: Pełne typowanie
- **Vite**: Szybki bundler i dev server

### Styling
- **Tailwind CSS v4**: Najnowsza wersja z CSS variables
- **Cosmic Design System**: Własny system kolorów
- **PostCSS**: Advanced CSS processing

### UI Components
- **Modal**: Reusable modal system
- **Input**: Enhanced input components
- **Button**: Consistent button system
- **Card**: Flexible card components

## 🚀 Instalacja i Uruchomienie

### Wymagania
```bash
Node.js >= 18
npm >= 9
```

### Instalacja
```bash
cd myappassistant-chat-frontend
npm install
```

### Development
```bash
npm run dev
# http://localhost:5173
```

### Build
```bash
npm run build
npm run preview
```

## 📱 Routing i Nawigacja

### Struktura Stron
- **Dashboard**: `/` - Strona główna z chatem i modułami
- **Pantry**: `/pantry` - Zarządzanie spiżarnią
- **Shopping**: `/shopping` - Historia zakupów
- **Settings**: `/settings` - Ustawienia + RAG

### Sidebar Navigation
- **Ikony**: Emoji-based navigation
- **Active states**: Wizualne wskazanie aktywnej strony
- **Hover effects**: Smooth transitions

## 💬 Chat System

### Komendy Głosowe
```typescript
// Przykładowe komendy
"co mam do jedzenia" → PantryModule
"nowy paragon" → ReceiptUploadModule
"ustawienia" → SettingsPage
"jak mogę ci pomóc" → Help response
```

### AI Responses
- **Mock responses**: Symulowane odpowiedzi AI
- **Context awareness**: Aktywacja odpowiednich modułów
- **Natural language**: Polski język interfejsu

## 🔍 RAG System (Retrieval-Augmented Generation)

### Funkcjonalności
- **Upload dokumentów**: Wszystkie formaty (PDF, DOCX, TXT, etc.)
- **Kategoryzacja**: Umowy, Faktury, Notatki, Inne
- **Wyszukiwanie**: Po nazwie i kategorii
- **Podgląd**: Modal z treścią dokumentu
- **AI Integration**: Pytania do dokumentów
- **CRUD operations**: Pełne zarządzanie

### Mock Data
```typescript
const initialDocs: RAGDocument[] = [
  { id: '1', name: 'umowa_2024.pdf', category: 'Umowy', date: '2024-06-24', type: 'PDF', content: 'Treść umowy 2024...' },
  { id: '2', name: 'notatka.txt', category: 'Notatki', date: '2024-06-20', type: 'TXT', content: 'To jest przykładowa notatka.' },
  { id: '3', name: 'faktura_123.docx', category: 'Faktury', date: '2024-06-10', type: 'DOCX', content: 'Faktura za usługi...' },
];
```

## 🧪 Testowanie

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

## 📦 Build i Deployment

### Production Build
```bash
npm run build
```

### Docker
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

## 🔄 Integracja z Backendem

### API Endpoints (Mock)
```typescript
// Chat API
POST /api/chat
GET /api/chat/history

// Pantry API
GET /api/pantry
POST /api/pantry
PUT /api/pantry/:id
DELETE /api/pantry/:id

// Receipt API
POST /api/receipts/upload
GET /api/receipts
DELETE /api/receipts/:id

// RAG API
POST /api/rag/upload
GET /api/rag/documents
DELETE /api/rag/documents/:id
POST /api/rag/query
```

## 🎯 Kolejne Kroki

### 1. **Backend Integration**
- [ ] Podłączenie rzeczywistych API endpoints
- [ ] Implementacja WebSocket dla real-time chat
- [ ] Integracja z Ollama API
- [ ] OCR processing integration

### 2. **Advanced Features**
- [ ] Voice commands (Speech-to-Text)
- [ ] Push notifications
- [ ] Offline support (PWA)
- [ ] Data synchronization

### 3. **Performance**
- [ ] Code splitting i lazy loading
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Caching strategies

### 4. **Testing**
- [ ] Unit tests dla wszystkich komponentów
- [ ] Integration tests
- [ ] E2E tests z Playwright
- [ ] Performance testing

### 5. **Deployment**
- [ ] CI/CD pipeline
- [ ] Docker containers
- [ ] Kubernetes deployment
- [ ] Monitoring i logging

### 6. **Security**
- [ ] Authentication system
- [ ] Authorization middleware
- [ ] Input validation
- [ ] XSS protection

## 📊 Performance Metrics

### Lighthouse Scores (Target)
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 95+
- **SEO**: 90+

### Bundle Analysis
- **Main bundle**: < 500KB
- **Vendor bundle**: < 1MB
- **CSS**: < 100KB

## 🤝 Contributing

### Code Style
- **ESLint**: Konfiguracja dla React + TypeScript
- **Prettier**: Automatyczne formatowanie
- **Husky**: Pre-commit hooks

### Git Workflow
```bash
git checkout -b feature/new-feature
# Development
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create PR
```

## 📄 Licencja

MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

---

**FoodSave AI Frontend** - Nowoczesny, responsywny interfejs użytkownika z Cosmic Design System, pełną obsługą RAG i polskim UI. 🚀 