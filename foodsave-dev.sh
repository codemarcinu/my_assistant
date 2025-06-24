#!/bin/bash

# FoodSave AI - Development Environment Management Script
# Skrypt do zarządzania środowiskiem development w kontenerach Docker

set -e  # Exit immediately if a command exits with a non-zero status

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Display banner
display_banner() {
  echo -e "${CYAN}==================================================${NC}"
  echo -e "${CYAN}  FoodSave AI - Development Environment${NC}"
  echo -e "${CYAN}==================================================${NC}"
}

# Check if Docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
  fi
}

# Check if Docker Compose is available
check_docker_compose() {
  if ! docker compose version > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker Compose is not available. Please install Docker Compose V2.${NC}"
    exit 1
  fi
}

# Create necessary directories
create_directories() {
  echo -e "${BLUE}Creating log directories...${NC}"
  mkdir -p logs/{backend,frontend,ollama,postgres,redis,prometheus,grafana,loki,nginx}
  mkdir -p data/{vector_store,backups}
  mkdir -p monitoring/{grafana/{datasources,dashboards},logs}
  
  # Set proper permissions
  chmod 755 logs data monitoring
}

# Setup environment file
setup_env() {
  if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from env.dev.example...${NC}"
    cp env.dev.example .env
    echo -e "${GREEN}Please review and update the .env file with your configuration.${NC}"
  else
    echo -e "${GREEN}Environment file .env already exists.${NC}"
  fi
}

# Start the development environment
start_dev() {
  display_banner
  check_docker
  check_docker_compose
  create_directories
  setup_env

  # Check for existing containers and remove them
  echo -e "${BLUE}Checking for existing containers...${NC}"
  CONTAINERS=("foodsave-backend-dev" "foodsave-frontend-dev" "foodsave-ollama-dev" 
              "foodsave-postgres-dev" "foodsave-redis-dev" "foodsave-prometheus-dev" 
              "foodsave-grafana-dev" "foodsave-loki-dev" "foodsave-promtail-dev")

  for container in "${CONTAINERS[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
      echo -e "${YELLOW}Removing existing container: ${container}${NC}"
      docker rm -f "${container}" > /dev/null 2>&1 || true
    fi
  done

  # Stop any existing Docker Compose services
  echo -e "${BLUE}Stopping any existing Docker Compose services...${NC}"
  docker compose -f docker-compose.dev.yaml down --remove-orphans

  # Pull latest images
  echo -e "${BLUE}Pulling latest Docker images...${NC}"
  docker compose -f docker-compose.dev.yaml pull

  # Build and start containers
  echo -e "${BLUE}Building and starting development containers...${NC}"
  
  if [ "$1" == "minimal" ]; then
    # Start only core services
    docker compose -f docker-compose.dev.yaml up --build -d ollama postgres redis backend frontend
    echo -e "${GREEN}Started with minimal services (Ollama, PostgreSQL, Redis, Backend, Frontend)${NC}"
  elif [ "$1" == "monitoring" ]; then
    # Start with monitoring
    docker compose -f docker-compose.dev.yaml up --build -d
    echo -e "${GREEN}Started with all services including monitoring${NC}"
  elif [ "$1" == "proxy" ]; then
    # Start with nginx proxy
    docker compose -f docker-compose.dev.yaml --profile with-proxy up --build -d
    echo -e "${GREEN}Started with all services including nginx proxy${NC}"
  else
    # Start all services
    docker compose -f docker-compose.dev.yaml up --build -d
    echo -e "${GREEN}Started with all development services${NC}"
  fi

  # Wait for services to be ready
  echo -e "${BLUE}Waiting for services to be ready...${NC}"
  sleep 10

  # Display status
  show_dev_status
}

# Stop the development environment
stop_dev() {
  display_banner
  check_docker

  echo -e "${BLUE}Stopping development containers...${NC}"
  docker compose -f docker-compose.dev.yaml down --remove-orphans

  # Check for any remaining containers
  CONTAINERS=("foodsave-backend-dev" "foodsave-frontend-dev" "foodsave-ollama-dev" 
              "foodsave-postgres-dev" "foodsave-redis-dev" "foodsave-prometheus-dev" 
              "foodsave-grafana-dev" "foodsave-loki-dev" "foodsave-promtail-dev")

  for container in "${CONTAINERS[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
      echo -e "${YELLOW}Removing remaining container: ${container}${NC}"
      docker rm -f "${container}" > /dev/null 2>&1 || true
    fi
  done

  echo -e "${GREEN}==================================================${NC}"
  echo -e "${GREEN}  Development environment stopped successfully${NC}"
  echo -e "${GREEN}==================================================${NC}"
}

# Show status of the development environment
show_dev_status() {
  display_banner
  check_docker

  # Show running containers
  echo -e "${BLUE}Running development containers:${NC}"
  docker compose -f docker-compose.dev.yaml ps

  # Check service health
  echo -e "\n${BLUE}Service health status:${NC}"

  # Check backend
  if docker ps --filter "name=foodsave-backend-dev" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}✅ Backend: Running${NC}"
    echo -e "   API URL: ${CYAN}http://localhost:8000${NC}"
    echo -e "   API Docs: ${CYAN}http://localhost:8000/docs${NC}"
  else
    echo -e "${RED}❌ Backend: Not running${NC}"
  fi

  # Check frontend
  if docker ps --filter "name=foodsave-frontend-dev" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}✅ Frontend: Running${NC}"
    echo -e "   URL: ${CYAN}http://localhost:5173${NC}"
  else
    echo -e "${RED}❌ Frontend: Not running${NC}"
  fi

  # Check Ollama
  if docker ps --filter "name=foodsave-ollama-dev" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}✅ Ollama: Running${NC}"
    echo -e "   URL: ${CYAN}http://localhost:11434${NC}"
  else
    echo -e "${RED}❌ Ollama: Not running${NC}"
  fi

  # Check PostgreSQL
  if docker ps --filter "name=foodsave-postgres-dev" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}✅ PostgreSQL: Running${NC}"
    echo -e "   Port: ${CYAN}5433${NC}"
  else
    echo -e "${RED}❌ PostgreSQL: Not running${NC}"
  fi

  # Check Redis
  if docker ps --filter "name=foodsave-redis-dev" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}✅ Redis: Running${NC}"
    echo -e "   Port: ${CYAN}6379${NC}"
  else
    echo -e "${RED}❌ Redis: Not running${NC}"
  fi

  # Check Prometheus
  if docker ps --filter "name=foodsave-prometheus-dev" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}✅ Prometheus: Running${NC}"
    echo -e "   URL: ${CYAN}http://localhost:9090${NC}"
  else
    echo -e "${RED}❌ Prometheus: Not running${NC}"
  fi

  # Check Grafana
  if docker ps --filter "name=foodsave-grafana-dev" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}✅ Grafana: Running${NC}"
    echo -e "   URL: ${CYAN}http://localhost:3001${NC}"
    echo -e "   Login: ${CYAN}admin/admin${NC}"
  else
    echo -e "${RED}❌ Grafana: Not running${NC}"
  fi

  # Check Loki
  if docker ps --filter "name=foodsave-loki-dev" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}✅ Loki: Running${NC}"
    echo -e "   URL: ${CYAN}http://localhost:3100${NC}"
  else
    echo -e "${RED}❌ Loki: Not running${NC}"
  fi

  echo -e "\n${BLUE}Development URLs:${NC}"
  echo -e "${CYAN}Frontend:${NC} http://localhost:5173"
  echo -e "${CYAN}Backend API:${NC} http://localhost:8000"
  echo -e "${CYAN}API Docs:${NC} http://localhost:8000/docs"
  echo -e "${CYAN}Ollama:${NC} http://localhost:11434"
  echo -e "${CYAN}PostgreSQL:${NC} localhost:5433"
  echo -e "${CYAN}Redis:${NC} localhost:6379"
  echo -e "${CYAN}Prometheus:${NC} http://localhost:9090"
  echo -e "${CYAN}Grafana:${NC} http://localhost:3001"
  echo -e "${CYAN}Loki:${NC} http://localhost:3100"

  echo -e "\n${BLUE}Useful commands:${NC}"
  echo -e "  ${CYAN}View logs:${NC} ./foodsave-dev.sh logs"
  echo -e "  ${CYAN}Restart:${NC} ./foodsave-dev.sh restart"
  echo -e "  ${CYAN}Stop:${NC} ./foodsave-dev.sh stop"
  echo -e "  ${CYAN}Clean:${NC} ./foodsave-dev.sh clean"
  echo -e "${CYAN}==================================================${NC}"
}

# Show logs
show_logs() {
  display_banner
  check_docker

  if [ -z "$1" ]; then
    echo -e "${BLUE}Showing logs for all development services...${NC}"
    docker compose -f docker-compose.dev.yaml logs -f
  else
    echo -e "${BLUE}Showing logs for $1...${NC}"
    docker compose -f docker-compose.dev.yaml logs -f "$1"
  fi
}

# Restart services
restart_dev() {
  display_banner
  echo -e "${BLUE}Restarting development environment...${NC}"
  stop_dev
  sleep 2
  start_dev "$1"
}

# Clean up everything
clean_dev() {
  display_banner
  check_docker

  echo -e "${YELLOW}This will remove all containers, volumes, and images. Are you sure? (y/N)${NC}"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${BLUE}Cleaning up development environment...${NC}"
    
    # Stop and remove containers
    docker compose -f docker-compose.dev.yaml down --volumes --remove-orphans
    
    # Remove all related containers
    docker ps -a --filter "name=foodsave-" --format "{{.ID}}" | xargs -r docker rm -f
    
    # Remove all related volumes
    docker volume ls --filter "name=foodsave-" --format "{{.Name}}" | xargs -r docker volume rm
    
    # Remove all related networks
    docker network ls --filter "name=foodsave-" --format "{{.Name}}" | xargs -r docker network rm
    
    # Clean up logs directory
    rm -rf logs/*
    
    echo -e "${GREEN}Development environment cleaned successfully!${NC}"
  else
    echo -e "${YELLOW}Cleanup cancelled.${NC}"
  fi
}

# Build specific service
build_service() {
  display_banner
  check_docker

  if [ -z "$1" ]; then
    echo -e "${RED}Please specify a service to build.${NC}"
    echo -e "${BLUE}Available services: backend, frontend, ollama${NC}"
    exit 1
  fi

  echo -e "${BLUE}Building service: $1${NC}"
  docker compose -f docker-compose.dev.yaml build "$1"
  echo -e "${GREEN}Service $1 built successfully!${NC}"
}

# Show help
show_help() {
  display_banner
  echo -e "${BLUE}Usage: ./foodsave-dev.sh [command] [options]${NC}"
  echo ""
  echo -e "${BLUE}Commands:${NC}"
  echo -e "  ${CYAN}start [option]${NC}    Start the development environment"
  echo -e "                    Options: minimal, monitoring, proxy (default: all services)"
  echo -e "  ${CYAN}stop${NC}              Stop the development environment"
  echo -e "  ${CYAN}restart [option]${NC}  Restart the development environment"
  echo -e "  ${CYAN}status${NC}            Show status of the development environment"
  echo -e "  ${CYAN}logs [service]${NC}    Show logs (all services or specific service)"
  echo -e "  ${CYAN}build [service]${NC}   Build specific service"
  echo -e "  ${CYAN}clean${NC}             Clean up everything (containers, volumes, images)"
  echo -e "  ${CYAN}help${NC}              Show this help message"
  echo ""
  echo -e "${BLUE}Examples:${NC}"
  echo -e "  ${CYAN}./foodsave-dev.sh start${NC}           # Start all services"
  echo -e "  ${CYAN}./foodsave-dev.sh start minimal${NC}   # Start core services only"
  echo -e "  ${CYAN}./foodsave-dev.sh start monitoring${NC} # Start with monitoring"
  echo -e "  ${CYAN}./foodsave-dev.sh stop${NC}            # Stop all services"
  echo -e "  ${CYAN}./foodsave-dev.sh status${NC}          # Show status"
  echo -e "  ${CYAN}./foodsave-dev.sh logs${NC}            # Show all logs"
  echo -e "  ${CYAN}./foodsave-dev.sh logs backend${NC}    # Show backend logs only"
  echo -e "  ${CYAN}./foodsave-dev.sh build frontend${NC}  # Build frontend service"
  echo -e "  ${CYAN}./foodsave-dev.sh clean${NC}           # Clean everything"
  echo -e "${CYAN}==================================================${NC}"
}

# Main script logic
case "$1" in
  start)
    start_dev "$2"
    ;;
  stop)
    stop_dev
    ;;
  restart)
    restart_dev "$2"
    ;;
  status)
    show_dev_status
    ;;
  logs)
    show_logs "$2"
    ;;
  build)
    build_service "$2"
    ;;
  clean)
    clean_dev
    ;;
  help)
    show_help
    ;;
  *)
    show_help
    ;;
esac 