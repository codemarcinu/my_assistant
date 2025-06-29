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

start_frontend_dev() {
  print_status "Uruchamianie frontendu (tryb deweloperski)..."
  cd myappassistant-chat-frontend
  npm run dev &
  sleep 3
  if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    print_success "Frontend uruchomiony na porcie $FRONTEND_PORT"
  else
    print_warn "Frontend może się jeszcze uruchamiać"
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
  echo "  stop    - Zatrzymaj wszystkie usługi"
  echo "  status  - Pokaż status systemu"
  echo "  logs    - Pokaż logi backendu"
  echo "  help    - Pokaż tę pomoc"
  echo ""
  echo "Przykłady:"
  echo "  food dev      # Uruchom tryb deweloperski"
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