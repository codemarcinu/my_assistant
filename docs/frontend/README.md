# Mój Asystent - Frontend

Nowoczesny frontend dla systemu zarządzania agentami AI, zbudowany z Next.js 15, React 18 i TypeScript.

## 🚀 Funkcje

- **Centrum Dowodzenia AI** - Zaawansowany interfejs zarządzania agentami
- **Interfejs Czatu** - Komunikacja w czasie rzeczywistym z agentami AI
- **Panel Kontrolny Agentów** - Monitorowanie i zarządzanie statusem agentów
- **Moduł RAG** - Zarządzanie bazą wiedzy i wyszukiwanie semantyczne
- **Monitor Systemu** - Śledzenie metryk wydajności w czasie rzeczywistym
- **Konsola Deweloperska** - Narzędzia dla programistów
- **Zaawansowane Ustawienia** - Konfiguracja systemu

## 🛠️ Technologie

- **Next.js 15** - Framework React z SSR
- **React 18** - Biblioteka UI z nowoczesnymi wzorcami
- **TypeScript** - Typowanie statyczne
- **Tailwind CSS v4** - Framework CSS z nowoczesnym designem
- **shadcn/ui** - Komponenty UI
- **TanStack Query** - Zarządzanie stanem serwera
- **Zustand** - Zarządzanie stanem klienta
- **WebSockets** - Komunikacja w czasie rzeczywistym

## 📦 Instalacja

```bash
# Klonuj repozytorium
git clone <repository-url>
cd myappassistant-chat-frontend

# Zainstaluj zależności
npm install

# Uruchom w trybie deweloperskim
npm run dev
```

## 🚀 Uruchomienie

### Tryb Deweloperski

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

### Produkcja

```bash
# Budowanie
npm run build

# Uruchomienie
npm start
```

### Docker

```bash
# Budowanie obrazu
docker build -f Dockerfile.prod -t myappassistant-frontend .

# Uruchomienie kontenera
docker run -p 3000:3000 myappassistant-frontend
```

## 🏗️ Struktura Projektu

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── layout.tsx         # Główny layout
│   └── page.tsx           # Strona główna
├── components/            # Komponenty React
│   ├── agents/           # Komponenty agentów
│   ├── chat/             # Komponenty czatu
│   ├── dashboard/        # Komponenty dashboardu
│   ├── developer/        # Konsola deweloperska
│   ├── monitoring/       # Monitor systemu
│   ├── rag/              # Moduł RAG
│   ├── settings/         # Ustawienia
│   └── ui/               # Komponenty UI (shadcn/ui)
├── hooks/                # Custom hooks
├── lib/                  # Narzędzia i konfiguracja
└── types/                # Definicje TypeScript
```

## 🎨 Design System

Aplikacja wykorzystuje nowoczesny design system z:

- **Ciemny motyw** - Przyjazny dla oczu interfejs
- **Skeuomorfizm** - Nowoczesne efekty 3D
- **Mikrointerakcje** - Płynne animacje i przejścia
- **AI-driven UX** - Personalizacja oparta na AI
- **Responsywność** - Działanie na wszystkich urządzeniach

## 🔧 Konfiguracja

### Zmienne Środowiskowe

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

### API Endpoints

Aplikacja komunikuje się z backendem przez następujące endpointy:

- `POST /memory_chat` - Wysyłanie wiadomości
- `GET /agents` - Pobieranie listy agentów
- `POST /api/v2/rag/upload` - Upload dokumentów RAG
- `GET /api/v2/rag/search` - Wyszukiwanie w bazie wiedzy

## 🧪 Testowanie

```bash
# Uruchom testy
npm test

# Testy w trybie watch
npm run test:watch

# Pokrycie testami
npm run test:coverage
```

## 📦 Deployment

### Vercel

```bash
# Instalacja Vercel CLI
npm i -g vercel

# Deployment
vercel
```

### Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./myappassistant-chat-frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
```

## 🤝 Współpraca

1. Fork projektu
2. Utwórz branch dla nowej funkcji (`git checkout -b feature/amazing-feature`)
3. Commit zmian (`git commit -m 'Add amazing feature'`)
4. Push do brancha (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## 📄 Licencja

Ten projekt jest licencjonowany pod MIT License - zobacz plik [LICENSE](LICENSE) dla szczegółów.

## 🆘 Wsparcie

Jeśli masz pytania lub problemy:

1. Sprawdź [dokumentację](docs/)
2. Przeszukaj [issues](../../issues)
3. Utwórz nowy issue z opisem problemu

## 🗺️ Roadmap

- [ ] Integracja z WebSocket dla komunikacji w czasie rzeczywistym
- [ ] System powiadomień push
- [ ] Zaawansowane filtry i wyszukiwanie
- [ ] Eksport danych i raporty
- [ ] Integracja z systemami monitorowania
- [ ] Wsparcie dla wielu języków
- [ ] Tryb offline
- [ ] Progressive Web App (PWA)

## Nowości i kluczowe funkcje (2024)

### 1. Dynamiczny Dashboard (CommandCenter)
- **WebSocket monitoring**: dashboard i zakładki korzystają z połączenia WebSocket do backendu, aby w czasie rzeczywistym wyświetlać status agentów, metryki systemowe i powiadomienia.
- **Zakładki**: czat, status agentów, monitoring systemu, RAG (baza wiedzy), ustawienia, konsola deweloperska (tryb dev).
- **Lazy loading**: komponenty zakładek ładowane są tylko po aktywacji, co poprawia wydajność UI.

### 2. Okno Czatowe
- **Metadane agentów**: każda odpowiedź asystenta zawiera badge z typem agenta, confidence, źródłami wiedzy (RAG), czasem odpowiedzi.
- **Zintegrowany RAG**: przed wysłaniem zapytania do LLM automatycznie pobierane są dokumenty z bazy wiedzy (RAG), a pasek postępu pokazuje status wyszukiwania.
- **Cytowania i źródła**: odpowiedzi mogą zawierać cytowania do dokumentów, a użytkownik może podejrzeć źródła.
- **Obsługa błędów**: globalny ErrorBanner wyświetla komunikaty o błędach sieci, OCR, RAG itp.
- **Edytowalność**: ostatnia wiadomość użytkownika może być edytowana w przypadku błędów parsowania.

### 3. Moduł RAG
- **Panel zarządzania dokumentami**: upload, przeglądanie, wyszukiwanie i podgląd dokumentów bazy wiedzy.
- **Wyniki wyszukiwania**: wyświetlane z procentową oceną trafności (similarity).

### 4. Monitoring i Ustawienia
- **SystemMonitor**: wizualizacja CPU, RAM, dysku, sieci, liczby połączeń.
- **Panel ustawień**: centralna konfiguracja agentów, szybkie komendy, wygląd, baza wiedzy.

### 5. Konsola Deweloperska
- **Wysyłanie komend do backendu**: logi, szybkie komendy, debugowanie.

## Architektura
- **React + Zustand** do zarządzania stanem czatu.
- **WebSocket** do real-time eventów.
- **TypeScript**: typowanie metadanych, wiadomości, agentów.
- **Material-UI**: nowoczesny, responsywny interfejs.

## Jak uruchomić
1. `npm install`
2. `npm run dev`

## Testowanie
- Testy e2e: Playwright (`npm run test:e2e`)
- Testy integracyjne: `tests/integration/`

## Zmiany 2024-06
- Integracja RAG z czatem i dashboardem
- WebSocket monitoring
- Metadane agentów i źródeł w czacie
- ErrorBanner i lepsza obsługa błędów
- Lazy loading zakładek
- Nowe panele: SystemMonitor, RAGModule, DeveloperConsole

---

Built with ❤️ using Next.js 15 and modern web technologies.
