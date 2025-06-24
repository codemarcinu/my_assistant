# FoodSave AI - Chat Frontend

Nowy frontend dla aplikacji FoodSave AI oparty na koncepcji czatu jako centralnego punktu dowodzenia. Aplikacja wykorzystuje AI asystenta do inteligentnego wyboru odpowiednich narzędzi na podstawie kontekstu rozmowy.

> **Uwaga:** Ten katalog znajduje się w `myappassistant/myappassistant-chat-frontend/`. Wszystkie polecenia uruchamiaj z tego katalogu lub używaj skryptów z głównego `package.json`!

## 📦 Instalacja i Uruchomienie

### Wymagania
- Node.js 18+ 
- npm lub yarn
- Backend FoodSave AI (port 8000)

### Instalacja zależności
```bash
npm install
```

### Uruchomienie w trybie development
```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:5173

### Build produkcyjny
```bash
npm run build
```

### Preview build
```bash
npm run preview
```

## ❌ Typowe Błędy i Rozwiązania

### Błąd: "Missing script: dev"
```
npm ERR! Missing script: "dev"
```
**Rozwiązanie:** Upewnij się, że jesteś w katalogu `myappassistant/myappassistant-chat-frontend/`:
```bash
pwd  # Sprawdź aktualny katalog
npm run dev
```

### Błąd: "Cannot find module"
**Rozwiązanie:** Zainstaluj zależności:
```bash
npm install
```

### Błąd: "Port already in use"
**Rozwiązanie:** Zmień port lub zatrzymaj inne procesy:
```bash
npm run dev -- --port 3001
```

## 🔧 Konfiguracja

### Zmienne środowiskowe
Utwórz plik `.env.local` w katalogu `myappassistant/myappassistant-chat-frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=FoodSave AI
```

### Integracja z backendem
Frontend komunikuje się z backendem przez REST API:
- **Chat API** - `/api/v1/chat/*` ✅
- **Food API** - `/api/v1/food-items/*` 🚧
- **Receipt API** - `/api/v1/receipts/*` 🚧
- **Weather API** - `/api/v1/weather/*` 🚧
- **Settings API** - `/api/v1/settings/*` 🚧

## 🧪 Testowanie

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

## 📄 Licencja

MIT License - zobacz plik [LICENSE](LICENSE) dla szczegółów.
