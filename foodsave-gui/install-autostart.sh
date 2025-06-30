#!/bin/bash

# FoodSave AI GUI - Instalator automatycznego uruchamiania
# Konfiguruje systemd service dla automatycznego startu przy bootowaniu

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

print_header "🍽️ FoodSave AI GUI - Instalator Automatycznego Uruchamiania"
echo ""

# Sprawdź czy skrypt jest uruchamiany jako root
if [ "$EUID" -eq 0 ]; then
    print_error "Nie uruchamiaj tego skryptu jako root!"
    print_status "Uruchom bez sudo: ./install-autostart.sh"
    exit 1
fi

# Automatyczne przejście do katalogu skryptu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_subheader "Konfiguracja automatycznego uruchamiania..."
echo ""

# Sprawdź czy plik service istnieje
if [ ! -f "foodsave-gui.service" ]; then
    print_error "Plik foodsave-gui.service nie istnieje!"
    exit 1
fi

print_success "Znaleziono plik foodsave-gui.service"

# Pobierz nazwę użytkownika
CURRENT_USER=$(whoami)
print_status "Aktualny użytkownik: $CURRENT_USER"

# Sprawdź czy jesteśmy w środowisku wirtualnym
if [[ "$VIRTUAL_ENV" != "" ]]; then
    print_status "Wykryto środowisko wirtualne: $VIRTUAL_ENV"
    PYTHON_PATH="$VIRTUAL_ENV/bin/python3"
else
    PYTHON_PATH=$(which python3)
fi

print_status "Używam Pythona: $PYTHON_PATH"

# Aktualizuj plik service z właściwą ścieżką użytkownika
print_status "Aktualizuję plik service z właściwymi ścieżkami..."

# Pobierz pełną ścieżkę do katalogu projektu
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GUI_DIR="$PROJECT_DIR/foodsave-gui"

# Utwórz tymczasowy plik service z aktualnymi ścieżkami
TEMP_SERVICE="/tmp/foodsave-gui.service.tmp"
cat > "$TEMP_SERVICE" << EOF
[Unit]
Description=FoodSave AI GUI Server
Documentation=https://github.com/your-repo/foodsave-ai
After=network.target
Wants=network.target

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_USER
WorkingDirectory=$GUI_DIR
ExecStart=$PYTHON_PATH $GUI_DIR/server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=foodsave-gui
Environment=PYTHONUNBUFFERED=1

# Bezpieczeństwo
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_DIR

[Install]
WantedBy=multi-user.target
EOF

print_success "Utworzono tymczasowy plik service"

# Sprawdź czy systemd jest dostępny
if ! command -v systemctl &> /dev/null; then
    print_error "Systemd nie jest dostępny! Ten skrypt wymaga systemd."
    exit 1
fi

print_success "Systemd jest dostępny"

# Sprawdź czy Python jest dostępny
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 nie jest zainstalowany!"
    print_status "Zainstaluj Python 3: sudo apt install python3 python3-pip"
    exit 1
fi

print_success "Python 3 jest dostępny: $(python3 --version)"

# Sprawdź czy wymagane pakiety są zainstalowane
print_status "Sprawdzam wymagane pakiety Python..."

REQUIRED_PACKAGES=("flask" "flask_cors" "psutil" "requests")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if python3 -c "import $package" 2>/dev/null; then
        print_success "✅ $package jest zainstalowany"
    else
        print_warn "⚠️  $package nie jest zainstalowany"
        MISSING_PACKAGES+=("$package")
    fi
done

# Jeśli są brakujące pakiety, spróbuj je zainstalować
if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo ""
    print_status "Instaluję brakujące pakiety..."
    
    # Sprawdź czy jesteśmy w virtualenv
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        print_status "Instaluję w środowisku wirtualnym..."
        pip install "${MISSING_PACKAGES[@]}"
    else
        print_status "Instaluję dla użytkownika..."
        pip3 install "${MISSING_PACKAGES[@]}" --user
    fi
    
    # Sprawdź ponownie
    for package in "${MISSING_PACKAGES[@]}"; do
        if python3 -c "import $package" 2>/dev/null; then
            print_success "✅ $package został zainstalowany"
        else
            print_error "❌ Nie udało się zainstalować $package"
            exit 1
        fi
    done
fi

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

echo ""

# Zatrzymaj istniejący serwis jeśli jest uruchomiony
if systemctl --user is-active --quiet foodsave-gui.service 2>/dev/null; then
    print_status "Zatrzymuję istniejący serwis..."
    systemctl --user stop foodsave-gui.service
    print_success "Serwis został zatrzymany"
fi

# Wyłącz istniejący serwis jeśli jest włączony
if systemctl --user is-enabled --quiet foodsave-gui.service 2>/dev/null; then
    print_status "Wyłączam istniejący serwis..."
    systemctl --user disable foodsave-gui.service
    print_success "Serwis został wyłączony"
fi

# Skopiuj plik service do katalogu systemd
print_status "Kopiuję plik service do systemd..."
mkdir -p ~/.config/systemd/user/
cp "$TEMP_SERVICE" ~/.config/systemd/user/foodsave-gui.service
print_success "Plik service został skopiowany"

# Przeładuj systemd
print_status "Przeładowuję systemd..."
systemctl --user daemon-reload
print_success "Systemd został przeładowany"

# Włącz automatyczne uruchamianie
print_status "Włączam automatyczne uruchamianie..."
systemctl --user enable foodsave-gui.service
print_success "Automatyczne uruchamianie zostało włączone"

# Uruchom serwis
print_status "Uruchamiam serwis..."
systemctl --user start foodsave-gui.service
print_success "Serwis został uruchomiony"

# Sprawdź status
sleep 3
if systemctl --user is-active --quiet foodsave-gui.service; then
    print_success "✅ Serwis działa poprawnie!"
else
    print_error "❌ Serwis nie działa!"
    print_status "Sprawdź logi: journalctl --user -u foodsave-gui.service"
    exit 1
fi

# Wyczyść tymczasowy plik
rm -f "$TEMP_SERVICE"

echo ""
print_header "🎉 Instalacja zakończona pomyślnie!"
echo ""
print_subheader "Przydatne komendy:"
print_status "• Sprawdź status: systemctl --user status foodsave-gui.service"
print_status "• Zatrzymaj serwis: systemctl --user stop foodsave-gui.service"
print_status "• Uruchom serwis: systemctl --user start foodsave-gui.service"
print_status "• Wyłącz autostart: systemctl --user disable foodsave-gui.service"
print_status "• Włącz autostart: systemctl --user enable foodsave-gui.service"
print_status "• Zobacz logi: journalctl --user -u foodsave-gui.service -f"
echo ""
print_subheader "Informacje:"
print_status "🌐 GUI będzie dostępne pod adresem: http://localhost:8080"
print_status "🔄 Serwis będzie automatycznie uruchamiany przy starcie systemu"
print_status "🛡️ Serwis będzie automatycznie restartowany w przypadku awarii"
print_status "📝 Logi są zapisywane w systemd journal"
echo ""
print_success "FoodSave AI GUI jest teraz skonfigurowane do automatycznego uruchamiania!" 