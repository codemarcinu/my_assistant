#!/bin/bash

# FoodSave AI - Kompletny skrypt automatyzujący frontend + backend
# Intuicyjny, szybki, dla dewelopera i produkcji

set -e

# Automatyczne przejście do katalogu projektu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERR]${NC} $1"; }

BACKEND_PORT=8000
FRONTEND_PORT=3000
OLLAMA_PORT=11434
TAURI_APP="myappassistant-chat-frontend/src-tauri/target/release/bundle/appimage/FoodSave AI_1.0.0_amd64.AppImage"

start_backend() {
  print_status "Uruchamianie backendu..."
  docker compose -f docker-compose.dev.yaml up -d backend
  sleep 5
  if curl -s http://localhost:$BACKEND_PORT/monitoring/health > /dev/null; then
    print_success "Backend uruchomiony na porcie $BACKEND_PORT"
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
  else
    print_warn "Frontend może się jeszcze uruchamiać lub wystąpił błąd. Sprawdź frontend.log."
  fi
  cd ..
}

start_frontend_prod() {
  print_status "Budowanie i uruchamianie frontendu (tryb produkcyjny)..."
  cd myappassistant-chat-frontend
  npm run build
  npx serve out -p $FRONTEND_PORT &
  sleep 3
  print_success "Frontend produkcyjny uruchomiony na porcie $FRONTEND_PORT"
  cd ..
}

start_tauri() {
  print_status "Uruchamianie aplikacji Tauri..."
  if [ -f "$TAURI_APP" ]; then
    cd myappassistant-chat-frontend/src-tauri/target/release/bundle/appimage
    ./"FoodSave AI_1.0.0_amd64.AppImage" &
    print_success "Aplikacja Tauri uruchomiona"
    cd ../../../../..
  else
    print_error "Aplikacja Tauri nie została zbudowana. Uruchom: npm run tauri:build"
    return 1
  fi
}

check_ollama() {
  if curl -s http://localhost:$OLLAMA_PORT/api/tags > /dev/null; then
    print_success "Ollama działa na porcie $OLLAMA_PORT"
    return 0
  else
    print_warn "Ollama nie działa. Uruchom: ollama serve"
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
  else
    print_error "Budowanie aplikacji Tauri nie powiodło się!"
    print_status "Sprawdź logi w katalogu myappassistant-chat-frontend/"
    cd ..
    return 1
  fi
  
  cd ..
  return 0
}

stop_all() {
  print_status "Zatrzymywanie wszystkich usług..."
  docker compose -f docker-compose.dev.yaml down
  pkill -f "npm run dev" || true
  pkill -f "next dev" || true
  pkill -f "npx serve out" || true
  pkill -f "serve out" || true
  pkill -f "FoodSave AI" || true
  print_success "Wszystkie usługi zatrzymane"
}

show_status() {
  echo -e "\n${BLUE}=== STATUS SYSTEMU FOODSAVE AI ===${NC}"
  
  # Backend
  if curl -s http://localhost:$BACKEND_PORT/monitoring/health > /dev/null; then
    echo -e "${GREEN}✓ Backend: DZIAŁA (port $BACKEND_PORT)${NC}"
  else
    echo -e "${RED}✗ Backend: NIE DZIAŁA${NC}"
  fi
  
  # Frontend
  if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    echo -e "${GREEN}✓ Frontend: DZIAŁA (port $FRONTEND_PORT)${NC}"
  else
    echo -e "${RED}✗ Frontend: NIE DZIAŁA${NC}"
  fi
  
  # Ollama
  if curl -s http://localhost:$OLLAMA_PORT/api/tags > /dev/null; then
    echo -e "${GREEN}✓ Ollama: DZIAŁA (port $OLLAMA_PORT)${NC}"
  else
    echo -e "${RED}✗ Ollama: NIE DZIAŁA${NC}"
  fi
  
  # Tauri
  if pgrep -f "FoodSave AI" > /dev/null; then
    echo -e "${GREEN}✓ Tauri: DZIAŁA${NC}"
  else
    echo -e "${YELLOW}○ Tauri: NIE URUCHOMIONA${NC}"
  fi
  
  echo ""
}

show_logs() {
  print_status "Logi backendu (ostatnie 20 linii):"
  docker compose -f docker-compose.dev.yaml logs backend --tail=20
}

show_help() {
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
  echo ""
  echo "Przykłady:"
  echo "  food dev      # Uruchom tryb deweloperski"
  echo "  food build    # Zbuduj aplikację Tauri"
  echo "  food status   # Sprawdź status"
  echo "  food stop     # Zatrzymaj wszystko"
}

# Główna logika
case "${1:-help}" in
  dev)
    start_backend
    start_frontend_dev
    check_ollama
    show_status
    print_success "Tryb deweloperski uruchomiony!"
    print_status "Frontend: http://localhost:$FRONTEND_PORT"
    print_status "Backend: http://localhost:$BACKEND_PORT"
    ;;
  prod)
    start_backend
    start_frontend_prod
    check_ollama
    show_status
    print_success "Tryb produkcyjny uruchomiony!"
    ;;
  tauri)
    start_backend
    start_tauri
    check_ollama
    show_status
    print_success "Backend + Tauri uruchomione!"
    ;;
  build)
    build_tauri
    ;;
  stop)
    stop_all
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs
    ;;
  help|*)
    show_help
    ;;
esac 