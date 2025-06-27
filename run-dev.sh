#!/bin/bash

# FoodSave AI - Development Environment Startup Script
# Skrypt do uruchamiania wszystkich kontenerów w trybie developerskim

set -e

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Sprawdzenie wymagań
check_requirements() {
    log_info "Sprawdzanie wymagań systemowych..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker nie jest zainstalowany"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose nie jest zainstalowany"
        exit 1
    fi
    
    # Sprawdzenie czy Docker daemon działa
    if ! docker info &> /dev/null; then
        log_error "Docker daemon nie działa. Uruchom: sudo systemctl start docker"
        exit 1
    fi
    
    log_success "Wymagania spełnione"
}

# Przygotowanie środowiska
prepare_environment() {
    log_info "Przygotowanie środowiska developerskiego..."
    
    # Kopiowanie pliku konfiguracyjnego jeśli nie istnieje
    if [ ! -f .env ]; then
        if [ -f env.dev ]; then
            cp env.dev .env
            log_success "Skopiowano konfigurację z env.dev"
        else
            log_warning "Brak pliku env.dev, używam domyślnej konfiguracji"
        fi
    fi
    
    # Tworzenie katalogów dla logów
    mkdir -p logs/{backend,frontend,postgres,redis,ollama,prometheus,grafana,loki}
    mkdir -p data/{vector_store_dev,search_cache,config}
    
    log_success "Środowisko przygotowane"
}

# Zatrzymanie istniejących kontenerów
stop_existing() {
    log_info "Zatrzymywanie istniejących kontenerów..."
    
    if docker compose -f docker-compose.dev.yaml ps --services --filter "status=running" | grep -q .; then
        docker compose -f docker-compose.dev.yaml down
        log_success "Istniejące kontenery zatrzymane"
    else
        log_info "Brak uruchomionych kontenerów"
    fi
}

# Budowanie kontenerów
build_containers() {
    log_info "Budowanie kontenerów..."
    
    # Budowanie z cache dla szybszego startu
    docker compose -f docker-compose.dev.yaml build --parallel
    
    log_success "Kontenery zbudowane"
}

# Uruchamianie serwisów
start_services() {
    log_info "Uruchamianie serwisów..."
    
    # Uruchamianie podstawowych serwisów
    docker compose -f docker-compose.dev.yaml up -d postgres redis ollama
    
    log_info "Oczekiwanie na inicjalizację bazy danych i Redis..."
    sleep 10
    
    # Sprawdzenie health check dla postgres i redis
    log_info "Sprawdzanie statusu serwisów..."
    
    # Czekanie na gotowość postgres
    until docker compose -f docker-compose.dev.yaml exec -T postgres pg_isready -U foodsave -d foodsave_dev; do
        log_info "Oczekiwanie na PostgreSQL..."
        sleep 5
    done
    
    # Czekanie na gotowość redis
    until docker compose -f docker-compose.dev.yaml exec -T redis redis-cli ping; do
        log_info "Oczekiwanie na Redis..."
        sleep 5
    done
    
    # Czekanie na gotowość ollama
    until curl -f http://localhost:11434/api/version &> /dev/null; do
        log_info "Oczekiwanie na Ollama..."
        sleep 10
    done
    
    log_success "Serwisy podstawowe gotowe"
    
    # Uruchamianie backendu
    log_info "Uruchamianie backendu..."
    docker compose -f docker-compose.dev.yaml up -d backend
    
    # Czekanie na gotowość backendu
    until curl -f http://localhost:8000/health &> /dev/null; do
        log_info "Oczekiwanie na backend..."
        sleep 5
    done
    
    log_success "Backend gotowy"
    
    # Uruchamianie frontendu
    log_info "Uruchamianie frontendu..."
    docker compose -f docker-compose.dev.yaml up -d frontend
    
    # Uruchamianie monitoring (opcjonalnie)
    if [ "$1" = "--with-monitoring" ]; then
        log_info "Uruchamianie monitoring..."
        docker compose -f docker-compose.dev.yaml up -d prometheus grafana loki promtail
    fi
    
    log_success "Wszystkie serwisy uruchomione"
}

# Sprawdzenie statusu
check_status() {
    log_info "Sprawdzanie statusu serwisów..."
    
    echo ""
    echo "=== STATUS KONTENERÓW ==="
    docker compose -f docker-compose.dev.yaml ps
    
    echo ""
    echo "=== ENDPOINTS ==="
    echo "Frontend:     http://localhost:3000"
    echo "Backend API:  http://localhost:8000"
    echo "API Docs:     http://localhost:8000/docs"
    echo "Ollama API:   http://localhost:11434"
    echo "PostgreSQL:   localhost:5433"
    echo "Redis:        localhost:6380"
    
    if docker compose -f docker-compose.dev.yaml ps | grep -q prometheus; then
        echo "Prometheus:   http://localhost:9090"
        echo "Grafana:      http://localhost:3001 (admin/admin)"
        echo "Loki:         http://localhost:3100"
    fi
    
    echo ""
    echo "=== LOGI ==="
    echo "Backend:      docker compose -f docker-compose.dev.yaml logs -f backend"
    echo "Frontend:     docker compose -f docker-compose.dev.yaml logs -f frontend"
    echo "PostgreSQL:   docker compose -f docker-compose.dev.yaml logs -f postgres"
    echo "Ollama:       docker compose -f docker-compose.dev.yaml logs -f ollama"
    echo "Redis:        docker compose -f docker-compose.dev.yaml logs -f redis"
}

# Funkcja pomocy
show_help() {
    echo "FoodSave AI - Development Environment"
    echo ""
    echo "Użycie: $0 [OPCJE]"
    echo ""
    echo "Opcje:"
    echo "  --with-monitoring    Uruchom z monitoringiem (Prometheus, Grafana, Loki)"
    echo "  --rebuild           Przebuduj wszystkie kontenery"
    echo "  --stop              Zatrzymaj wszystkie kontenery"
    echo "  --logs              Pokaż logi wszystkich serwisów"
    echo "  --status            Pokaż status serwisów"
    echo "  --help              Pokaż tę pomoc"
    echo ""
    echo "Przykłady:"
    echo "  $0                  Uruchom podstawowe serwisy"
    echo "  $0 --with-monitoring Uruchom z monitoringiem"
    echo "  $0 --rebuild        Przebuduj i uruchom"
}

# Główna logika
main() {
    case "${1:-}" in
        --help)
            show_help
            exit 0
            ;;
        --stop)
            log_info "Zatrzymywanie wszystkich kontenerów..."
            docker compose -f docker-compose.dev.yaml down
            log_success "Kontenery zatrzymane"
            exit 0
            ;;
        --logs)
            log_info "Pokazywanie logów wszystkich serwisów..."
            docker compose -f docker-compose.dev.yaml logs -f
            exit 0
            ;;
        --status)
            check_status
            exit 0
            ;;
        --rebuild)
            log_info "Przebudowywanie kontenerów..."
            docker compose -f docker-compose.dev.yaml down
            docker compose -f docker-compose.dev.yaml build --no-cache --parallel
            ;;
    esac
    
    log_info "🚀 Uruchamianie FoodSave AI w trybie developerskim..."
    
    check_requirements
    prepare_environment
    stop_existing
    build_containers
    start_services "$@"
    check_status
    
    log_success "✅ FoodSave AI jest gotowy do pracy!"
    log_info "💡 Użyj '$0 --help' aby zobaczyć dostępne opcje"
}

# Uruchomienie głównej funkcji
main "$@" 