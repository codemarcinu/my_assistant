#!/bin/bash

# FoodSave AI GUI - Uproszczony skrypt uruchamiania
# Przyjazny interfejs dla użytkowników nietechnicznych

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
print_subheader "Witamy w intuicyjnym interfejsie zarządzania systemem!"
echo ""

# Sprawdź czy to pierwsze uruchomienie
if [ ! -f ".first_run_completed" ]; then
    print_subheader "🎉 Pierwsze uruchomienie - Konfiguracja automatyczna"
    echo "System zostanie skonfigurowany automatycznie w przeglądarce."
    echo ""
fi

# Sprawdź czy Python jest dostępny
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 nie jest zainstalowany!"
    print_status "Instaluję Python 3 automatycznie..."
    
    if command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y python3 python3-pip
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3 python3-pip
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y python3 python3-pip
    else
        print_error "Nie udało się automatycznie zainstalować Python 3"
        print_status "Zainstaluj Python 3 ręcznie i uruchom ponownie"
        exit 1
    fi
fi

print_success "Python 3 jest dostępny: $(python3 --version)"

# Automatyczna instalacja wymaganych pakietów
print_status "Sprawdzam i instaluję wymagane pakiety..."

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
        print_status "Instaluję $package automatycznie..."
        pip3 install "$package" --user --quiet
        if python3 -c "import $module_name" 2>/dev/null; then
            print_success "✅ $package został zainstalowany"
        else
            print_error "❌ Nie udało się zainstalować $package"
            print_status "Spróbuję zainstalować z uprawnieniami administratora..."
            sudo pip3 install "$package" --quiet
            if python3 -c "import $module_name" 2>/dev/null; then
                print_success "✅ $package został zainstalowany (z uprawnieniami administratora)"
            else
                print_error "❌ Nie udało się zainstalować $package"
                exit 1
            fi
        fi
    fi
done

echo ""

# Sprawdź czy skrypt foodsave-all.sh istnieje
if [ ! -f "../foodsave-all.sh" ]; then
    print_error "Nie znaleziono głównego skryptu foodsave-all.sh!"
    print_status "Upewnij się, że jesteś w odpowiednim katalogu projektu"
    print_status "Struktura powinna wyglądać tak:"
    echo "  📁 AIASISSTMARUBO/"
    echo "    📁 foodsave-gui/"
    echo "    📄 foodsave-all.sh"
    exit 1
fi

print_success "Główny skrypt foodsave-all.sh został znaleziony"

# Sprawdź uprawnienia do skryptu
if [ ! -x "../foodsave-all.sh" ]; then
    print_warn "Brak uprawnień do wykonania foodsave-all.sh"
    print_status "Nadaję uprawnienia automatycznie..."
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
echo "• 🎯 Intuicyjny interfejs dla każdego użytkownika"
echo "• 🔄 Zastępuje skomplikowane komendy konsolowe"
echo "• 🖱️  Zarządzanie systemem przez przeglądarkę"
echo "• 📱 Nowoczesny i responsywny design"
echo "• 🎨 Przyjazny dla użytkowników nietechnicznych"
echo ""

print_status "Uruchamiam serwer GUI..."
echo ""

# Uruchom serwer GUI w tle
python3 server.py > gui.log 2>&1 &

# Zapisz PID procesu
GUI_PID=$!
echo $GUI_PID > gui.pid

# Poczekaj chwilę na uruchomienie serwera
sleep 3

# Sprawdź czy serwer się uruchomił
if curl -s http://localhost:8080/health > /dev/null; then
    print_success "🎉 GUI FoodSave AI zostało uruchomione pomyślnie!"
    echo ""
    
    # Oznacz pierwsze uruchomienie jako zakończone
    touch .first_run_completed
    
    print_subheader "📋 Przydatne informacje:"
    print_status "🌐 Adres GUI: http://localhost:8080"
    print_status "🔧 Health check: http://localhost:8080/health"
    print_status "📱 GUI jest responsywne - działa na telefonach i tabletach"
    echo ""
    
    print_subheader "🎯 Jak używać GUI:"
    if [ ! -f ".first_run_completed" ]; then
        print_status "1. 🎉 Otwórz przeglądarkę - kreator konfiguracji uruchomi się automatycznie"
        print_status "2. 📋 Postępuj zgodnie z instrukcjami kreatora"
        print_status "3. ✅ System zostanie skonfigurowany automatycznie"
    else
        print_status "1. 🌐 Otwórz przeglądarkę i przejdź do http://localhost:8080"
        print_status "2. 🚀 Kliknij 'URUCHOM APLIKACJĘ' aby włączyć system"
        print_status "3. 📊 Użyj 'SPRAWDŹ STATUS' aby zobaczyć czy wszystko działa"
        print_status "4. 🛠️  Skorzystaj z 'USTAWIENIA' dla dodatkowych opcji"
    fi
    echo ""
    
    print_subheader "🛑 Zatrzymanie GUI:"
    print_status "• Naciśnij Ctrl+C w tym terminalu"
    print_status "• Lub uruchom: ./stop-gui.sh"
    echo ""
    
    print_subheader "📊 Logi serwera:"
    print_status "• Logi są zapisywane w pliku: gui.log"
    print_status "• GUI działa w tle na porcie 8080"
    echo ""
    
    # Otwórz przeglądarkę automatycznie
    print_status "🌐 Otwieram przeglądarkę automatycznie..."
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8080 2>/dev/null || true
    elif command -v open &> /dev/null; then
        open http://localhost:8080 2>/dev/null || true
    elif command -v start &> /dev/null; then
        start http://localhost:8080 2>/dev/null || true
    else
        print_warn "Nie udało się automatycznie otworzyć przeglądarki"
        print_status "Otwórz ręcznie: http://localhost:8080"
    fi
    
    echo ""
    echo "=" * 60
    print_header "🎉 GUI jest gotowe! Otwórz przeglądarkę i ciesz się używaniem!"
    echo "=" * 60
    echo ""
    
    # Czekaj na zakończenie procesu
    wait $GUI_PID
    
else
    print_error "❌ Nie udało się uruchomić GUI!"
    print_status "Sprawdź logi w pliku gui.log aby zobaczyć szczegóły błędu"
    print_status "Typowe problemy:"
    print_status "• Brak uprawnień do portu 8080"
    print_status "• Brak wymaganych pakietów Python"
    print_status "• Problem z konfiguracją sieci"
    echo ""
    print_status "Spróbuj uruchomić ponownie lub skontaktuj się z pomocą techniczną"
    exit 1
fi 