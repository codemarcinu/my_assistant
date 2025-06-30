#!/bin/bash

# FoodSave AI - Intuicyjny skrypt zarządzania systemem
# Przyjazny dla osób nietechnicznych i deweloperów

set -e

# Automatyczne przejście do katalogu projektu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Funkcje wyświetlania komunikatów
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[UWAGA]${NC} $1"; }
print_error() { echo -e "${RED}[BŁĄD]${NC} $1"; }
print_header() { echo -e "${PURPLE}$1${NC}"; }
print_subheader() { echo -e "${CYAN}$1${NC}"; }

# Konfiguracja
BACKEND_PORT=8000
FRONTEND_PORT=3000
OLLAMA_PORT=11434
TAURI_APP="myappassistant-chat-frontend/src-tauri/target/release/bundle/appimage/FoodSave AI_1.0.0_amd64.AppImage"

# Funkcja sprawdzania czy Docker jest dostępny
check_docker() {
  if ! command -v docker &> /dev/null; then
    print_error "Docker nie jest zainstalowany lub nie jest dostępny!"
    print_status "Zainstaluj Docker: https://docs.docker.com/get-docker/"
    return 1
  fi
  
  if ! docker info &> /dev/null; then
    print_error "Docker nie jest uruchomiony!"
    print_status "Uruchom Docker Desktop lub usługę Docker"
    return 1
  fi
  
  print_success "Docker jest dostępny"
  return 0
}

# Funkcja sprawdzania czy Node.js jest dostępny
check_nodejs() {
  if ! command -v node &> /dev/null; then
    print_error "Node.js nie jest zainstalowany!"
    print_status "Zainstaluj Node.js: https://nodejs.org/"
    return 1
  fi
  
  if ! command -v npm &> /dev/null; then
    print_error "npm nie jest zainstalowany!"
    return 1
  fi
  
  print_success "Node.js i npm są dostępne"
  return 0
}

# Funkcja sprawdzania czy Ollama jest dostępny
check_ollama() {
  if ! command -v ollama &> /dev/null; then
    print_warn "Ollama nie jest zainstalowane!"
    print_status "Zainstaluj Ollama: https://ollama.ai/"
    return 1
  fi
  
  if curl -s http://localhost:$OLLAMA_PORT/api/tags > /dev/null; then
    print_success "Ollama działa na porcie $OLLAMA_PORT"
    return 0
  else
    print_warn "Ollama nie działa. Uruchom: ollama serve"
    return 1
  fi
}

# Funkcja sprawdzania środowiska
check_environment() {
  print_header "🔧 Diagnostyka Środowiska Systemu"
  echo ""
  print_subheader "Sprawdzam wymagane narzędzia i konfigurację..."
  echo ""
  
  local all_checks_passed=true
  
  # Sprawdź Docker
  print_status "1/6 Sprawdzam Docker..."
  if command -v docker > /dev/null 2>&1; then
    if docker info > /dev/null 2>&1; then
      print_success "✅ Docker jest zainstalowany i działa"
      print_status "   • Wersja: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
      print_status "   • Status: Aktywny"
      print_status "   • Uprawnienia: OK"
    else
      print_error "❌ Docker jest zainstalowany, ale nie działa"
      print_status "   • Problem: Brak uprawnień lub usługa nie uruchomiona"
      print_status "   • Rozwiązanie: Uruchom 'sudo systemctl start docker'"
      all_checks_passed=false
    fi
  else
    print_error "❌ Docker nie jest zainstalowany"
    print_status "   • Problem: Brak Docker w systemie"
    print_status "   • Rozwiązanie: Zainstaluj Docker z https://docker.com"
    all_checks_passed=false
  fi
  echo ""
  
  # Sprawdź Docker Compose
  print_status "2/6 Sprawdzam Docker Compose..."
  if command -v docker-compose > /dev/null 2>&1; then
    print_success "✅ Docker Compose jest zainstalowany"
    print_status "   • Wersja: $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)"
  else
    print_error "❌ Docker Compose nie jest zainstalowany"
    print_status "   • Problem: Brak Docker Compose"
    print_status "   • Rozwiązanie: Zainstaluj Docker Compose"
    all_checks_passed=false
  fi
  echo ""
  
  # Sprawdź Node.js
  print_status "3/6 Sprawdzam Node.js..."
  if command -v node > /dev/null 2>&1; then
    local node_version=$(node --version)
    print_success "✅ Node.js jest zainstalowany"
    print_status "   • Wersja: $node_version"
    if [[ "$node_version" =~ v1[8-9] ]] || [[ "$node_version" =~ v2[0-9] ]]; then
      print_status "   • Kompatybilność: OK (wymagana v18+)"
    else
      print_warn "⚠️  Wersja Node.js może być niekompatybilna"
      print_status "   • Zalecana: v18 lub nowsza"
    fi
  else
    print_error "❌ Node.js nie jest zainstalowany"
    print_status "   • Problem: Brak Node.js"
    print_status "   • Rozwiązanie: Zainstaluj Node.js z https://nodejs.org"
    all_checks_passed=false
  fi
  echo ""
  
  # Sprawdź npm
  print_status "4/6 Sprawdzam npm..."
  if command -v npm > /dev/null 2>&1; then
    print_success "✅ npm jest zainstalowany"
    print_status "   • Wersja: $(npm --version)"
  else
    print_error "❌ npm nie jest zainstalowany"
    print_status "   • Problem: Brak npm"
    print_status "   • Rozwiązanie: Zainstaluj npm wraz z Node.js"
    all_checks_passed=false
  fi
  echo ""
  
  # Sprawdź curl
  print_status "5/6 Sprawdzam curl..."
  if command -v curl > /dev/null 2>&1; then
    print_success "✅ curl jest zainstalowany"
    print_status "   • Wersja: $(curl --version | head -1 | cut -d' ' -f2)"
  else
    print_error "❌ curl nie jest zainstalowany"
    print_status "   • Problem: Brak curl"
    print_status "   • Rozwiązanie: Zainstaluj curl (apt install curl)"
    all_checks_passed=false
  fi
  echo ""
  
  # Sprawdź porty
  print_status "6/6 Sprawdzam dostępność portów..."
  local ports_to_check=("$BACKEND_PORT" "$FRONTEND_PORT" "5432" "11434")
  local ports_available=true
  
  for port in "${ports_to_check[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
      print_warn "⚠️  Port $port jest zajęty"
      print_status "   • Może powodować konflikty"
      print_status "   • Sprawdź co używa tego portu: 'sudo netstat -tulpn | grep :$port'"
      ports_available=false
    else
      print_success "✅ Port $port jest dostępny"
    fi
  done
  
  if [ "$ports_available" = false ]; then
    all_checks_passed=false
  fi
  echo ""
  
  # Sprawdź pliki konfiguracyjne
  print_subheader "Sprawdzam pliki konfiguracyjne..."
  echo ""
  
  local config_files=("docker-compose.yml" "docker-compose.dev.yml" "myappassistant-chat-frontend/package.json")
  for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
      print_success "✅ $file istnieje"
    else
      print_error "❌ $file nie istnieje"
      print_status "   • Problem: Brak pliku konfiguracyjnego"
      print_status "   • Rozwiązanie: Sprawdź czy jesteś w odpowiednim katalogu"
      all_checks_passed=false
    fi
  done
  echo ""
  
  # Sprawdź uprawnienia
  print_subheader "Sprawdzam uprawnienia..."
  echo ""
  
  if [ -w "." ]; then
    print_success "✅ Katalog ma uprawnienia do zapisu"
  else
    print_error "❌ Brak uprawnień do zapisu w katalogu"
    print_status "   • Problem: Nie można tworzyć plików"
    print_status "   • Rozwiązanie: Sprawdź uprawnienia katalogu"
    all_checks_passed=false
  fi
  
  if groups | grep -q docker; then
    print_success "✅ Użytkownik należy do grupy docker"
  else
    print_warn "⚠️  Użytkownik nie należy do grupy docker"
    print_status "   • Może wymagać sudo dla komend Docker"
    print_status "   • Rozwiązanie: 'sudo usermod -aG docker $USER'"
  fi
  echo ""
  
  # Podsumowanie
  print_subheader "📋 Podsumowanie diagnostyki:"
  echo ""
  
  if [ "$all_checks_passed" = true ]; then
    print_success "🎉 Wszystkie sprawdzenia przeszły pomyślnie!"
    print_status "   • Środowisko jest gotowe do uruchomienia"
    print_status "   • Możesz bezpiecznie uruchomić system"
    echo ""
    print_subheader "💡 Co dalej?"
    print_status "• Wybierz opcję 'Uruchom system' z menu głównego"
    print_status "• System powinien uruchomić się bez problemów"
    return 0
  else
    print_error "❌ Znaleziono problemy w środowisku!"
    print_status "   • Niektóre sprawdzenia nie przeszły"
    print_status "   • Napraw problemy przed uruchomieniem"
    echo ""
    print_subheader "🔧 Jak naprawić problemy:"
    print_status "• Zainstaluj brakujące narzędzia"
    print_status "• Sprawdź uprawnienia i konfigurację"
    print_status "• Zwolnij zajęte porty"
    print_status "• Uruchom ponownie diagnostykę po naprawach"
    echo ""
    print_subheader "📚 Przydatne linki:"
    print_status "• Docker: https://docs.docker.com/get-docker/"
    print_status "• Node.js: https://nodejs.org/"
    print_status "• Docker Compose: https://docs.docker.com/compose/install/"
    return 1
  fi
}

# Funkcja automatycznego wykrywania środowiska Docker
detect_docker_environment() {
  print_subheader "Wykrywanie środowiska Docker..."
  
  # Sprawdź czy produkcyjne środowisko jest uruchomione
  if docker ps --format "table {{.Names}}" | grep -q "aiasisstmarubo-backend-1"; then
    print_success "Wykryto środowisko produkcyjne (docker-compose.yml)"
    DOCKER_COMPOSE_FILE="docker-compose.yml"
    return 0
  fi
  
  # Sprawdź czy deweloperskie środowisko jest uruchomione
  if docker ps --format "table {{.Names}}" | grep -q "foodsave-backend-dev"; then
    print_success "Wykryto środowisko deweloperskie (docker-compose.dev.yaml)"
    DOCKER_COMPOSE_FILE="docker-compose.dev.yaml"
    return 0
  fi
  
  # Jeśli żadne środowisko nie jest uruchomione, sprawdź który plik istnieje
  if [ -f "docker-compose.yml" ]; then
    print_status "Użyję środowiska produkcyjnego (docker-compose.yml)"
    DOCKER_COMPOSE_FILE="docker-compose.yml"
  elif [ -f "docker-compose.dev.yaml" ]; then
    print_status "Użyję środowiska deweloperskiego (docker-compose.dev.yaml)"
    DOCKER_COMPOSE_FILE="docker-compose.dev.yaml"
  else
    print_error "Nie znaleziono pliku docker-compose!"
    return 1
  fi
  
  return 0
}

# Funkcja sprawdzania czy porty są wolne
check_ports() {
  print_subheader "Sprawdzanie dostępności portów..."
  
  local issues=0
  
  # Sprawdź port backendu
  if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warn "Port $BACKEND_PORT (backend) jest zajęty"
    ((issues++))
  else
    print_success "Port $BACKEND_PORT (backend) jest wolny"
  fi
  
  # Sprawdź port frontendu
  if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warn "Port $FRONTEND_PORT (frontend) jest zajęty"
    ((issues++))
  else
    print_success "Port $FRONTEND_PORT (frontend) jest wolny"
  fi
  
  return $issues
}

# Funkcja wyświetlania interaktywnego menu
show_interactive_menu() {
  clear
  print_header "🍽️  FoodSave AI - Panel Sterowania"
  echo ""
  print_subheader "Witaj w systemie FoodSave AI!"
  echo "Ten panel pozwala Ci łatwo zarządzać inteligentnym systemem do zarządzania żywnością."
  echo ""
  print_subheader "Co chcesz zrobić?"
  echo ""
  echo "1) 🚀 Uruchom system (tryb deweloperski)"
  echo "   • Dla programistów i testowania"
  echo "   • Automatyczne przeładowanie przy zmianach"
  echo "   • Szczegółowe logi i debugowanie"
  echo ""
  echo "2) 🏭 Uruchom system (tryb produkcyjny)"
  echo "   • Dla użytkowników końcowych"
  echo "   • Zoptymalizowany i stabilny"
  echo "   • Szybsze działanie"
  echo ""
  echo "3) 🖥️  Uruchom aplikację desktop (Tauri)"
  echo "   • Natywna aplikacja dla Twojego systemu"
  echo "   • Działa bez przeglądarki"
  echo "   • Wymaga wcześniejszego zbudowania"
  echo ""
  echo "4) 🔨 Zbuduj aplikację desktop"
  echo "   • Tworzy plik instalacyjny aplikacji"
  echo "   • Może potrwać kilka minut"
  echo "   • Wymagane przed uruchomieniem aplikacji desktop"
  echo ""
  echo "5) 📊 Sprawdź status systemu"
  echo "   • Pokazuje stan wszystkich komponentów"
  echo "   • Sprawdza czy wszystko działa poprawnie"
  echo "   • Wyświetla przydatne linki"
  echo ""
  echo "6) 📝 Pokaż logi"
  echo "   • Dostęp do logów systemowych"
  echo "   • Pomocne przy rozwiązywaniu problemów"
  echo "   • Logi backendu, frontendu i Docker"
  echo ""
  echo "7) 🛑 Zatrzymaj wszystkie usługi"
  echo "   • Bezpiecznie zatrzymuje system"
  echo "   • Zwalnia zasoby komputera"
  echo "   • Przygotowuje do ponownego uruchomienia"
  echo ""
  echo "8) 🔧 Sprawdź środowisko"
  echo "   • Diagnostyka systemu"
  echo "   • Sprawdza wymagane narzędzia"
  echo "   • Pomaga rozwiązać problemy"
  echo ""
  echo "9) ❓ Pomoc i informacje"
  echo "   • Szczegółowe wyjaśnienia"
  echo "   • Rozwiązywanie problemów"
  echo "   • Przydatne linki i wskazówki"
  echo ""
  echo "0) 🚪 Wyjście"
  echo "   • Zamknij panel sterowania"
  echo ""
  read -p "Wybierz opcję (0-9): " choice
  
  case $choice in
    1) start_development_mode ;;
    2) start_production_mode ;;
    3) start_tauri_mode ;;
    4) build_tauri_app ;;
    5) show_detailed_status ;;
    6) show_logs_menu ;;
    7) stop_all_services ;;
    8) check_environment ;;
    9) show_help ;;
    0) exit 0 ;;
    *) 
      print_error "Nieprawidłowy wybór! Wybierz liczbę od 0 do 9."
      sleep 2
      show_interactive_menu
      ;;
  esac
}

# Funkcja uruchamiania trybu deweloperskiego
start_development_mode() {
  print_header "🚀 Uruchamianie trybu deweloperskiego..."
  echo ""
  print_subheader "Co to jest tryb deweloperski?"
  echo "• Dla programistów i testowania nowych funkcji"
  echo "• Automatycznie przeładowuje się przy zmianach w kodzie"
  echo "• Pokazuje szczegółowe logi i komunikaty błędów"
  echo "• Wolniejszy, ale bardziej elastyczny"
  echo ""
  
  print_status "Sprawdzam czy środowisko jest gotowe..."
  if ! check_environment; then
    print_error "Środowisko nie jest gotowe!"
    echo ""
    print_subheader "Co możesz zrobić:"
    echo "1. Uruchom opcję 'Sprawdź środowisko' aby zobaczyć szczegóły"
    echo "2. Zainstaluj brakujące narzędzia"
    echo "3. Uruchom ponownie po naprawieniu problemów"
    echo ""
    read -p "Naciśnij Enter, aby wrócić do menu..."
    show_interactive_menu
    return
  fi
  
  print_success "Środowisko jest gotowe! Uruchamiam system..."
  echo ""
  
  print_status "Krok 1/3: Uruchamiam backend (serwer)..."
  if start_backend; then
    print_success "✅ Backend uruchomiony pomyślnie!"
  else
    print_error "❌ Nie udało się uruchomić backendu!"
    echo ""
    print_subheader "Możliwe przyczyny:"
    echo "• Port 8000 jest zajęty przez inną aplikację"
    echo "• Baza danych nie jest dostępna"
    echo "• Brak uprawnień do Docker"
    echo ""
    print_status "Sprawdź logi w opcji 'Pokaż logi' aby zobaczyć szczegóły błędu."
    read -p "Naciśnij Enter, aby wrócić do menu..."
    show_interactive_menu
    return
  fi
  
  print_status "Krok 2/3: Uruchamiam frontend (interfejs web)..."
  if start_frontend_dev; then
    print_success "✅ Frontend uruchomiony pomyślnie!"
  else
    print_error "❌ Nie udało się uruchomić frontendu!"
    echo ""
    print_subheader "Możliwe przyczyny:"
    echo "• Port 3000 jest zajęty"
    echo "• Brak uprawnień do Node.js"
    echo "• Problem z zależnościami"
    echo ""
    print_status "Sprawdź plik frontend.log aby zobaczyć szczegóły błędu."
    read -p "Naciśnij Enter, aby wrócić do menu..."
    show_interactive_menu
    return
  fi
  
  print_status "Krok 3/3: Sprawdzam model AI (Ollama)..."
  if check_ollama; then
    print_success "✅ Model AI jest dostępny!"
  else
    print_warn "⚠️  Model AI nie jest dostępny"
    echo ""
    print_subheader "Co to oznacza:"
    echo "• System będzie działał, ale bez funkcji AI"
    echo "• Możesz uruchomić Ollama osobno: ollama serve"
    echo "• Lub zainstalować modele: ollama pull bielik"
    echo ""
  fi
  
  echo ""
  print_success "🎉 Tryb deweloperski uruchomiony pomyślnie!"
  echo ""
  show_detailed_status
  echo ""
  print_subheader "Przydatne linki:"
  print_status "🌐 Frontend (interfejs web): http://localhost:$FRONTEND_PORT"
  print_status "🔧 Backend (API): http://localhost:$BACKEND_PORT"
  print_status "📊 Dokumentacja API: http://localhost:$BACKEND_PORT/docs"
  echo ""
  print_subheader "Co dalej?"
  echo "• Otwórz przeglądarkę i przejdź do http://localhost:3000"
  echo "• Wszystkie zmiany w kodzie będą automatycznie przeładowane"
  echo "• Użyj opcji 'Pokaż logi' aby monitorować system"
  echo ""
  
  read -p "Naciśnij Enter, aby wrócić do menu..."
  show_interactive_menu
}

# Funkcja uruchamiania trybu produkcyjnego
start_production_mode() {
  print_header "🏭 Uruchamianie trybu produkcyjnego..."
  echo ""
  print_subheader "Co to jest tryb produkcyjny?"
  echo "• Dla użytkowników końcowych"
  echo "• Zoptymalizowany i stabilny"
  echo "• Szybsze działanie"
  echo "• Mniej szczegółowych logów"
  echo ""
  
  print_status "Sprawdzam czy środowisko jest gotowe..."
  if ! check_environment; then
    print_error "Środowisko nie jest gotowe!"
    echo ""
    print_subheader "Co możesz zrobić:"
    echo "1. Uruchom opcję 'Sprawdź środowisko' aby zobaczyć szczegóły"
    echo "2. Zainstaluj brakujące narzędzia"
    echo "3. Uruchom ponownie po naprawieniu problemów"
    echo ""
    read -p "Naciśnij Enter, aby wrócić do menu..."
    show_interactive_menu
    return
  fi
  
  print_success "Środowisko jest gotowe! Uruchamiam system..."
  echo ""
  
  print_status "Krok 1/3: Uruchamiam backend (serwer)..."
  if start_backend; then
    print_success "✅ Backend uruchomiony pomyślnie!"
  else
    print_error "❌ Nie udało się uruchomić backendu!"
    echo ""
    print_subheader "Możliwe przyczyny:"
    echo "• Port 8000 jest zajęty przez inną aplikację"
    echo "• Baza danych nie jest dostępna"
    echo "• Brak uprawnień do Docker"
    echo ""
    print_status "Sprawdź logi w opcji 'Pokaż logi' aby zobaczyć szczegóły błędu."
    read -p "Naciśnij Enter, aby wrócić do menu..."
    show_interactive_menu
    return
  fi
  
  print_status "Krok 2/3: Buduję i uruchamiam frontend (może potrwać kilka minut)..."
  if start_frontend_prod; then
    print_success "✅ Frontend uruchomiony pomyślnie!"
  else
    print_error "❌ Nie udało się uruchomić frontendu!"
    echo ""
    print_subheader "Możliwe przyczyny:"
    echo "• Port 3000 jest zajęty"
    echo "• Brak uprawnień do Node.js"
    echo "• Problem z zależnościami"
    echo "• Błąd podczas budowania"
    echo ""
    print_status "Sprawdź logi aby zobaczyć szczegóły błędu."
    read -p "Naciśnij Enter, aby wrócić do menu..."
    show_interactive_menu
    return
  fi
  
  print_status "Krok 3/3: Sprawdzam model AI (Ollama)..."
  if check_ollama; then
    print_success "✅ Model AI jest dostępny!"
  else
    print_warn "⚠️  Model AI nie jest dostępny"
    echo ""
    print_subheader "Co to oznacza:"
    echo "• System będzie działał, ale bez funkcji AI"
    echo "• Możesz uruchomić Ollama osobno: ollama serve"
    echo "• Lub zainstalować modele: ollama pull bielik"
    echo ""
  fi
  
  echo ""
  print_success "🎉 Tryb produkcyjny uruchomiony pomyślnie!"
  echo ""
  show_detailed_status
  echo ""
  print_subheader "Przydatne linki:"
  print_status "🌐 Frontend (interfejs web): http://localhost:$FRONTEND_PORT"
  print_status "🔧 Backend (API): http://localhost:$BACKEND_PORT"
  print_status "📊 Dokumentacja API: http://localhost:$BACKEND_PORT/docs"
  echo ""
  print_subheader "Co dalej?"
  echo "• Otwórz przeglądarkę i przejdź do http://localhost:3000"
  echo "• System jest gotowy do użytku produkcyjnego"
  echo "• Wszystkie funkcje są zoptymalizowane"
  echo ""
  
  read -p "Naciśnij Enter, aby wrócić do menu..."
  show_interactive_menu
}

# Funkcja uruchamiania trybu Tauri
start_tauri_mode() {
  print_header "🖥️  Uruchamianie aplikacji desktop..."
  
  if ! check_environment; then
    print_error "Środowisko nie jest gotowe!"
    read -p "Naciśnij Enter, aby wrócić do menu..."
    show_interactive_menu
    return
  fi
  
  print_status "Uruchamiam backend..."
  if start_backend; then
    print_status "Uruchamiam aplikację Tauri..."
    if start_tauri; then
      print_success "Aplikacja desktop uruchomiona pomyślnie!"
      show_detailed_status
    else
      print_error "Nie udało się uruchomić aplikacji desktop!"
      print_status "Uruchom opcję 'Zbuduj aplikację desktop' najpierw"
    fi
  else
    print_error "Nie udało się uruchomić backendu!"
  fi
  
  read -p "Naciśnij Enter, aby wrócić do menu..."
  show_interactive_menu
}

# Funkcja budowania aplikacji Tauri
build_tauri_app() {
  print_header "🔨 Budowanie aplikacji desktop..."
  
  if ! check_nodejs; then
    print_error "Node.js nie jest dostępny!"
    read -p "Naciśnij Enter, aby wrócić do menu..."
    show_interactive_menu
    return
  fi
  
  print_status "To może potrwać kilka minut..."
  if build_tauri; then
    print_success "Aplikacja desktop została zbudowana pomyślnie!"
    print_status "Możesz teraz uruchomić opcję 'Uruchom aplikację desktop'"
  else
    print_error "Budowanie nie powiodło się!"
  fi
  
  read -p "Naciśnij Enter, aby wrócić do menu..."
  show_interactive_menu
}

# Funkcja wyświetlania szczegółowego statusu
show_detailed_status() {
  print_header "📊 Status Systemu FoodSave AI"
  echo ""
  
  print_subheader "🔍 Sprawdzam komponenty systemu..."
  echo ""
  
  # Sprawdź backend
  print_status "Sprawdzam backend (serwer API)..."
  if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
    print_success "✅ Backend działa poprawnie"
    print_status "   • Port: $BACKEND_PORT"
    print_status "   • Status: Aktywny"
    print_status "   • Endpoint: http://localhost:$BACKEND_PORT"
  else
    print_error "❌ Backend nie odpowiada"
    print_status "   • Port: $BACKEND_PORT"
    print_status "   • Status: Nieaktywny"
    print_status "   • Sprawdź logi aby zobaczyć błąd"
  fi
  echo ""
  
  # Sprawdź frontend
  print_status "Sprawdzam frontend (interfejs web)..."
  if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
    print_success "✅ Frontend działa poprawnie"
    print_status "   • Port: $FRONTEND_PORT"
    print_status "   • Status: Aktywny"
    print_status "   • Endpoint: http://localhost:$FRONTEND_PORT"
  else
    print_error "❌ Frontend nie odpowiada"
    print_status "   • Port: $FRONTEND_PORT"
    print_status "   • Status: Nieaktywny"
    print_status "   • Sprawdź logi aby zobaczyć błąd"
  fi
  echo ""
  
  # Sprawdź Ollama
  print_status "Sprawdzam model AI (Ollama)..."
  if check_ollama; then
    print_success "✅ Model AI jest dostępny"
    print_status "   • Status: Aktywny"
    print_status "   • Funkcje AI: Dostępne"
    print_status "   • Endpoint: http://localhost:11434"
  else
    print_warn "⚠️  Model AI nie jest dostępny"
    print_status "   • Status: Nieaktywny"
    print_status "   • Funkcje AI: Niedostępne"
    print_status "   • System będzie działał bez AI"
  fi
  echo ""
  
  # Sprawdź Docker
  print_status "Sprawdzam kontenery Docker..."
  if command -v docker > /dev/null 2>&1; then
    if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "foodsave"; then
      print_success "✅ Kontenery Docker działają"
      print_status "   • Status: Aktywne"
      print_status "   • Sprawdź szczegóły poniżej:"
      echo ""
      docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "foodsave"
    else
      print_warn "⚠️  Brak aktywnych kontenerów FoodSave"
      print_status "   • Status: Nieaktywne"
      print_status "   • Uruchom system aby aktywować kontenery"
    fi
  else
    print_error "❌ Docker nie jest zainstalowany"
    print_status "   • Status: Niedostępny"
    print_status "   • Zainstaluj Docker aby uruchomić system"
  fi
  echo ""
  
  # Sprawdź baza danych
  print_status "Sprawdzam bazę danych..."
  if docker ps | grep -q "postgres"; then
    print_success "✅ Baza danych działa"
    print_status "   • Status: Aktywna"
    print_status "   • Typ: PostgreSQL"
    print_status "   • Port: 5432"
  else
    print_warn "⚠️  Baza danych nie jest uruchomiona"
    print_status "   • Status: Nieaktywna"
    print_status "   • Uruchom system aby aktywować bazę"
  fi
  echo ""
  
  print_subheader "🌐 Przydatne linki:"
  echo ""
  print_status "📱 Interfejs użytkownika:"
  print_status "   • http://localhost:$FRONTEND_PORT"
  print_status "   • Główna aplikacja web"
  echo ""
  print_status "🔧 API i dokumentacja:"
  print_status "   • http://localhost:$BACKEND_PORT/docs"
  print_status "   • Dokumentacja API (Swagger)"
  print_status "   • http://localhost:$BACKEND_PORT/health"
  print_status "   • Status zdrowia systemu"
  echo ""
  print_status "🤖 Model AI (jeśli dostępny):"
  print_status "   • http://localhost:11434"
  print_status "   • Interfejs Ollama"
  echo ""
  
  print_subheader "📈 Statystyki systemu:"
  echo ""
  # Pokaż użycie zasobów
  if command -v docker > /dev/null 2>&1; then
    print_status "Użycie zasobów Docker:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -5
    echo ""
  fi
  
  # Pokaż ostatnie logi
  print_status "Ostatnie logi systemu:"
  if [ -f "logs/backend/backend.log" ]; then
    print_status "   • Backend: $(tail -1 logs/backend/backend.log | cut -c1-50)..."
  fi
  if [ -f "logs/frontend/frontend.log" ]; then
    print_status "   • Frontend: $(tail -1 logs/frontend/frontend.log | cut -c1-50)..."
  fi
  echo ""
  
  print_subheader "💡 Co możesz zrobić:"
  echo ""
  print_status "• Użyj opcji 'Pokaż logi' aby zobaczyć szczegółowe logi"
  echo "• Użyj opcji 'Sprawdź środowisko' aby zdiagnozować problemy"
  echo "• Użyj opcji 'Zatrzymaj usługi' aby bezpiecznie zatrzymać system"
  echo ""
}

# Funkcja wyświetlania menu logów
show_logs_menu() {
  print_header "📝 Logi Systemu FoodSave AI"
  echo ""
  print_subheader "Wybierz, które logi chcesz zobaczyć:"
  echo ""
  print_status "Logi zawierają informacje o działaniu systemu i mogą pomóc w rozwiązywaniu problemów."
  echo ""
  
  echo "1) 🔧 Logi backendu (serwer API)"
  echo "   • Informacje o żądaniach API"
  echo "   • Błędy serwera i bazy danych"
  echo "   • Status połączeń i transakcji"
  echo ""
  echo "2) 🌐 Logi frontendu (interfejs web)"
  echo "   • Błędy JavaScript i React"
  echo "   • Problemy z ładowaniem stron"
  echo "   • Komunikaty o wydajności"
  echo ""
  echo "3) 🐳 Logi Docker (kontenery)"
  echo "   • Status kontenerów"
  echo "   • Problemy z uruchamianiem"
  echo "   • Użycie zasobów"
  echo ""
  echo "4) 🤖 Logi Ollama (model AI)"
  echo "   • Status modelu AI"
  echo "   • Błędy przetwarzania"
  echo "   • Wydajność modelu"
  echo ""
  echo "5) 📊 Wszystkie logi (podsumowanie)"
  echo "   • Krótkie podsumowanie wszystkich logów"
  echo "   • Ostatnie błędy i ostrzeżenia"
  echo "   • Status systemu"
  echo ""
  echo "6) 🔍 Szukaj w logach"
  echo "   • Wyszukaj konkretne błędy"
  echo "   • Filtruj logi według daty"
  echo "   • Znajdź problemy"
  echo ""
  echo "0) 🔙 Powrót do menu głównego"
  echo ""
  
  read -p "Wybierz opcję (0-6): " log_choice
  
  case $log_choice in
    1) show_backend_logs ;;
    2) show_frontend_logs ;;
    3) show_docker_logs ;;
    4) show_ollama_logs ;;
    5) show_all_logs_summary ;;
    6) search_logs ;;
    0) show_interactive_menu ;;
    *) 
      print_error "Nieprawidłowy wybór! Wybierz liczbę od 0 do 6."
      sleep 2
      show_logs_menu
      ;;
  esac
}

# Funkcja wyświetlania logów backendu
show_backend_logs() {
  print_header "🔧 Logi Backendu (Serwer API)"
  echo ""
  print_subheader "Ostatnie logi serwera API..."
  echo ""
  
  if [ -f "logs/backend/backend.log" ]; then
    print_status "Znaleziono plik logów backendu. Ostatnie 50 linii:"
    echo ""
    tail -50 logs/backend/backend.log | while IFS= read -r line; do
      if [[ "$line" == *"ERROR"* ]]; then
        print_error "$line"
      elif [[ "$line" == *"WARNING"* ]]; then
        print_warn "$line"
      elif [[ "$line" == *"INFO"* ]]; then
        print_success "$line"
      else
        print_status "$line"
      fi
    done
  else
    print_warn "Nie znaleziono pliku logów backendu"
    print_status "Możliwe przyczyny:"
    print_status "• Backend nie został jeszcze uruchomiony"
    print_status "• Logi są zapisywane w innym miejscu"
    print_status "• Sprawdź czy backend działa"
  fi
  
  echo ""
  print_subheader "Przydatne komendy:"
  print_status "• 'docker-compose logs backend' - logi z kontenera"
  print_status "• 'docker-compose logs -f backend' - logi na żywo"
  print_status "• 'curl http://localhost:8000/health' - sprawdź status"
  echo ""
  
  read -p "Naciśnij Enter, aby wrócić do menu logów..."
  show_logs_menu
}

# Funkcja wyświetlania logów frontendu
show_frontend_logs() {
  print_header "🌐 Logi Frontendu (Interfejs Web)"
  echo ""
  print_subheader "Ostatnie logi interfejsu web..."
  echo ""
  
  if [ -f "logs/frontend/frontend.log" ]; then
    print_status "Znaleziono plik logów frontendu. Ostatnie 50 linii:"
    echo ""
    tail -50 logs/frontend/frontend.log | while IFS= read -r line; do
      if [[ "$line" == *"error"* ]] || [[ "$line" == *"Error"* ]]; then
        print_error "$line"
      elif [[ "$line" == *"warn"* ]] || [[ "$line" == *"Warn"* ]]; then
        print_warn "$line"
      elif [[ "$line" == *"info"* ]] || [[ "$line" == *"Info"* ]]; then
        print_success "$line"
      else
        print_status "$line"
      fi
    done
  else
    print_warn "Nie znaleziono pliku logów frontendu"
    print_status "Możliwe przyczyny:"
    print_status "• Frontend nie został jeszcze uruchomiony"
    print_status "• Logi są wyświetlane w konsoli przeglądarki"
    print_status "• Sprawdź czy frontend działa"
  fi
  
  echo ""
  print_subheader "Przydatne wskazówki:"
  print_status "• Otwórz narzędzia deweloperskie w przeglądarce (F12)"
  print_status "• Sprawdź zakładkę 'Console' dla błędów JavaScript"
  print_status "• Sprawdź zakładkę 'Network' dla problemów z API"
  echo ""
  
  read -p "Naciśnij Enter, aby wrócić do menu logów..."
  show_logs_menu
}

# Funkcja wyświetlania logów Docker
show_docker_logs() {
  print_header "🐳 Logi Docker (Kontenery)"
  echo ""
  print_subheader "Status kontenerów i ich logi..."
  echo ""
  
  if command -v docker > /dev/null 2>&1; then
    print_status "Aktywne kontenery FoodSave:"
    echo ""
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "foodsave" || print_warn "Brak aktywnych kontenerów FoodSave"
    echo ""
    
    print_status "Ostatnie logi wszystkich kontenerów:"
    echo ""
    docker-compose logs --tail=20 2>/dev/null || print_warn "Nie można pobrać logów Docker Compose"
  else
    print_error "Docker nie jest zainstalowany lub nie działa"
  fi
  
  echo ""
  print_subheader "Przydatne komendy Docker:"
  print_status "• 'docker-compose logs' - wszystkie logi"
  print_status "• 'docker-compose logs -f' - logi na żywo"
  print_status "• 'docker-compose logs backend' - logi backendu"
  print_status "• 'docker-compose logs frontend' - logi frontendu"
  print_status "• 'docker stats' - użycie zasobów"
  echo ""
  
  read -p "Naciśnij Enter, aby wrócić do menu logów..."
  show_logs_menu
}

# Funkcja wyświetlania logów Ollama
show_ollama_logs() {
  print_header "🤖 Logi Ollama (Model AI)"
  echo ""
  print_subheader "Status modelu AI i jego logi..."
  echo ""
  
  print_status "Sprawdzam status Ollama..."
  if check_ollama; then
    print_success "✅ Ollama działa poprawnie"
    echo ""
    print_status "Dostępne modele:"
    ollama list 2>/dev/null || print_warn "Nie można pobrać listy modeli"
    echo ""
    print_status "Ostatnie logi Ollama:"
    journalctl -u ollama --no-pager -n 20 2>/dev/null || print_warn "Nie można pobrać logów Ollama"
  else
    print_error "❌ Ollama nie działa"
    print_status "Możliwe przyczyny:"
    print_status "• Usługa Ollama nie jest uruchomiona"
    print_status "• Brak zainstalowanych modeli"
    print_status "• Problem z konfiguracją"
    echo ""
    print_status "Jak uruchomić Ollama:"
    print_status "• 'ollama serve' - uruchom serwer"
    print_status "• 'ollama pull bielik' - zainstaluj model"
  fi
  
  echo ""
  print_subheader "Przydatne komendy Ollama:"
  print_status "• 'ollama list' - lista modeli"
  print_status "• 'ollama pull bielik' - pobierz model"
  print_status "• 'ollama run bielik' - uruchom model"
  print_status "• 'curl http://localhost:11434/api/tags' - sprawdź API"
  echo ""
  
  read -p "Naciśnij Enter, aby wrócić do menu logów..."
  show_logs_menu
}

# Funkcja wyświetlania podsumowania wszystkich logów
show_all_logs_summary() {
  print_header "📊 Podsumowanie Wszystkich Logów"
  echo ""
  print_subheader "Krótkie podsumowanie statusu systemu..."
  echo ""
  
  print_status "🔍 Analizuję logi systemu..."
  echo ""
  
  # Sprawdź błędy w logach
  local error_count=0
  local warning_count=0
  
  if [ -f "logs/backend/backend.log" ]; then
    error_count=$((error_count + $(grep -c "ERROR" logs/backend/backend.log 2>/dev/null || echo 0)))
    warning_count=$((warning_count + $(grep -c "WARNING" logs/backend/backend.log 2>/dev/null || echo 0)))
  fi
  
  if [ -f "logs/frontend/frontend.log" ]; then
    error_count=$((error_count + $(grep -c "error" logs/frontend/frontend.log 2>/dev/null || echo 0)))
    warning_count=$((warning_count + $(grep -c "warn" logs/frontend/frontend.log 2>/dev/null || echo 0)))
  fi
  
  print_status "📈 Statystyki logów:"
  print_status "   • Błędy: $error_count"
  print_status "   • Ostrzeżenia: $warning_count"
  echo ""
  
  if [ $error_count -gt 0 ]; then
    print_error "❌ Znaleziono błędy w logach!"
    print_status "Sprawdź szczegółowe logi aby zobaczyć problemy."
  else
    print_success "✅ Nie znaleziono błędów w logach"
  fi
  
  if [ $warning_count -gt 0 ]; then
    print_warn "⚠️  Znaleziono ostrzeżenia w logach"
    print_status "Sprawdź szczegółowe logi aby zobaczyć ostrzeżenia."
  fi
  
  echo ""
  print_subheader "Ostatnie ważne komunikaty:"
  echo ""
  
  # Pokaż ostatnie błędy
  if [ -f "logs/backend/backend.log" ]; then
    print_status "Backend - ostatnie błędy:"
    grep "ERROR" logs/backend/backend.log | tail -3 | while IFS= read -r line; do
      print_error "$line"
    done
    echo ""
  fi
  
  if [ -f "logs/frontend/frontend.log" ]; then
    print_status "Frontend - ostatnie błędy:"
    grep "error" logs/frontend/frontend.log | tail -3 | while IFS= read -r line; do
      print_error "$line"
    done
    echo ""
  fi
  
  print_subheader "💡 Rekomendacje:"
  echo ""
  if [ $error_count -gt 0 ]; then
    print_status "• Sprawdź szczegółowe logi aby zdiagnozować problemy"
    print_status "• Uruchom diagnostykę środowiska"
    print_status "• Rozważ ponowne uruchomienie usług"
  else
    print_status "• System wydaje się działać poprawnie"
    print_status "• Kontynuuj monitorowanie logów"
    print_status "• Sprawdź wydajność systemu"
  fi
  echo ""
  
  read -p "Naciśnij Enter, aby wrócić do menu logów..."
  show_logs_menu
}

# Funkcja wyszukiwania w logach
search_logs() {
  print_header "🔍 Wyszukiwanie w Logach"
  echo ""
  print_subheader "Wyszukaj konkretne informacje w logach..."
  echo ""
  
  print_status "Co chcesz wyszukać?"
  echo "1) Błędy (ERROR, error)"
  echo "2) Ostrzeżenia (WARNING, warn)"
  echo "3) Konkretny tekst"
  echo "4) Logi z dzisiejszego dnia"
  echo "0) Powrót do menu logów"
  echo ""
  
  read -p "Wybierz opcję (0-4): " search_choice
  
  case $search_choice in
    1) search_logs_by_type "ERROR\|error" "Błędy" ;;
    2) search_logs_by_type "WARNING\|warn" "Ostrzeżenia" ;;
    3) search_logs_by_text ;;
    4) search_logs_by_date ;;
    0) show_logs_menu ;;
    *) 
      print_error "Nieprawidłowy wybór!"
      sleep 2
      search_logs
      ;;
  esac
}

# Funkcja wyszukiwania logów według typu
search_logs_by_type() {
  local pattern="$1"
  local type_name="$2"
  
  print_header "🔍 Wyszukiwanie: $type_name"
  echo ""
  print_subheader "Znalezione $type_name w logach..."
  echo ""
  
  local found_any=false
  
  if [ -f "logs/backend/backend.log" ]; then
    print_status "Backend - $type_name:"
    if grep -i "$pattern" logs/backend/backend.log > /dev/null; then
      grep -i "$pattern" logs/backend/backend.log | tail -10
      found_any=true
    else
      print_status "   Brak $type_name"
    fi
    echo ""
  fi
  
  if [ -f "logs/frontend/frontend.log" ]; then
    print_status "Frontend - $type_name:"
    if grep -i "$pattern" logs/frontend/frontend.log > /dev/null; then
      grep -i "$pattern" logs/frontend/frontend.log | tail -10
      found_any=true
    else
      print_status "   Brak $type_name"
    fi
    echo ""
  fi
  
  if [ "$found_any" = false ]; then
    print_success "✅ Nie znaleziono $type_name w logach"
  fi
  
  echo ""
  read -p "Naciśnij Enter, aby wrócić do wyszukiwania..."
  search_logs
}

# Funkcja wyszukiwania logów według tekstu
search_logs_by_text() {
  print_header "🔍 Wyszukiwanie Tekstu w Logach"
  echo ""
  print_subheader "Wprowadź tekst do wyszukania..."
  echo ""
  
  read -p "Wprowadź tekst do wyszukania: " search_text
  
  if [ -z "$search_text" ]; then
    print_error "Nie wprowadzono tekstu do wyszukania!"
    sleep 2
    search_logs
    return
  fi
  
  print_header "🔍 Wyniki wyszukiwania: '$search_text'"
  echo ""
  
  local found_any=false
  
  if [ -f "logs/backend/backend.log" ]; then
    print_status "Backend - wyniki:"
    if grep -i "$search_text" logs/backend/backend.log > /dev/null; then
      grep -i "$search_text" logs/backend/backend.log | tail -10
      found_any=true
    else
      print_status "   Brak wyników"
    fi
    echo ""
  fi
  
  if [ -f "logs/frontend/frontend.log" ]; then
    print_status "Frontend - wyniki:"
    if grep -i "$search_text" logs/frontend/frontend.log > /dev/null; then
      grep -i "$search_text" logs/frontend/frontend.log | tail -10
      found_any=true
    else
      print_status "   Brak wyników"
    fi
    echo ""
  fi
  
  if [ "$found_any" = false ]; then
    print_warn "Nie znaleziono tekstu '$search_text' w logach"
  fi
  
  echo ""
  read -p "Naciśnij Enter, aby wrócić do wyszukiwania..."
  search_logs
}

# Funkcja wyszukiwania logów według daty
search_logs_by_date() {
  print_header "🔍 Wyszukiwanie Logów z Dzisiejszego Dnia"
  echo ""
  print_subheader "Logi z dzisiejszego dnia..."
  echo ""
  
  local today=$(date +%Y-%m-%d)
  local found_any=false
  
  if [ -f "logs/backend/backend.log" ]; then
    print_status "Backend - dzisiejsze logi:"
    if grep "$today" logs/backend/backend.log > /dev/null; then
      grep "$today" logs/backend/backend.log | tail -10
      found_any=true
    else
      print_status "   Brak logów z dzisiejszego dnia"
    fi
    echo ""
  fi
  
  if [ -f "logs/frontend/frontend.log" ]; then
    print_status "Frontend - dzisiejsze logi:"
    if grep "$today" logs/frontend/frontend.log > /dev/null; then
      grep "$today" logs/frontend/frontend.log | tail -10
      found_any=true
    else
      print_status "   Brak logów z dzisiejszego dnia"
    fi
    echo ""
  fi
  
  if [ "$found_any" = false ]; then
    print_warn "Nie znaleziono logów z dzisiejszego dnia ($today)"
  fi
  
  echo ""
  read -p "Naciśnij Enter, aby wrócić do wyszukiwania..."
  search_logs
}

# Oryginalne funkcje (zachowane)
start_backend() {
  print_status "Uruchamianie backendu..."
  
  # Wykryj środowisko Docker
  if ! detect_docker_environment; then
    print_error "Nie można wykryć środowiska Docker!"
    return 1
  fi
  
  print_status "Używam: $DOCKER_COMPOSE_FILE"
  docker compose -f "$DOCKER_COMPOSE_FILE" up -d backend
  sleep 5
  if curl -s http://localhost:$BACKEND_PORT/health > /dev/null; then
    print_success "Backend uruchomiony na porcie $BACKEND_PORT"
    return 0
  else
    print_error "Backend nie odpowiada"
    return 1
  fi
}

# Funkcja do zabijania procesu na porcie 3000
kill_port_3000() {
  local pid=$(lsof -ti:3000)
  if [ ! -z "$pid" ]; then
    print_warn "Znaleziono proces na porcie 3000 (PID: $pid). Zatrzymuję..."
    kill -9 $pid 2>/dev/null || true
    sleep 2
    # Sprawdź czy port jest teraz wolny
    if lsof -ti:3000 >/dev/null 2>&1; then
      print_error "Nie udało się zwolnić portu 3000"
      return 1
    else
      print_success "Port 3000 zwolniony"
      return 0
    fi
  fi
  
  # Dodatkowo zabij wszystkie procesy Next.js i Node.js związane z frontendem
  local next_pids=$(pgrep -f "next dev" || true)
  local node_pids=$(pgrep -f "node.*next" || true)
  
  if [ ! -z "$next_pids" ] || [ ! -z "$node_pids" ]; then
    print_warn "Znaleziono procesy Next.js/Node.js. Zatrzymuję..."
    kill -9 $next_pids $node_pids 2>/dev/null || true
    sleep 2
  fi
  
  return 0
}

start_frontend_dev() {
  print_status "Uruchamianie frontendu (tryb deweloperski)..."
  cd myappassistant-chat-frontend

  # Sprawdź czy port 3000 jest wolny
  if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
    print_warn "Port 3000 jest zajęty. Próbuję zwolnić..."
    if kill_port_3000; then
      print_status "Port 3000 zwolniony, uruchamiam frontend..."
    else
      print_error "Nie udało się zwolnić portu 3000. Frontend nie zostanie uruchomiony."
      cd ..
      return 1
    fi
  fi

  # Wymuś PORT=3000 i loguj do pliku
  PORT=3000 npm run dev > ../frontend.log 2>&1 &
  sleep 3
  if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    print_success "Frontend uruchomiony na porcie $FRONTEND_PORT"
    cd ..
    return 0
  else
    print_warn "Frontend może się jeszcze uruchamiać lub wystąpił błąd. Sprawdź frontend.log."
    cd ..
    return 1
  fi
}

start_frontend_prod() {
  print_status "Budowanie i uruchamianie frontendu (tryb produkcyjny)..."
  cd myappassistant-chat-frontend
  npm run build
  npx serve out -p $FRONTEND_PORT &
  sleep 3
  print_success "Frontend produkcyjny uruchomiony na porcie $FRONTEND_PORT"
  cd ..
  return 0
}

start_tauri() {
  print_status "Uruchamianie aplikacji Tauri..."
  if [ -f "$TAURI_APP" ]; then
    cd myappassistant-chat-frontend/src-tauri/target/release/bundle/appimage
    ./"FoodSave AI_1.0.0_amd64.AppImage" &
    print_success "Aplikacja Tauri uruchomiona"
    cd ../../../../..
    return 0
  else
    print_error "Aplikacja Tauri nie została zbudowana. Uruchom: npm run tauri:build"
    return 1
  fi
}

build_tauri() {
  print_status "Budowanie aplikacji Tauri..."
  cd myappassistant-chat-frontend
  
  # Sprawdź czy node_modules istnieje
  if [ ! -d "node_modules" ]; then
    print_warn "node_modules nie istnieje. Instaluję zależności..."
    npm install
  fi
  
  # Sprawdź czy src-tauri istnieje
  if [ ! -d "src-tauri" ]; then
    print_error "Katalog src-tauri nie istnieje!"
    cd ..
    return 1
  fi
  
  # Buduj frontend dla Tauri
  print_status "Budowanie frontendu dla Tauri..."
  npm run build
  
  # Buduj aplikację Tauri
  print_status "Budowanie aplikacji Tauri..."
  npm run tauri:build
  
  # Sprawdź czy budowanie się powiodło - używamy ścieżki względnej do katalogu myappassistant-chat-frontend
  local tauri_app_path="src-tauri/target/release/bundle/appimage/FoodSave AI_1.0.0_amd64.AppImage"
  if [ -f "$tauri_app_path" ]; then
    print_success "Aplikacja Tauri została zbudowana pomyślnie!"
    print_status "Lokalizacja: $tauri_app_path"
    
    # Pokaż informacje o pliku
    local file_size=$(du -h "$tauri_app_path" | cut -f1)
    print_status "Rozmiar pliku: $file_size"
    
    # Sprawdź czy można uruchomić
    if [ -x "$tauri_app_path" ]; then
      print_success "Aplikacja jest gotowa do uruchomienia"
    else
      print_warn "Aplikacja nie ma uprawnień do wykonania. Dodaję uprawnienia..."
      chmod +x "$tauri_app_path"
    fi
    cd ..
    return 0
  else
    print_error "Budowanie aplikacji Tauri nie powiodło się!"
    print_status "Sprawdź logi w katalogu myappassistant-chat-frontend/"
    cd ..
    return 1
  fi
}

# Zachowanie kompatybilności z oryginalnymi poleceniami
show_help_legacy() {
  echo -e "${BLUE}FoodSave AI - Skrypt automatyzujący${NC}"
  echo ""
  echo "Użycie: food [polecenie]"
  echo ""
  echo "Polecenia:"
  echo "  dev     - Uruchom tryb deweloperski (backend + frontend dev)"
  echo "  prod    - Uruchom tryb produkcyjny (backend + frontend statyczny)"
  echo "  tauri   - Uruchom backend + aplikację Tauri"
  echo "  build   - Zbuduj aktualną aplikację Tauri"
  echo "  stop    - Zatrzymaj wszystkie usługi"
  echo "  status  - Pokaż status systemu"
  echo "  logs    - Pokaż logi backendu"
  echo "  help    - Pokaż tę pomoc"
  echo "  menu    - Uruchom interaktywne menu"
}

# Funkcja zatrzymywania wszystkich usług
stop_all_services() {
  print_header "🛑 Zatrzymywanie Systemu FoodSave AI"
  echo ""
  print_subheader "Bezpieczne zatrzymywanie wszystkich komponentów..."
  echo ""
  
  print_status "Krok 1/4: Sprawdzam aktywne procesy..."
  
  # Sprawdź czy coś działa
  local running_services=0
  
  if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
    print_status "   • Backend: Aktywny"
    running_services=$((running_services + 1))
  else
    print_status "   • Backend: Nieaktywny"
  fi
  
  if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
    print_status "   • Frontend: Aktywny"
    running_services=$((running_services + 1))
  else
    print_status "   • Frontend: Nieaktywny"
  fi
  
  if pgrep -f "FoodSave AI" > /dev/null; then
    print_status "   • Aplikacja desktop: Aktywna"
    running_services=$((running_services + 1))
  else
    print_status "   • Aplikacja desktop: Nieaktywna"
  fi
  
  if [ $running_services -eq 0 ]; then
    print_warn "⚠️  Nie znaleziono aktywnych usług FoodSave"
    print_status "   • System może być już zatrzymany"
    echo ""
    read -p "Naciśnij Enter, aby wrócić do menu..."
    show_interactive_menu
    return
  fi
  
  echo ""
  print_status "Krok 2/4: Zatrzymuję kontenery Docker..."
  
  # Wykryj środowisko Docker
  if detect_docker_environment; then
    print_status "   • Znaleziono środowisko: $DOCKER_COMPOSE_FILE"
    if docker compose -f "$DOCKER_COMPOSE_FILE" down > /dev/null 2>&1; then
      print_success "   ✅ Kontenery Docker zatrzymane"
    else
      print_warn "   ⚠️  Problem z zatrzymaniem kontenerów Docker"
    fi
  else
    print_status "   • Brak aktywnego środowiska Docker"
  fi
  
  print_status "Krok 3/4: Zatrzymuję procesy frontendu..."
  
  # Zatrzymaj procesy frontendu
  local frontend_processes=0
  
  if pkill -f "npm run dev" > /dev/null 2>&1; then
    frontend_processes=$((frontend_processes + 1))
  fi
  
  if pkill -f "next dev" > /dev/null 2>&1; then
    frontend_processes=$((frontend_processes + 1))
  fi
  
  if pkill -f "npx serve out" > /dev/null 2>&1; then
    frontend_processes=$((frontend_processes + 1))
  fi
  
  if pkill -f "serve out" > /dev/null 2>&1; then
    frontend_processes=$((frontend_processes + 1))
  fi
  
  if [ $frontend_processes -gt 0 ]; then
    print_success "   ✅ Zatrzymano $frontend_processes proces(ów) frontendu"
  else
    print_status "   • Brak aktywnych procesów frontendu"
  fi
  
  print_status "Krok 4/4: Zatrzymuję aplikację desktop..."
  
  # Zatrzymaj aplikację desktop
  if pkill -f "FoodSave AI" > /dev/null 2>&1; then
    print_success "   ✅ Aplikacja desktop zatrzymana"
  else
    print_status "   • Brak aktywnej aplikacji desktop"
  fi
  
  echo ""
  print_success "🎉 System FoodSave AI został bezpiecznie zatrzymany!"
  echo ""
  print_subheader "Co zostało zatrzymane:"
  print_status "• Kontenery Docker (backend, baza danych)"
  print_status "• Procesy frontendu (Node.js, Next.js)"
  print_status "• Aplikacja desktop (Tauri)"
  echo ""
  print_subheader "Zasoby zostały zwolnione:"
  print_status "• Porty: 3000, 8000, 5432"
  print_status "• Pamięć RAM"
  print_status "• Procesor CPU"
  echo ""
  print_subheader "Co możesz zrobić dalej:"
  print_status "• Uruchom system ponownie z menu głównego"
  print_status "• Sprawdź status systemu"
  print_status "• Sprawdź logi aby zobaczyć szczegóły zatrzymania"
  echo ""
  
  read -p "Naciśnij Enter, aby wrócić do menu..."
  show_interactive_menu
}

# Główna logika
case "${1:-menu}" in
  dev)
    start_backend
    start_frontend_dev
    check_ollama
    show_detailed_status
    print_success "Tryb deweloperski uruchomiony!"
    print_status "Frontend: http://localhost:$FRONTEND_PORT"
    print_status "Backend: http://localhost:$BACKEND_PORT"
    ;;
  prod)
    start_backend
    start_frontend_prod
    check_ollama
    show_detailed_status
    print_success "Tryb produkcyjny uruchomiony!"
    ;;
  tauri)
    start_backend
    start_tauri
    check_ollama
    show_detailed_status
    print_success "Backend + Tauri uruchomione!"
    ;;
  build)
    build_tauri
    ;;
  stop)
    stop_all_services
    ;;
  status)
    show_detailed_status
    ;;
  logs)
    # Wykryj środowisko Docker
    if detect_docker_environment; then
      docker compose -f "$DOCKER_COMPOSE_FILE" logs backend --tail=20
    else
      print_error "Nie można wykryć środowiska Docker!"
    fi
    ;;
  help)
    show_help_legacy
    ;;
  menu|*)
    show_interactive_menu
    ;;
esac 