# 🍽️ FoodSave AI - Panel Sterowania GUI

Intuicyjny interfejs użytkownika dla systemu FoodSave AI, zastępujący konsolowy skrypt `foodsave-all.sh`.

## 🎯 Cel

Stworzenie przyjaznego dla użytkownika nietechnicznego interfejsu do zarządzania systemem FoodSave AI, który:

- **Zastępuje konsolowy skrypt** - nie trzeba pamiętać komend
- **Jest intuicyjny** - wszystko w jednym miejscu
- **Ma nowoczesny design** - ładny i responsywny
- **Działa na wszystkich urządzeniach** - komputer, tablet, telefon
- **Zapewnia bezpieczeństwo** - walidacja i potwierdzenia

## 🚀 Szybki Start

### 1. Uruchomienie GUI

```bash
cd foodsave-gui
chmod +x start-gui.sh stop-gui.sh
./start-gui.sh
```

### 2. Otwórz przeglądarkę

Przejdź do: **http://localhost:8080**

### 3. Zatrzymanie GUI

```bash
./stop-gui.sh
```

## 📋 Funkcjonalności

### 🎛️ Status Systemu
- **Backend** - status serwera API
- **Frontend** - status interfejsu web
- **Baza Danych** - status PostgreSQL
- **AI Model** - status Ollama

### ⚡ Szybkie Akcje
- **Tryb Deweloperski** - dla programistów i testowania
- **Tryb Produkcyjny** - dla użytkowników końcowych
- **Aplikacja Desktop** - natywna aplikacja Tauri
- **Tryb Deweloperski Tauri** - uruchom aplikację w trybie dev z hot-reload
- **Zatrzymaj Wszystko** - bezpieczne wyłączenie

### 🔧 Opcje Zaawansowane
- **Pokaż Logi** - dostęp do logów systemowych
- **Sprawdź Środowisko** - diagnostyka systemu
- **Zbuduj Aplikację** - tworzenie pliku instalacyjnego
- **Kopie Zapasowe** - zarządzanie backupami

### 📊 Informacje Systemowe
- **Przydatne Linki** - szybki dostęp do aplikacji
- **Porty Systemu** - informacje o portach

## 🎨 Design

### Nowoczesny Interfejs
- **Gradient tło** - piękny gradient fioletowo-niebieski
- **Glassmorphism** - przezroczyste karty z efektem szkła
- **Animacje** - płynne przejścia i hover effects
- **Responsywny** - działa na wszystkich urządzeniach

### Kolory Statusu
- 🟢 **Zielony** - działa poprawnie
- 🔴 **Czerwony** - błąd lub nieosiągalny
- 🟡 **Żółty** - ostrzeżenie

### Ikony i Symbole
- Używamy Font Awesome dla spójnych ikon
- Każda sekcja ma charakterystyczną ikonę
- Intuicyjne oznaczenia funkcji

## 🔧 Architektura

### Frontend (HTML/CSS/JavaScript)
- **HTML5** - semantyczna struktura
- **CSS3** - nowoczesne styles z Flexbox i Grid
- **Vanilla JavaScript** - bez frameworków, szybki i lekki
- **Responsive Design** - mobile-first approach

### Backend (Python Flask)
- **Flask** - lekki serwer web
- **CORS** - obsługa cross-origin requests
- **psutil** - monitorowanie procesów systemowych
- **requests** - komunikacja z API

### Komunikacja z Systemem
- **API Endpoints** - RESTful API dla GUI
- **Skrypt Integration** - komunikacja z `foodsave-all.sh`
- **Process Management** - zarządzanie procesami systemowymi
- **Health Checks** - sprawdzanie statusu usług

## 📁 Struktura Plików

```
foodsave-gui/
├── index.html          # Główny plik HTML
├── style.css           # Style CSS
├── script.js           # Logika JavaScript
├── server.py           # Serwer Flask
├── start-gui.sh        # Skrypt uruchamiania
├── stop-gui.sh         # Skrypt zatrzymywania
├── README.md           # Dokumentacja
└── gui.pid             # PID procesu (generowany)
```

## 🔌 API Endpoints

### System Status
- `GET /api/system/status` - status wszystkich komponentów
- `GET /health` - health check serwera GUI

### System Actions
- `POST /api/system/start-dev` - uruchom tryb deweloperski
- `POST /api/system/start-prod` - uruchom tryb produkcyjny
- `POST /api/system/start-tauri` - uruchom aplikację desktop
- `POST /api/system/start-tauri-dev` - uruchom aplikację w trybie deweloperskim
- `POST /api/system/build-tauri` - zbuduj aplikację desktop
- `POST /api/system/stop` - zatrzymaj wszystkie usługi

### Monitoring
- `GET /api/system/logs` - pobierz wszystkie logi
- `GET /api/system/logs/<type>` - pobierz logi określonego typu
- `GET /api/system/check-environment` - sprawdź środowisko

### Backups
- `GET /api/system/backups` - lista kopii zapasowych
- `POST /api/system/backup` - utwórz kopię zapasową

## 🛠️ Wymagania

### System
- **Linux** (testowane na Ubuntu 20.04+)
- **Python 3.8+**
- **Dostęp do terminala**

### Python Packages
```bash
pip3 install flask flask-cors psutil requests
```

### Uprawnienia
- **Wykonywalny skrypt** `foodsave-all.sh`
- **Dostęp do portów** 8080, 3000, 8000
- **Uprawnienia Docker** (jeśli używany)

## 🚀 Uruchamianie

### Automatyczne
```bash
./start-gui.sh
```

### Ręczne
```bash
python3 server.py
```

### Z Docker (opcjonalnie)
```bash
docker build -t foodsave-gui .
docker run -p 8080:8080 foodsave-gui
```

## 🛑 Zatrzymywanie

### Automatyczne
```bash
./stop-gui.sh
```

### Ręczne
```bash
# Znajdź PID
ps aux | grep "python3.*server.py"

# Zatrzymaj proces
kill <PID>
```

### Wymuszenie
```bash
# Zatrzymaj wszystkie procesy na porcie 8080
lsof -ti:8080 | xargs kill -9
```

## 🔍 Rozwiązywanie Problemów

### GUI się nie uruchamia
1. Sprawdź czy Python 3 jest zainstalowany
2. Zainstaluj wymagane pakiety: `pip3 install flask flask-cors psutil requests`
3. Sprawdź czy port 8080 jest wolny
4. Sprawdź uprawnienia do `foodsave-all.sh`

### Błędy komunikacji z systemem
1. Sprawdź czy `foodsave-all.sh` istnieje i jest wykonywalny
2. Sprawdź logi serwera GUI
3. Sprawdź uprawnienia do Docker (jeśli używany)

### Problemy z responsywnością
1. Sprawdź czy używasz nowoczesnej przeglądarki
2. Sprawdź czy CSS jest poprawnie załadowany
3. Sprawdź konsolę przeglądarki pod kątem błędów JavaScript

## 📱 Responsywność

GUI jest w pełni responsywne i działa na:

- **Desktop** (1920x1080+)
- **Laptop** (1366x768+)
- **Tablet** (768x1024)
- **Telefon** (375x667+)

### Breakpoints
- **Desktop**: > 1200px
- **Tablet**: 768px - 1200px
- **Mobile**: < 768px

## 🎨 Customization

### Kolory
Możesz zmienić kolory w `style.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #10b981;
    --error-color: #ef4444;
    --warning-color: #f59e0b;
}
```

### Ikony
Zmień ikony w `index.html` używając Font Awesome:

```html
<i class="fas fa-utensils"></i>  <!-- Logo -->
<i class="fas fa-server"></i>    <!-- Backend -->
<i class="fas fa-globe"></i>     <!-- Frontend -->
```

### Dodanie nowych funkcji
1. Dodaj endpoint w `server.py`
2. Dodaj funkcję w `script.js`
3. Dodaj przycisk w `index.html`
4. Dodaj style w `style.css`

## 🔒 Bezpieczeństwo

### Walidacja
- Wszystkie dane wejściowe są walidowane
- Potwierdzenia dla krytycznych operacji
- Timeout dla długotrwałych operacji

### Izolacja
- GUI działa na osobnym porcie (8080)
- Nie ma bezpośredniego dostępu do systemu
- Wszystkie operacje przez API

### Logi
- Wszystkie operacje są logowane
- Błędy są przechwytywane i wyświetlane
- Debug mode dla deweloperów

## 📈 Performance

### Optymalizacje
- **Lazy Loading** - logi ładowane na żądanie
- **Caching** - status systemu cache'owany
- **Debouncing** - ograniczenie częstych zapytań
- **Minification** - zoptymalizowane pliki

### Monitoring
- **Health Checks** - regularne sprawdzanie statusu
- **Auto Refresh** - automatyczne odświeżanie co 30s
- **Error Handling** - obsługa błędów sieciowych

## 🤝 Contributing

### Dodanie nowej funkcji
1. Stwórz branch: `git checkout -b feature/nazwa-funkcji`
2. Dodaj kod i testy
3. Zaktualizuj dokumentację
4. Stwórz Pull Request

### Raportowanie błędów
1. Sprawdź czy błąd nie został już zgłoszony
2. Opisz kroki do reprodukcji
3. Dodaj logi i zrzuty ekranu
4. Użyj szablonu Issue

## 📄 Licencja

Ten projekt jest częścią FoodSave AI i podlega tej samej licencji.

## 🙏 Podziękowania

- **Font Awesome** - ikony
- **Google Fonts** - czcionka Inter
- **Flask** - framework web
- **psutil** - monitorowanie systemu

---

**🍽️ FoodSave AI GUI** - Intuicyjne zarządzanie systemem dla każdego! 