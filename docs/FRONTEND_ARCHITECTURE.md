# Architektura Frontendu - Mój Asystent

## 🏗️ Przegląd Architektury

Frontend aplikacji "Mój Asystent" został zbudowany jako nowoczesna aplikacja Next.js 15 z React 18, wykorzystująca najnowsze wzorce i technologie webowe.

## 🛠️ Stack Technologiczny

### Core Framework
- **Next.js 15** - Framework React z App Router
- **React 18** - Biblioteka UI z Server Components
- **TypeScript** - Typowanie statyczne

### Styling & UI
- **Tailwind CSS v4** - Framework CSS z nowoczesnym designem
- **shadcn/ui** - Biblioteka komponentów UI
- **Lucide React** - Ikony

### State Management
- **TanStack Query** - Zarządzanie stanem serwera
- **Zustand** - Zarządzanie stanem klienta
- **React Context** - Kontekst aplikacji

### Development Tools
- **ESLint** - Linting kodu
- **Prettier** - Formatowanie kodu
- **TypeScript** - Typowanie

## 📁 Struktura Projektu

```
myappassistant-chat-frontend/
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── layout.tsx         # Główny layout z providerami
│   │   ├── page.tsx           # Strona główna
│   │   └── globals.css        # Globalne style
│   ├── components/            # Komponenty React
│   │   ├── agents/           # Komponenty agentów
│   │   │   └── AgentControlPanel.tsx
│   │   ├── chat/             # Komponenty czatu
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── dashboard/        # Komponenty dashboardu
│   │   │   └── CommandCenter.tsx
│   │   ├── developer/        # Konsola deweloperska
│   │   │   └── DeveloperConsole.tsx
│   │   ├── monitoring/       # Monitor systemu
│   │   │   └── SystemMonitor.tsx
│   │   ├── rag/              # Moduł RAG
│   │   │   └── RAGModule.tsx
│   │   ├── settings/         # Ustawienia
│   │   │   └── AdvancedSettings.tsx
│   │   ├── providers.tsx     # Providerzy kontekstu
│   │   └── ui/               # Komponenty UI (shadcn/ui)
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── progress.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       └── tabs.tsx
│   ├── hooks/                # Custom hooks
│   │   └── useChat.ts
│   └── lib/                  # Narzędzia i konfiguracja
│       └── api.ts           # Klient API
├── public/                   # Statyczne pliki
├── components.json          # Konfiguracja shadcn/ui
├── next.config.ts           # Konfiguracja Next.js
├── package.json             # Zależności
├── tailwind.config.ts       # Konfiguracja Tailwind
└── tsconfig.json           # Konfiguracja TypeScript
```

## 🎨 Design System

### Kolory
- **Primary**: Blue (#3B82F6)
- **Secondary**: Slate (#64748B)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Background**: Slate gradient (900-800-900)

### Typografia
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700
- **Sizes**: Responsive scale

### Komponenty
Wszystkie komponenty UI są zbudowane z shadcn/ui z custom theming dla ciemnego motywu.

## 🔧 Komponenty Główne

### 1. CommandCenter
Główny komponent dashboardu zawierający:
- Status agentów
- Monitor systemu
- Interfejs czatu
- Moduły RAG i ustawień

```typescript
interface CommandCenterProps {
  // Główny komponent nie przyjmuje props
}
```

### 2. ChatInterface
Interfejs czatu z funkcjami:
- Wyświetlanie wiadomości
- Wprowadzanie tekstu
- Szybkie akcje
- Wskaźnik pisania

```typescript
interface ChatInterfaceProps {
  // Komponent używa hooka useChat
}
```

### 3. AgentControlPanel
Panel kontrolny agentów z:
- Status agentów
- Opisy funkcji
- Kontrolki testowania
- Ustawienia automatycznego routingu

```typescript
interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'busy' | 'error' | 'inactive';
  description: string;
  lastActivity: string;
}
```

### 4. SystemMonitor
Monitor systemu pokazujący:
- Użycie CPU i pamięci
- Liczba aktywnych agentów
- Liczba konwersacji
- Czas odpowiedzi

```typescript
interface SystemMetrics {
  cpu: number;
  memory: number;
  activeAgents: number;
  totalConversations: number;
  responseTime: number;
}
```

## 🔄 State Management

### TanStack Query
Używany do:
- Caching odpowiedzi API
- Synchronizacja stanu serwera
- Automatyczne odświeżanie
- Obsługa błędów

### Zustand
Używany do:
- Stan lokalny komponentów
- Ustawienia użytkownika
- Stan UI (modals, toggles)

### React Context
Używany do:
- Theme provider
- Authentication context
- Global settings

## 🌐 API Integration

### Klient API
```typescript
class ApiClient {
  private baseURL: string;
  
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>>
  async get<T>(endpoint: string): Promise<ApiResponse<T>>
}
```

### Endpointy
- `POST /memory_chat` - Wysyłanie wiadomości
- `GET /agents` - Pobieranie agentów
- `POST /api/v2/rag/upload` - Upload dokumentów
- `GET /api/v2/rag/search` - Wyszukiwanie RAG

## 🎯 Performance

### Optymalizacje
- **Server Components** - Zmniejszenie JavaScript po stronie klienta
- **Code Splitting** - Automatyczne dzielenie kodu
- **Image Optimization** - Next.js Image component
- **Caching** - TanStack Query caching
- **Bundle Analysis** - Wbudowany analizator

### Metryki
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔒 Security

### Implementowane Zabezpieczenia
- **CSP Headers** - Content Security Policy
- **HTTPS Only** - Bezpieczne połączenia
- **Input Validation** - Walidacja po stronie klienta
- **XSS Protection** - Wbudowana ochrona React

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach
Wszystkie komponenty są projektowane z podejściem mobile-first.

## 🧪 Testing

### Strategia Testowania
- **Unit Tests** - Testy komponentów
- **Integration Tests** - Testy API
- **E2E Tests** - Testy użytkownika
- **Visual Regression** - Testy UI

### Narzędzia
- **Jest** - Framework testowy
- **React Testing Library** - Testy komponentów
- **Playwright** - E2E testing

## 🚀 Deployment

### Vercel (Rekomendowane)
```bash
npm i -g vercel
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=production
```

## 📈 Monitoring

### Metryki
- **Performance** - Core Web Vitals
- **Errors** - Error tracking
- **Usage** - Analytics
- **Uptime** - Health checks

### Narzędzia
- **Vercel Analytics** - Built-in analytics
- **Sentry** - Error tracking
- **Google Analytics** - Usage analytics

## 🔄 CI/CD

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
```

## 📚 Dokumentacja

### Komponenty
Każdy komponent ma:
- TypeScript interfaces
- JSDoc comments
- Usage examples
- Props documentation

### API
- OpenAPI/Swagger spec
- TypeScript types
- Error handling
- Rate limiting

---

**Wersja**: 1.0.0  
**Data**: 29 czerwca 2025  
**Autor**: AI Assistant 