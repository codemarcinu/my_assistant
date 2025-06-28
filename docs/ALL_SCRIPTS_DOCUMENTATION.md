# 📜 Kompletna Dokumentacja Wszystkich Skryptów .sh

## Przegląd

Projekt FoodSave AI / MyAppAssistant zawiera **30+ skryptów .sh** zorganizowanych w różne kategorie funkcjonalne. Ta dokumentacja zawiera kompletny opis wszystkich skryptów z ich przeznaczeniem, użyciem i funkcjonalnościami.

---

## 📁 Kategorie Skryptów

### 🚀 **1. Skrypty Główne (Root Level)**
Skrypty znajdujące się w głównym katalogu projektu.

### 🛠️ **2. Skrypty Automatyzacji Dokumentacji**
Skrypty do zarządzania i aktualizacji dokumentacji projektu.

### 🐳 **3. Skrypty Docker i Deployment**
Skrypty do zarządzania kontenerami Docker i wdrażania aplikacji.

### 🔧 **4. Skrypty Development i Setup**
Skrypty do konfiguracji środowiska deweloperskiego.

### 📊 **5. Skrypty Monitoring i Logging**
Skrypty do monitorowania aplikacji i zarządzania logami.

### 🧪 **6. Skrypty Testowania i Debugowania**
Skrypty do testowania i diagnostyki aplikacji.

### 🔄 **7. Skrypty Zarządzania Aplikacją**
Skrypty do uruchamiania, zatrzymywania i zarządzania aplikacją.

---

## 🚀 1. Skrypty Główne (Root Level)

### `foodsave.sh`
**Lokalizacja:** `./foodsave.sh`  
**Cel:** Główny skrypt zarządzania aplikacją FoodSave AI  
**Funkcjonalność:**
- Uruchamianie/zatrzymywanie wszystkich serwisów
- Zarządzanie środowiskiem Docker
- Monitoring statusu aplikacji
- Backup i restore danych

**Użycie:**
```bash
./foodsave.sh start    # Uruchom wszystkie serwisy
./foodsave.sh stop     # Zatrzymaj wszystkie serwisy
./foodsave.sh status   # Sprawdź status serwisów
./foodsave.sh logs     # Wyświetl logi
./foodsave.sh backup   # Wykonaj backup
./foodsave.sh restore  # Przywróć z backupu
```

### `foodsave-dev.sh`
**Lokalizacja:** `./foodsave-dev.sh`  
**Cel:** Skrypt do zarządzania środowiskiem deweloperskim  
**Funkcjonalność:**
- Uruchamianie środowiska dev
- Hot-reload dla development
- Debug mode
- Development database setup

**Użycie:**
```bash
./foodsave-dev.sh start    # Uruchom środowisko dev
./foodsave-dev.sh stop     # Zatrzymaj środowisko dev
./foodsave-dev.sh restart  # Restart środowiska dev
./foodsave-dev.sh logs     # Logi development
```

### `foodsave-manager.sh`
**Lokalizacja:** `./foodsave-manager.sh`  
**Cel:** Zaawansowany manager aplikacji z GUI  
**Funkcjonalność:**
- Interaktywne menu zarządzania
- Monitoring w czasie rzeczywistym
- Konfiguracja serwisów
- Zarządzanie użytkownikami

**Użycie:**
```bash
./foodsave-manager.sh      # Uruchom interaktywny manager
```

### `run_all.sh`
**Lokalizacja:** `./run_all.sh`  
**Cel:** Uruchomienie wszystkich komponentów aplikacji  
**Funkcjonalność:**
- Backend (FastAPI)
- Frontend (React)
- Database (PostgreSQL)
- Cache (Redis)
- Monitoring (Prometheus/Grafana)

**Użycie:**
```bash
./run_all.sh              # Uruchom wszystko
```

### `run-dev.sh` / `run_dev.sh`
**Lokalizacja:** `./run-dev.sh`, `./run_dev.sh`  
**Cel:** Uruchomienie środowiska deweloperskiego  
**Funkcjonalność:**
- Development mode
- Hot reload
- Debug logging
- Development database

**Użycie:**
```bash
./run-dev.sh              # Uruchom dev environment
./run_dev.sh              # Alternatywna nazwa
```

### `stop_all.sh`
**Lokalizacja:** `./stop_all.sh`  
**Cel:** Zatrzymanie wszystkich komponentów aplikacji  
**Funkcjonalność:**
- Graceful shutdown wszystkich serwisów
- Cleanup zasobów
- Backup przed zatrzymaniem

**Użycie:**
```bash
./stop_all.sh             # Zatrzymaj wszystko
```

---

## 🛠️ 2. Skrypty Automatyzacji Dokumentacji

### `scripts/update_documentation.sh`
**Lokalizacja:** `./scripts/update_documentation.sh`  
**Cel:** Główny skrypt aktualizacji dokumentacji  
**Funkcjonalność:**
- Aktualizacja dat w plikach markdown
- Sprawdzanie statusu testów
- Walidacja linków i składni markdown
- Generowanie podsumowania dokumentacji
- Aktualizacja spisu treści

**Użycie:**
```bash
bash scripts/update_documentation.sh
```

**Szczegółowa dokumentacja:** [docs/SCRIPTS_DOCUMENTATION.md](SCRIPTS_DOCUMENTATION.md)

### `scripts/generate_toc.sh`
**Lokalizacja:** `./scripts/generate_toc.sh`  
**Cel:** Generowanie spisów treści  
**Funkcjonalność:**
- Główny spis treści projektu
- Mini-spisy treści dla plików
- Kategoryzacja dokumentacji
- Sprawdzanie spójności

**Użycie:**
```bash
bash scripts/generate_toc.sh        # Główny TOC
bash scripts/generate_toc.sh --all  # Wszystkie mini-TOC
bash scripts/generate_toc.sh --check # Sprawdź spójność
```

---

## 🐳 3. Skrypty Docker i Deployment

### `scripts/docker-setup.sh`
**Lokalizacja:** `./scripts/docker-setup.sh`  
**Cel:** Konfiguracja środowiska Docker  
**Funkcjonalność:**
- Instalacja Docker i Docker Compose
- Konfiguracja sieci Docker
- Setup volumes i persistent storage
- Konfiguracja environment variables

**Użycie:**
```bash
bash scripts/docker-setup.sh
```

### `scripts/setup_nvidia_docker.sh`
**Lokalizacja:** `./scripts/setup_nvidia_docker.sh`  
**Cel:** Konfiguracja NVIDIA Docker dla GPU  
**Funkcjonalność:**
- Instalacja NVIDIA Container Toolkit
- Konfiguracja GPU support
- Setup CUDA environment
- Testowanie GPU access

**Użycie:**
```bash
bash scripts/setup_nvidia_docker.sh
```

### `scripts/rebuild-with-models.sh`
**Lokalizacja:** `./scripts/rebuild-with-models.sh`  
**Cel:** Rebuild kontenerów z modelami AI  
**Funkcjonalność:**
- Download modeli AI
- Rebuild Docker images
- Setup Ollama models
- Konfiguracja model weights

**Użycie:**
```bash
bash scripts/rebuild-with-models.sh
```

---

## 🔧 4. Skrypty Development i Setup

### `scripts/dev-setup.sh`
**Lokalizacja:** `./scripts/dev-setup.sh`  
**Cel:** Kompletna konfiguracja środowiska deweloperskiego  
**Funkcjonalność:**
- Instalacja zależności Python
- Setup bazy danych
- Konfiguracja environment
- Setup development tools

**Użycie:**
```bash
bash scripts/dev-setup.sh
```

### `scripts/dev-run-simple.sh`
**Lokalizacja:** `./scripts/dev-run-simple.sh`  
**Cel:** Uruchomienie uproszczonego środowiska dev  
**Funkcjonalność:**
- Minimal setup dla development
- Fast startup
- Basic services only
- Development database

**Użycie:**
```bash
bash scripts/dev-run-simple.sh
```

### `scripts/dev-status.sh`
**Lokalizacja:** `./scripts/dev-status.sh`  
**Cel:** Sprawdzenie statusu środowiska deweloperskiego  
**Funkcjonalność:**
- Status wszystkich serwisów
- Health checks
- Resource usage
- Connection status

**Użycie:**
```bash
bash scripts/dev-status.sh
```

### `scripts/dev-stop.sh`
**Lokalizacja:** `./scripts/dev-stop.sh`  
**Cel:** Zatrzymanie środowiska deweloperskiego  
**Funkcjonalność:**
- Graceful shutdown dev services
- Cleanup temporary files
- Stop development database
- Reset environment

**Użycie:**
```bash
bash scripts/dev-stop.sh
```

### `scripts/start-dev.sh`
**Lokalizacja:** `./scripts/start-dev.sh`  
**Cel:** Uruchomienie środowiska deweloperskiego  
**Funkcjonalność:**
- Start development services
- Setup development database
- Configure development environment
- Start development tools

**Użycie:**
```bash
bash scripts/start-dev.sh
```

### `scripts/install_missing_deps.sh`
**Lokalizacja:** `./scripts/install_missing_deps.sh`  
**Cel:** Instalacja brakujących zależności  
**Funkcjonalność:**
- Detect missing dependencies
- Install Python packages
- Install system packages
- Update package lists

**Użycie:**
```bash
bash scripts/install_missing_deps.sh
```

### `scripts/test-dev-setup.sh`
**Lokalizacja:** `./scripts/test-dev-setup.sh`  
**Cel:** Testowanie konfiguracji środowiska deweloperskiego  
**Funkcjonalność:**
- Test all services
- Verify connections
- Check configurations
- Validate setup

**Użycie:**
```bash
bash scripts/test-dev-setup.sh
```

---

## 📊 5. Skrypty Monitoring i Logging

### `scripts/start_monitoring.sh`
**Lokalizacja:** `./scripts/start_monitoring.sh`  
**Cel:** Uruchomienie systemu monitoringu  
**Funkcjonalność:**
- Start Prometheus
- Start Grafana
- Configure dashboards
- Setup alerts

**Użycie:**
```bash
bash scripts/start_monitoring.sh
```

### `scripts/setup_logging.sh`
**Lokalizacja:** `./scripts/setup_logging.sh`  
**Cel:** Konfiguracja systemu logowania  
**Funkcjonalność:**
- Setup Loki
- Configure Promtail
- Setup log aggregation
- Configure log retention

**Użycie:**
```bash
bash scripts/setup_logging.sh
```

### `scripts/capture_ollama_logs.sh`
**Lokalizacja:** `./scripts/capture_ollama_logs.sh`  
**Cel:** Przechwytywanie logów Ollama  
**Funkcjonalność:**
- Capture Ollama logs
- Log rotation
- Log analysis
- Error tracking

**Użycie:**
```bash
bash scripts/capture_ollama_logs.sh
```

### `scripts/ollama-logger.sh`
**Lokalizacja:** `./scripts/ollama-logger.sh`  
**Cel:** Logger dla serwisu Ollama  
**Funkcjonalność:**
- Real-time Ollama logging
- Log formatting
- Error detection
- Performance monitoring

**Użycie:**
```bash
bash scripts/ollama-logger.sh
```

---

## 🧪 6. Skrypty Testowania i Debugowania

### `scripts/debug.sh`
**Lokalizacja:** `./scripts/debug.sh`  
**Cel:** Narzędzia debugowania aplikacji  
**Funkcjonalność:**
- Debug mode activation
- Verbose logging
- Error tracing
- Performance profiling

**Użycie:**
```bash
bash scripts/debug.sh
```

### `scripts/fix_foodsave_errors.sh`
**Lokalizacja:** `./scripts/fix_foodsave_errors.sh`  
**Cel:** Automatyczne naprawianie błędów FoodSave  
**Funkcjonalność:**
- Error detection
- Automatic fixes
- Configuration repair
- System recovery

**Użycie:**
```bash
bash scripts/fix_foodsave_errors.sh
```

---

## 🔄 7. Skrypty Zarządzania Aplikacją

### `scripts/start_ollama.sh`
**Lokalizacja:** `./scripts/start_ollama.sh`  
**Cel:** Uruchomienie serwisu Ollama  
**Funkcjonalność:**
- Start Ollama service
- Load AI models
- Configure model settings
- Health check

**Użycie:**
```bash
bash scripts/start_ollama.sh
```

### `scripts/run_manager.sh`
**Lokalizacja:** `./scripts/run_manager.sh`  
**Cel:** Uruchomienie managera aplikacji  
**Funkcjonalność:**
- Application manager
- Service orchestration
- Resource management
- Health monitoring

**Użycie:**
```bash
bash scripts/run_manager.sh
```

### `scripts/foodsave-manager.sh`
**Lokalizacja:** `./scripts/foodsave-manager.sh`  
**Cel:** Manager aplikacji FoodSave (alternatywny)  
**Funkcjonalność:**
- Alternative manager interface
- Service management
- Configuration tools
- Monitoring interface

**Użycie:**
```bash
bash scripts/foodsave-manager.sh
```

### `src/backend/start.sh`
**Lokalizacja:** `./src/backend/start.sh`  
**Cel:** Uruchomienie backend aplikacji  
**Funkcjonalność:**
- Start FastAPI server
- Database initialization
- Load configurations
- Start background tasks

**Użycie:**
```bash
bash src/backend/start.sh
```

---

## 📋 Skrypty Playwright (Frontend Testing)

### Skrypty w `myappassistant-chat-frontend/node_modules/playwright-core/bin/`
**Cel:** Reinstalacja przeglądarek dla testów Playwright  
**Funkcjonalność:**
- Reinstall Chrome (stable/beta) dla Linux/Mac
- Reinstall Edge (stable/beta/dev) dla Linux/Mac
- Browser management dla testów E2E

**Użycie:**
```bash
# Przykłady:
./reinstall_chrome_stable_linux.sh
./reinstall_msedge_beta_mac.sh
```

---

## 🎯 Szybki Start - Najważniejsze Skrypty

### Dla Nowych Deweloperów:
```bash
# 1. Setup środowiska
bash scripts/dev-setup.sh

# 2. Uruchom development
bash scripts/start-dev.sh

# 3. Sprawdź status
bash scripts/dev-status.sh
```

### Dla Administracji:
```bash
# 1. Uruchom wszystko
./run_all.sh

# 2. Sprawdź status
./foodsave.sh status

# 3. Zatrzymaj wszystko
./stop_all.sh
```

### Dla Dokumentacji:
```bash
# Aktualizuj dokumentację
bash scripts/update_documentation.sh

# Generuj spis treści
bash scripts/generate_toc.sh
```

---

## 🔧 Konfiguracja i Dostosowania

### Zmienne Środowiskowe:
```bash
# Konfiguracja ścieżek
export PROJECT_ROOT="/path/to/project"
export DEV_MODE=1

# Konfiguracja Docker
export DOCKER_COMPOSE_FILE="docker-compose.dev.yaml"
export GPU_ENABLED=1

# Konfiguracja logowania
export LOG_LEVEL="DEBUG"
export LOG_FILE="/path/to/logs/app.log"
```

### Harmonogram (Cron Jobs):
```bash
# Codzienna aktualizacja dokumentacji
0 2 * * * cd /path/to/project && bash scripts/update_documentation.sh

# Codzienny backup
0 3 * * * cd /path/to/project && ./foodsave.sh backup

# Cotygodniowe czyszczenie logów
0 4 * * 0 cd /path/to/project && bash scripts/setup_logging.sh cleanup
```

---

## 🚨 Rozwiązywanie Problemów

### Typowe Problemy:

#### Skrypt się nie uruchamia:
```bash
# Sprawdź uprawnienia
chmod +x script_name.sh

# Sprawdź ścieżki
which bash
echo $PATH
```

#### Błędy Docker:
```bash
# Restart Docker
sudo systemctl restart docker

# Cleanup containers
docker system prune -a
```

#### Problemy z zależnościami:
```bash
# Reinstall dependencies
bash scripts/install_missing_deps.sh

# Update package lists
sudo apt update && sudo apt upgrade
```

---

## 📚 Dodatkowe Zasoby

- **Dokumentacja skryptów:** [docs/SCRIPTS_DOCUMENTATION.md](SCRIPTS_DOCUMENTATION.md)
- **Docker setup:** [DOCKER_SETUP.md](../DOCKER_SETUP.md)
- **Development guide:** [README_DEVELOPMENT.md](../README_DEVELOPMENT.md)
- **API reference:** [docs/API_REFERENCE.md](API_REFERENCE.md)

---

*Ostatnia aktualizacja: $(date +'%Y-%m-%d %H:%M:%S')* 