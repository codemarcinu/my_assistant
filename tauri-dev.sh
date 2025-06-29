#!/bin/bash

# FoodSave AI - Tauri Development Environment
# Hybrydowe podejście: Backend w Docker, Frontend lokalnie

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Display banner
display_banner() {
  echo -e "${CYAN}==================================================${NC}"
  echo -e "${CYAN}  FoodSave AI - Tauri Development Environment${NC}"
  echo -e "${CYAN}==================================================${NC}"
}

# Check if Docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
  fi
}

# Check if Node.js is installed
check_node() {
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
  fi
}

# Start backend services
start_backend() {
  echo -e "${BLUE}Starting backend services in Docker...${NC}"
  
  # Create necessary directories
  mkdir -p logs/{backend,ollama,postgres,redis}
  mkdir -p data/{vector_store,backups}
  
  # Start only backend services
  docker compose -f docker-compose.dev.yaml up -d ollama postgres redis backend
  
  echo -e "${GREEN}Backend services started!${NC}"
  echo -e "  Backend API: ${CYAN}http://localhost:8000${NC}"
  echo -e "  Ollama: ${CYAN}http://localhost:11434${NC}"
  echo -e "  PostgreSQL: ${CYAN}localhost:5433${NC}"
}

# Setup frontend
setup_frontend() {
  echo -e "${BLUE}Setting up frontend...${NC}"
  
  cd myappassistant-chat-frontend
  
  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
  fi
  
  cd ..
}

# Start Tauri development
start_tauri_dev() {
  echo -e "${BLUE}Starting Tauri development...${NC}"
  
  cd myappassistant-chat-frontend
  
  # Start Tauri dev (this will also start Next.js dev server)
  echo -e "${GREEN}Starting Tauri development environment...${NC}"
  echo -e "  Frontend: ${CYAN}http://localhost:3000${NC}"
  echo -e "  Tauri App: Will open automatically${NC}"
  
  npm run tauri:dev
}

# Stop backend services
stop_backend() {
  echo -e "${BLUE}Stopping backend services...${NC}"
  docker compose -f docker-compose.dev.yaml down
  echo -e "${GREEN}Backend services stopped!${NC}"
}

# Show status
show_status() {
  display_banner
  
  echo -e "${BLUE}Backend Services Status:${NC}"
  docker compose -f docker-compose.dev.yaml ps
  
  echo -e "\n${BLUE}Frontend Status:${NC}"
  if pgrep -f "next dev" > /dev/null; then
    echo -e "${GREEN}✅ Next.js Dev Server: Running${NC}"
  else
    echo -e "${RED}❌ Next.js Dev Server: Not running${NC}"
  fi
  
  if pgrep -f "tauri" > /dev/null; then
    echo -e "${GREEN}✅ Tauri: Running${NC}"
  else
    echo -e "${RED}❌ Tauri: Not running${NC}"
  fi
}

# Main script logic
case "${1:-start}" in
  "start")
    display_banner
    check_docker
    check_node
    start_backend
    setup_frontend
    start_tauri_dev
    ;;
  "backend")
    display_banner
    check_docker
    start_backend
    ;;
  "frontend")
    display_banner
    check_node
    setup_frontend
    start_tauri_dev
    ;;
  "stop")
    stop_backend
    ;;
  "status")
    show_status
    ;;
  "build")
    display_banner
    check_node
    setup_frontend
    cd myappassistant-chat-frontend
    echo -e "${BLUE}Building Tauri application...${NC}"
    npm run tauri:build
    cd ..
    ;;
  *)
    echo -e "${CYAN}Usage: $0 [command]${NC}"
    echo -e ""
    echo -e "${BLUE}Commands:${NC}"
    echo -e "  start    - Start full development environment (default)"
    echo -e "  backend  - Start only backend services"
    echo -e "  frontend - Start only frontend development"
    echo -e "  stop     - Stop backend services"
    echo -e "  status   - Show status of all services"
    echo -e "  build    - Build Tauri application"
    ;;
esac 