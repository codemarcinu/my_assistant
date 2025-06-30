#!/bin/bash

# FoodSave AI GUI - Skrypt zatrzymywania
# Bezpieczne zatrzymanie GUI

set -e

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Funkcje wyświetlania komunikatów
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[UWAGA]${NC} $1"; }
print_error() { echo -e "${RED}[BŁĄD]${NC} $1"; }
print_header() { echo -e "${PURPLE}$1${NC}"; }

# Automatyczne przejście do katalogu skryptu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_header "🛑 Zatrzymywanie GUI FoodSave AI"
echo ""

# Sprawdź czy plik PID istnieje
if [ -f "gui.pid" ]; then
    GUI_PID=$(cat gui.pid)
    print_status "Znaleziono PID GUI: $GUI_PID"
    
    # Sprawdź czy proces nadal działa
    if ps -p $GUI_PID > /dev/null 2>&1; then
        print_status "Zatrzymuję proces GUI..."
        kill $GUI_PID
        
        # Poczekaj na zakończenie procesu
        sleep 2
        
        # Sprawdź czy proces został zatrzymany
        if ps -p $GUI_PID > /dev/null 2>&1; then
            print_warn "Proces nie zakończył się, wymuszam zatrzymanie..."
            kill -9 $GUI_PID
            sleep 1
        fi
        
        if ! ps -p $GUI_PID > /dev/null 2>&1; then
            print_success "✅ GUI zostało zatrzymane pomyślnie"
        else
            print_error "❌ Nie udało się zatrzymać GUI"
        fi
    else
        print_warn "Proces GUI już nie działa"
    fi
    
    # Usuń plik PID
    rm -f gui.pid
    print_success "Plik PID został usunięty"
else
    print_warn "Nie znaleziono pliku PID"
fi

# Sprawdź czy port 8080 jest nadal zajęty
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warn "Port 8080 jest nadal zajęty"
    print_status "Wymuszam zwolnienie portu..."
    
    # Znajdź i zatrzymaj wszystkie procesy na porcie 8080
    PIDS=$(lsof -ti:8080)
    if [ ! -z "$PIDS" ]; then
        echo $PIDS | xargs kill -9
        sleep 2
        print_success "Port 8080 został zwolniony"
    fi
else
    print_success "Port 8080 jest wolny"
fi

# Sprawdź czy są inne procesy Python związane z GUI
PYTHON_GUI_PIDS=$(ps aux | grep "python3.*server.py" | grep -v grep | awk '{print $2}')
if [ ! -z "$PYTHON_GUI_PIDS" ]; then
    print_warn "Znaleziono inne procesy GUI Python"
    print_status "Zatrzymuję wszystkie procesy GUI..."
    echo $PYTHON_GUI_PIDS | xargs kill -9
    print_success "Wszystkie procesy GUI zostały zatrzymane"
fi

echo ""
print_success "🎉 GUI FoodSave AI zostało całkowicie zatrzymane!"
echo ""
print_subheader "Podsumowanie:"
print_status "• Proces GUI został zatrzymany"
print_status "• Port 8080 został zwolniony"
print_status "• Plik PID został usunięty"
print_status "• Wszystkie powiązane procesy zostały zakończone"
echo ""
print_subheader "Aby uruchomić GUI ponownie:"
print_status "• Uruchom: ./start-gui.sh"
print_status "• Lub: python3 server.py"
echo "" 