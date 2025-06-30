#!/bin/bash

# FoodSave AI GUI - Skrypt uruchamiania
# Intuicyjne GUI dla użytkowników nietechnicznych

set -e

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

# Automatyczne przejście do katalogu skryptu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_header "🍽️ FoodSave AI - Panel Sterowania GUI"
echo ""
print_subheader "Uruchamianie intuicyjnego interfejsu użytkownika..."
echo ""

# Sprawdź czy Python jest dostępny
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 nie jest zainstalowany!"
    print_status "Zainstaluj Python 3: sudo apt install python3 python3-pip"
    exit 1
fi

print_success "Python 3 jest dostępny: $(python3 --version)"

# Sprawdź czy wymagane pakiety są zainstalowane
print_status "Sprawdzam wymagane pakiety Python..."

# Definicja pakietów i ich nazw modułów
declare -A PACKAGE_MODULES=(
    ["flask"]="flask"
    ["flask-cors"]="flask_cors"
    ["psutil"]="psutil"
    ["requests"]="requests"
)

for package in "${!PACKAGE_MODULES[@]}"; do
    module_name="${PACKAGE_MODULES[$package]}"
    if python3 -c "import $module_name" 2>/dev/null; then
        print_success "✅ $package jest zainstalowany"
    else
        print_warn "⚠️  $package nie jest zainstalowany"
        print_status "Instaluję $package..."
        pip3 install "$package" --user
        if python3 -c "import $module_name" 2>/dev/null; then
            print_success "✅ $package został zainstalowany"
        else
            print_error "❌ Nie udało się zainstalować $package"
            exit 1
        fi
    fi
done

echo ""

# Sprawdź czy skrypt foodsave-all.sh istnieje
if [ ! -f "../foodsave-all.sh" ]; then
    print_error "Nie znaleziono skryptu foodsave-all.sh!"
    print_status "Upewnij się, że jesteś w odpowiednim katalogu"
    exit 1
fi

print_success "Skrypt foodsave-all.sh został znaleziony"

# Sprawdź uprawnienia do skryptu
if [ ! -x "../foodsave-all.sh" ]; then
    print_warn "Brak uprawnień do wykonania foodsave-all.sh"
    print_status "Nadaję uprawnienia..."
    chmod +x "../foodsave-all.sh"
    print_success "Uprawnienia zostały nadane"
fi

# Sprawdź czy port 8080 jest wolny
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warn "Port 8080 jest zajęty"
    print_status "Zatrzymuję proces na porcie 8080..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    sleep 2
    print_success "Port 8080 został zwolniony"
else
    print_success "Port 8080 jest wolny"
fi

echo ""
print_header "🚀 Uruchamiam GUI FoodSave AI..."
echo ""

print_subheader "Co to jest GUI FoodSave AI?"
echo "• Intuicyjny interfejs dla użytkowników nietechnicznych"
echo "• Zastępuje konsolowy skrypt foodsave-all.sh"
echo "• Łatwe zarządzanie systemem przez przeglądarkę"
echo "• Nowoczesny i responsywny design"
echo ""

print_status "Uruchamiam serwer GUI..."
echo ""

# Uruchom serwer GUI
python3 server.py &

# Zapisz PID procesu
GUI_PID=$!
echo $GUI_PID > gui.pid

# Poczekaj chwilę na uruchomienie serwera
sleep 3

# Sprawdź czy serwer się uruchomił
if curl -s http://localhost:8080/health > /dev/null; then
    print_success "🎉 GUI FoodSave AI zostało uruchomione pomyślnie!"
    echo ""
    print_subheader "Przydatne informacje:"
    print_status "🌐 Adres GUI: http://localhost:8080"
    print_status "🔧 Health check: http://localhost:8080/health"
    print_status "📱 GUI jest responsywne - działa na telefonach i tabletach"
    echo ""
    print_subheader "Jak używać GUI:"
    print_status "1. Otwórz przeglądarkę i przejdź do http://localhost:8080"
    print_status "2. Sprawdź status systemu w sekcji 'Status Systemu'"
    print_status "3. Użyj 'Szybkich Akcji' do uruchomienia/zatrzymania systemu"
    print_status "4. Skorzystaj z 'Opcji Zaawansowanych' dla dodatkowych funkcji"
    echo ""
    print_subheader "Zatrzymanie GUI:"
    print_status "• Naciśnij Ctrl+C w tym terminalu"
    print_status "• Lub uruchom: ./stop-gui.sh"
    echo ""
    print_subheader "Logi serwera:"
    print_status "• Logi będą wyświetlane poniżej"
    print_status "• GUI działa w tle na porcie 8080"
    echo ""
    
    # Otwórz przeglądarkę automatycznie (jeśli jest dostępna)
    if command -v xdg-open &> /dev/null; then
        print_status "Otwieram przeglądarkę automatycznie..."
        xdg-open http://localhost:8080 2>/dev/null || true
    elif command -v open &> /dev/null; then
        print_status "Otwieram przeglądarkę automatycznie..."
        open http://localhost:8080 2>/dev/null || true
    fi
    
    echo "=" * 50
    print_header "GUI jest gotowe! 🎉"
    echo "=" * 50
    
    # Czekaj na zakończenie procesu
    wait $GUI_PID
    
else
    print_error "❌ Nie udało się uruchomić GUI!"
    print_status "Sprawdź logi powyżej aby zobaczyć szczegóły błędu"
    exit 1
fi 