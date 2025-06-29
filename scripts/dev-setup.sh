#!/bin/bash

# FoodSave AI - Development Setup Script
# Skrypt do łatwego zarządzania środowiskiem developerskim z hot-reload i pełnym logowaniem

set -e

# Kolory dla output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funkcje pomocnicze
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1"
}

# Sprawdzenie czy Docker jest zainstalowany
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker nie jest zainstalowany. Zainstaluj Docker przed uruchomieniem tego skryptu."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose nie jest zainstalowany. Zainstaluj Docker Compose przed uruchomieniem tego skryptu."
        exit 1
    fi

    log_success "Docker i Docker Compose są dostępne"
}

# Sprawdzenie czy plik .env istnieje
check_env_file() {
    if [ ! -f ".env" ]; then
        log_warning "Plik .env nie istnieje. Tworzę z szablonu..."
        if [ -f "env.dev.example" ]; then
            cp env.dev.example .env
            log_success "Utworzono .env z szablonu env.dev.example"
            log_info "Edytuj .env i dostosuj wartości do swojego środowiska"
        else
            log_error "Nie znaleziono env.dev.example. Utwórz plik .env ręcznie."
            exit 1
        fi
    else
        log_success "Plik .env istnieje"
    fi
}

# Tworzenie katalogów
create_directories() {
    log_step "Tworzenie katalogów dla aplikacji..."

    # Katalogi główne
    mkdir -p data/{models,vector_store,backups}
    mkdir -p logs/{backend,frontend,ollama,redis,postgres,nginx,grafana,prometheus,loki}
    mkdir -p backups/{config,database,files,vector_store}
    mkdir -p monitoring/{grafana/{dashboards,datasources},prometheus}
    mkdir -p tests/{unit,integration,e2e,fixtures}

    # Ustawienie uprawnień
    chmod 755 data logs backups monitoring tests
    chmod 777 logs/*

    log_success "Katalogi utworzone"
}

# Sprawdzenie GPU support
check_gpu_support() {
    if command -v nvidia-smi &> /dev/null; then
        log_success "NVIDIA GPU wykryty - Ollama będzie używać GPU"
        export NVIDIA_VISIBLE_DEVICES=all
    else
        log_warning "NVIDIA GPU nie wykryty - Ollama będzie używać CPU"
    fi
}

# Funkcja do uruchamiania aplikacji w trybie development
start_dev() {
    log_step "Uruchamianie aplikacji w trybie development z hot-reload..."

    # Budowanie obrazów z cache
    log_info "Budowanie obrazów..."
    docker-compose -f docker-compose.dev.yaml build --no-cache

    # Uruchomienie serwisów
    log_info "Uruchamianie serwisów..."
    docker-compose -f docker-compose.dev.yaml up -d

    log_success "Aplikacja uruchomiona w trybie development"

    # Wyświetlenie statusu
    show_status
}

# Funkcja do zatrzymywania aplikacji
stop_dev() {
    log_step "Zatrzymywanie aplikacji..."
    docker-compose -f docker-compose.dev.yaml down
    log_success "Aplikacja zatrzymana"
}

# Funkcja do restartowania aplikacji
restart_dev() {
    log_step "Restartowanie aplikacji..."
    stop_dev
    start_dev
}

# Funkcja do wyświetlania logów
show_logs() {
    local service=${1:-backend}
    local lines=${2:-50}

    log_info "Wyświetlanie ostatnich $lines linii logów dla serwisu: $service"

    case $service in
        backend|frontend|ollama|redis|postgres|prometheus|grafana|loki|promtail|nginx)
            docker-compose -f docker-compose.dev.yaml logs --tail=$lines -f "$service"
            ;;
        all)
            docker-compose -f docker-compose.dev.yaml logs --tail=$lines -f
            ;;
        *)
            log_error "Nieznany serwis: $service"
            log_info "Dostępne serwisy: backend, frontend, ollama, redis, postgres, prometheus, grafana, loki, promtail, nginx, all"
            ;;
    esac
}

# Funkcja do sprawdzania statusu
show_status() {
    log_step "Sprawdzanie statusu aplikacji..."

    echo ""
    log_info "Status kontenerów:"
    docker-compose -f docker-compose.dev.yaml ps

    echo ""
    log_info "Health checks:"

    # Sprawdzenie health endpoints
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Backend (FastAPI): OK - http://localhost:8000"
    else
        log_error "Backend (FastAPI): FAILED"
    fi

    if curl -s http://localhost:5173/ > /dev/null 2>&1; then
        log_success "Frontend (React/Vite): OK - http://localhost:5173"
    else
        log_error "Frontend (React/Vite): FAILED"
    fi

    if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
        log_success "Ollama (LLM): OK - http://localhost:11434"
    else
        log_error "Ollama (LLM): FAILED"
    fi

    if curl -s http://localhost:6379 > /dev/null 2>&1; then
        log_success "Redis: OK - localhost:6379"
    else
        log_error "Redis: FAILED"
    fi

    if curl -s http://localhost:5433 > /dev/null 2>&1; then
        log_success "PostgreSQL: OK - localhost:5433"
    else
        log_error "PostgreSQL: FAILED"
    fi

    if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log_success "Prometheus: OK - http://localhost:9090"
    else
        log_error "Prometheus: FAILED"
    fi

    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "Grafana: OK - http://localhost:3001 (admin/admin)"
    else
        log_error "Grafana: FAILED"
    fi

    if curl -s http://localhost:3100/ready > /dev/null 2>&1; then
        log_success "Loki: OK - http://localhost:3100"
    else
        log_error "Loki: FAILED"
    fi

    echo ""
    log_info "Dostępne endpointy:"
    echo "  🌐 Frontend:     http://localhost:5173"
    echo "  🔧 Backend API:  http://localhost:8000"
    echo "  📊 API Docs:     http://localhost:8000/docs"
    echo "  🤖 Ollama:       http://localhost:11434"
    echo "  📈 Prometheus:   http://localhost:9090"
    echo "  📊 Grafana:      http://localhost:3001 (admin/admin)"
    echo "  📝 Loki:         http://localhost:3100"
    echo "  🗄️  Redis:        localhost:6379"
    echo "  🐘 PostgreSQL:   localhost:5433"
    echo "  🌐 Nginx:        http://localhost:80"

    echo ""
    log_info "Logi aplikacji:"
    echo "  📝 Backend:      ./logs/backend/"
    echo "  📝 Frontend:     ./logs/frontend/"
    echo "  📝 Ollama:       ./logs/ollama/"
    echo "  📝 PostgreSQL:   ./logs/postgres/"
    echo "  📝 Redis:        ./logs/redis/"
    echo "  📝 Grafana:      ./logs/grafana/"
    echo "  📝 Prometheus:   ./logs/prometheus/"
    echo "  📝 Loki:         ./logs/loki/"
}

# Funkcja do czyszczenia
cleanup() {
    log_step "Czyszczenie środowiska..."

    # Zatrzymanie kontenerów
    docker-compose -f docker-compose.dev.yaml down

    # Usunięcie wolumenów (opcjonalne)
    read -p "Czy chcesz usunąć wszystkie dane (wolumeny)? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Usuwanie wolumenów..."
        docker volume rm $(docker volume ls -q | grep foodsave) 2>/dev/null || true
        log_success "Wolumeny usunięte"
    fi

    # Usunięcie obrazów (opcjonalne)
    read -p "Czy chcesz usunąć obrazy Docker? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Usuwanie obrazów..."
        docker rmi $(docker images -q | grep foodsave) 2>/dev/null || true
        log_success "Obrazy usunięte"
    fi

    log_success "Czyszczenie zakończone"
}

# Funkcja do instalacji modeli Ollama
install_models() {
    log_step "Instalacja modeli Ollama..."

    local models=("SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0" "SpeakLeash/bielik-11b-v2.3-instruct:Q5_K_M" "nomic-embed-text")
    
    for model in "${models[@]}"; do
        log_info "Instalacja modelu: $model"
        curl -X POST http://localhost:11434/api/pull -d "{\"name\": \"$model\"}" &
    done

    wait
    log_success "Modele zainstalowane"
}

# Funkcja do uruchamiania testów
run_tests() {
    log_step "Uruchamianie testów..."

    # Testy jednostkowe
    log_info "Uruchamianie testów jednostkowych..."
    docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest tests/unit/ -v

    # Testy integracyjne
    log_info "Uruchamianie testów integracyjnych..."
    docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest tests/integration/ -v

    log_success "Testy zakończone"
}

# Funkcja do wyświetlania pomocy
show_help() {
    echo "FoodSave AI - Development Setup Script"
    echo ""
    echo "Użycie: $0 [OPCJA]"
    echo ""
    echo "Opcje:"
    echo "  start       - Uruchom aplikację w trybie development"
    echo "  stop        - Zatrzymaj aplikację"
    echo "  restart     - Restartuj aplikację"
    echo "  status      - Pokaż status aplikacji"
    echo "  logs [serwis] - Pokaż logi (domyślnie: backend)"
    echo "  cleanup     - Wyczyść środowisko"
    echo "  models      - Zainstaluj modele Ollama"
    echo "  test        - Uruchom testy"
    echo "  setup       - Konfiguracja początkowa"
    echo "  help        - Pokaż tę pomoc"
    echo ""
    echo "Przykłady:"
    echo "  $0 setup     # Konfiguracja początkowa"
    echo "  $0 start     # Uruchom aplikację"
    echo "  $0 logs all  # Pokaż wszystkie logi"
    echo "  $0 logs ollama # Pokaż logi Ollama"
}

# Główna logika
main() {
    case "${1:-help}" in
        start)
            check_docker
            check_env_file
            check_gpu_support
            start_dev
            ;;
        stop)
            stop_dev
            ;;
        restart)
            restart_dev
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2" "$3"
            ;;
        cleanup)
            cleanup
            ;;
        models)
            install_models
            ;;
        test)
            run_tests
            ;;
        setup)
            check_docker
            check_env_file
            create_directories
            check_gpu_support
            log_success "Konfiguracja początkowa zakończona"
            log_info "Uruchom '$0 start' aby uruchomić aplikację"
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Uruchomienie głównej funkcji
main "$@"
