#!/bin/bash

# FoodSave AI GUI - Odinstalator automatycznego uruchamiania
# Usuwa systemd service i wyłącza automatyczne uruchamianie

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

print_header "🍽️ FoodSave AI GUI - Odinstalator Automatycznego Uruchamiania"
echo ""

# Sprawdź czy skrypt jest uruchamiany jako root
if [ "$EUID" -eq 0 ]; then
    print_error "Nie uruchamiaj tego skryptu jako root!"
    print_status "Uruchom bez sudo: ./uninstall-autostart.sh"
    exit 1
fi

print_subheader "Odinstalowanie automatycznego uruchamiania..."
echo ""

# Sprawdź czy systemd jest dostępny
if ! command -v systemctl &> /dev/null; then
    print_error "Systemd nie jest dostępny!"
    exit 1
fi

# Zatrzymaj serwis jeśli jest uruchomiony
if systemctl --user is-active --quiet foodsave-gui.service 2>/dev/null; then
    print_status "Zatrzymuję serwis..."
    systemctl --user stop foodsave-gui.service
    print_success "Serwis został zatrzymany"
else
    print_status "Serwis nie był uruchomiony"
fi

# Wyłącz automatyczne uruchamianie
if systemctl --user is-enabled --quiet foodsave-gui.service 2>/dev/null; then
    print_status "Wyłączam automatyczne uruchamianie..."
    systemctl --user disable foodsave-gui.service
    print_success "Automatyczne uruchamianie zostało wyłączone"
else
    print_status "Automatyczne uruchamianie nie było włączone"
fi

# Usuń plik service
if [ -f ~/.config/systemd/user/foodsave-gui.service ]; then
    print_status "Usuwam plik service..."
    rm ~/.config/systemd/user/foodsave-gui.service
    print_success "Plik service został usunięty"
else
    print_status "Plik service nie istnieje"
fi

# Przeładuj systemd
print_status "Przeładowuję systemd..."
systemctl --user daemon-reload
print_success "Systemd został przeładowany"

# Usuń plik PID jeśli istnieje
if [ -f "gui.pid" ]; then
    print_status "Usuwam plik PID..."
    rm -f gui.pid
    print_success "Plik PID został usunięty"
fi

echo ""
print_header "🎉 Odinstalowanie zakończone pomyślnie!"
echo ""
print_subheader "Co zostało zrobione:"
print_status "✅ Serwis został zatrzymany"
print_status "✅ Automatyczne uruchamianie zostało wyłączone"
print_status "✅ Plik service został usunięty"
print_status "✅ Systemd został przeładowany"
echo ""
print_subheader "Teraz możesz:"
print_status "• Uruchamiać GUI ręcznie: ./start-gui.sh"
print_status "• Zatrzymywać GUI ręcznie: ./stop-gui.sh"
print_status "• Ponownie zainstalować autostart: ./install-autostart.sh"
echo ""
print_success "FoodSave AI GUI nie będzie już uruchamiane automatycznie przy starcie systemu!" 