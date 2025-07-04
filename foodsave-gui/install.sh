#!/bin/bash

# FoodSave AI GUI - Instalator dla użytkowników nietechnicznych
# Automatyczna instalacja i konfiguracja systemu

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

print_header "🍽️ FoodSave AI - Instalator GUI"
echo ""
print_subheader "Witamy w automatycznym instalatorze!"
echo "Ten instalator skonfiguruje FoodSave AI GUI w kilku prostych krokach."
echo ""

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -f "start-gui.sh" ]; then
    print_error "Nie jesteś w katalogu foodsave-gui!"
    print_status "Przejdź do katalogu foodsave-gui i uruchom ponownie."
    exit 1
fi

# Sprawdź czy główny skrypt istnieje
if [ ! -f "../foodsave-all.sh" ]; then
    print_error "Nie znaleziono głównego skryptu foodsave-all.sh!"
    print_status "Upewnij się, że jesteś w odpowiednim katalogu projektu."
    print_status "Struktura powinna wyglądać tak:"
    echo "  📁 AIASISSTMARUBO/"
    echo "    📁 foodsave-gui/"
    echo "    📄 foodsave-all.sh"
    exit 1
fi

print_success "Znaleziono główny skrypt foodsave-all.sh"

echo ""
print_header "🔧 Krok 1: Sprawdzanie wymagań systemowych"
echo ""

# Sprawdź system operacyjny
OS=$(uname -s)
if [[ "$OS" == "Linux" ]]; then
    print_success "System operacyjny: Linux"
elif [[ "$OS" == "Darwin" ]]; then
    print_success "System operacyjny: macOS"
else
    print_warn "System operacyjny: $OS (może wymagać dodatkowej konfiguracji)"
fi

# Sprawdź architekturę
ARCH=$(uname -m)
print_success "Architektura: $ARCH"

# Sprawdź czy Python jest zainstalowany
if ! command -v python3 &> /dev/null; then
    print_warn "Python 3 nie jest zainstalowany"
    print_status "Instaluję Python 3 automatycznie..."
    
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install -y python3 python3-pip python3-venv
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3 python3-pip
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y python3 python3-pip
    elif command -v brew &> /dev/null; then
        brew install python3
    else
        print_error "Nie udało się automatycznie zainstalować Python 3"
        print_status "Zainstaluj Python 3 ręcznie i uruchom ponownie"
        exit 1
    fi
else
    print_success "Python 3 jest zainstalowany: $(python3 --version)"
fi

# Sprawdź czy pip jest dostępny
if ! command -v pip3 &> /dev/null; then
    print_warn "pip3 nie jest dostępny"
    print_status "Instaluję pip3..."
    
    if command -v apt &> /dev/null; then
        sudo apt install -y python3-pip
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3-pip
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y python3-pip
    fi
fi

echo ""
print_header "📦 Krok 2: Instalacja wymaganych pakietów Python"
echo ""

# Definicja pakietów
PACKAGES=(
    "flask"
    "flask-cors"
    "psutil"
    "requests"
)

for package in "${PACKAGES[@]}"; do
    print_status "Sprawdzam $package..."
    
    if python3 -c "import ${package//-/_}" 2>/dev/null; then
        print_success "✅ $package jest już zainstalowany"
    else
        print_status "Instaluję $package..."
        
        # Próbuj instalację użytkownika
        if pip3 install "$package" --user --quiet; then
            print_success "✅ $package został zainstalowany"
        else
            print_warn "Instalacja użytkownika nie powiodła się, próbuję z uprawnieniami administratora..."
            
            if sudo pip3 install "$package" --quiet; then
                print_success "✅ $package został zainstalowany (z uprawnieniami administratora)"
            else
                print_error "❌ Nie udało się zainstalować $package"
                exit 1
            fi
        fi
    fi
done

echo ""
print_header "🔐 Krok 3: Konfiguracja uprawnień"
echo ""

# Nadaj uprawnienia do skryptów
print_status "Konfiguruję uprawnienia do skryptów..."

chmod +x start-gui.sh 2>/dev/null || true
chmod +x stop-gui.sh 2>/dev/null || true
chmod +x install-autostart.sh 2>/dev/null || true
chmod +x uninstall-autostart.sh 2>/dev/null || true

# Sprawdź uprawnienia do głównego skryptu
if [ ! -x "../foodsave-all.sh" ]; then
    print_status "Nadaję uprawnienia do głównego skryptu..."
    chmod +x "../foodsave-all.sh"
fi

print_success "✅ Uprawnienia zostały skonfigurowane"

echo ""
print_header "🌐 Krok 4: Sprawdzanie portów"
echo ""

# Sprawdź czy port 8080 jest wolny
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warn "Port 8080 jest zajęty"
    print_status "Zatrzymuję proces na porcie 8080..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    sleep 2
    print_success "✅ Port 8080 został zwolniony"
else
    print_success "✅ Port 8080 jest wolny"
fi

echo ""
print_header "🎯 Krok 5: Konfiguracja autostartu (opcjonalnie)"
echo ""

read -p "Czy chcesz skonfigurować automatyczne uruchamianie GUI przy starcie systemu? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Konfiguruję autostart..."
    
    if [ -f "install-autostart.sh" ]; then
        chmod +x install-autostart.sh
        ./install-autostart.sh
        print_success "✅ Autostart został skonfigurowany"
    else
        print_warn "Skrypt autostartu nie został znaleziony"
    fi
else
    print_status "Autostart nie został skonfigurowany"
    print_status "Możesz go włączyć później uruchamiając: ./install-autostart.sh"
fi

echo ""
print_header "🧪 Krok 6: Test instalacji"
echo ""

print_status "Testuję instalację..."

# Sprawdź czy wszystkie pliki są na miejscu
REQUIRED_FILES=("index.html" "style.css" "script.js" "server.py" "start-gui.sh" "stop-gui.sh")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✅ $file"
    else
        print_error "❌ Brakuje pliku: $file"
        exit 1
    fi
done

# Test uruchomienia serwera
print_status "Testuję uruchomienie serwera..."
python3 server.py > /dev/null 2>&1 &
TEST_PID=$!
sleep 3

if curl -s http://localhost:8080/health > /dev/null; then
    print_success "✅ Serwer działa poprawnie"
    kill $TEST_PID 2>/dev/null || true
else
    print_error "❌ Serwer nie odpowiada"
    kill $TEST_PID 2>/dev/null || true
    exit 1
fi

echo ""
print_header "🎉 Instalacja zakończona pomyślnie!"
echo ""

print_subheader "📋 Co zostało zainstalowane:"
print_status "✅ Python 3 i wymagane pakiety"
print_status "✅ Uprawnienia do skryptów"
print_status "✅ Konfiguracja portów"
print_status "✅ Test serwera GUI"

echo ""
print_subheader "🚀 Jak uruchomić GUI:"
print_status "1. W katalogu foodsave-gui uruchom: ./start-gui.sh"
print_status "2. Otwórz przeglądarkę: http://localhost:8080"
print_status "3. Postępuj zgodnie z instrukcjami w GUI"

echo ""
print_subheader "🛑 Jak zatrzymać GUI:"
print_status "• Uruchom: ./stop-gui.sh"
print_status "• Lub naciśnij Ctrl+C w terminalu"

echo ""
print_subheader "🆘 Gdzie szukać pomocy:"
print_status "• Dokumentacja: README.md"
print_status "• Logi: gui.log"
print_status "• Diagnostyka: w GUI kliknij 'Diagnostyka'"

echo ""
print_subheader "🎯 Następne kroki:"
print_status "1. Uruchom GUI: ./start-gui.sh"
print_status "2. Otwórz przeglądarkę"
print_status "3. Skorzystaj z kreatora pierwszego uruchomienia"
print_status "4. Ciesz się używaniem FoodSave AI!"

echo ""
echo "=" * 60
print_header "🎉 Instalacja zakończona! Możesz teraz uruchomić GUI!"
echo "=" * 60
echo ""

# Pytanie o uruchomienie GUI
read -p "Czy chcesz uruchomić GUI teraz? (Y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    print_header "🚀 Uruchamiam GUI FoodSave AI..."
    echo ""
    ./start-gui.sh
else
    echo ""
    print_status "GUI nie zostało uruchomione."
    print_status "Uruchom je później komendą: ./start-gui.sh"
fi 