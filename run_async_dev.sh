#!/bin/bash

# FoodSave AI - Asynchronous Development Environment
# Uruchamia system z Celery worker dla asynchronicznego przetwarzania paragonów

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

# Sprawdź czy Docker jest uruchomiony
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker nie jest uruchomiony. Uruchom Docker i spróbuj ponownie."
        exit 1
    fi
}

# Sprawdź czy plik .env.dev istnieje
check_env_file() {
    if [ ! -f "env.dev" ]; then
        log_error "Plik env.dev nie istnieje. Skopiuj env.dev.example do env.dev i skonfiguruj zmienne."
        exit 1
    fi
}

# Sprawdź czy poetry jest zainstalowane
check_poetry() {
    if ! command -v poetry &> /dev/null; then
        log_warning "Poetry nie jest zainstalowane. Instaluję zależności przez pip..."
        return 1
    fi
    return 0
}

# Instaluj zależności Python
install_dependencies() {
    log_info "Instalowanie zależności Python..."
    
    if check_poetry; then
        poetry install
    else
        pip install -r requirements.txt 2>/dev/null || {
            log_warning "Nie znaleziono requirements.txt, próbuję zainstalować zależności z pyproject.toml..."
            pip install celery redis fastapi uvicorn sqlalchemy asyncpg
        }
    fi
    
    log_success "Zależności zainstalowane"
}

# Tworzenie katalogów tymczasowych
create_temp_dirs() {
    log_info "Tworzenie katalogów tymczasowych..."
    
    mkdir -p temp_uploads
    mkdir -p logs/celery
    mkdir -p data/vector_store_dev
    
    log_success "Katalogi tymczasowe utworzone"
}

# Uruchomienie systemu z Docker Compose
start_system() {
    log_info "Uruchamianie systemu FoodSave AI z asynchronicznym przetwarzaniem..."
    
    # Zatrzymaj istniejące kontenery
    docker-compose -f docker-compose.dev.yaml down 2>/dev/null || true
    
    # Uruchom system
    docker-compose -f docker-compose.dev.yaml up -d
    
    log_success "System uruchomiony"
}

# Sprawdzenie statusu serwisów
check_services() {
    log_info "Sprawdzanie statusu serwisów..."
    
    # Czekaj na uruchomienie bazy danych
    log_info "Czekam na uruchomienie bazy danych..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.dev.yaml exec -T postgres pg_isready -U foodsave > /dev/null 2>&1; then
            log_success "Baza danych gotowa"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -eq 0 ]; then
        log_error "Baza danych nie uruchomiła się w czasie"
        exit 1
    fi
    
    # Czekaj na uruchomienie Redis
    log_info "Czekam na uruchomienie Redis..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.dev.yaml exec -T redis redis-cli ping > /dev/null 2>&1; then
            log_success "Redis gotowy"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -eq 0 ]; then
        log_error "Redis nie uruchomił się w czasie"
        exit 1
    fi
    
    # Czekaj na uruchomienie Celery workera
    log_info "Czekam na uruchomienie Celery workera..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.dev.yaml exec -T celery_worker celery -A src.worker.celery_app inspect ping > /dev/null 2>&1; then
            log_success "Celery worker gotowy"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -eq 0 ]; then
        log_warning "Celery worker może nie być jeszcze gotowy, sprawdź logi"
    fi
    
    # Czekaj na uruchomienie backendu
    log_info "Czekam na uruchomienie backendu..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            log_success "Backend gotowy"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -eq 0 ]; then
        log_warning "Backend może nie być jeszcze gotowy, sprawdź logi"
    fi
}

# Wyświetl informacje o systemie
show_system_info() {
    echo
    log_success "=== FoodSave AI - System Asynchroniczny Uruchomiony ==="
    echo
    echo -e "${BLUE}Dostępne serwisy:${NC}"
    echo -e "  • Backend API:     ${GREEN}http://localhost:8000${NC}"
    echo -e "  • Frontend:        ${GREEN}http://localhost:3000${NC}"
    echo -e "  • Grafana:         ${GREEN}http://localhost:3001${NC} (admin/admin)"
    echo -e "  • Prometheus:      ${GREEN}http://localhost:9090${NC}"
    echo -e "  • Redis:           ${GREEN}localhost:6380${NC}"
    echo -e "  • PostgreSQL:      ${GREEN}localhost:5433${NC}"
    echo
    echo -e "${BLUE}Nowe endpointy API v3:${NC}"
    echo -e "  • Upload paragonu: ${GREEN}POST /api/v3/receipts/process${NC}"
    echo -e "  • Status zadania:  ${GREEN}GET /api/v3/receipts/status/{job_id}${NC}"
    echo -e "  • Anuluj zadanie:  ${GREEN}DELETE /api/v3/receipts/cancel/{job_id}${NC}"
    echo -e "  • Health check:    ${GREEN}GET /api/v3/receipts/health${NC}"
    echo
    echo -e "${BLUE}Dokumentacja API:${NC}"
    echo -e "  • Swagger UI:      ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "  • ReDoc:           ${GREEN}http://localhost:8000/redoc${NC}"
    echo
    echo -e "${BLUE}Przydatne komendy:${NC}"
    echo -e "  • Logi workera:    ${YELLOW}docker-compose logs -f celery_worker${NC}"
    echo -e "  • Status Celery:   ${YELLOW}docker-compose exec celery_worker celery -A src.worker.celery_app inspect active${NC}"
    echo -e "  • Zatrzymaj:       ${YELLOW}docker-compose -f docker-compose.dev.yaml down${NC}"
    echo
}

# Testowanie nowego API
test_async_api() {
    log_info "Testowanie nowego API v3..."
    
    # Test health check
    if curl -f http://localhost:8000/api/v3/receipts/health > /dev/null 2>&1; then
        log_success "API v3 health check - OK"
    else
        log_warning "API v3 health check - FAILED (może backend nie jest jeszcze gotowy)"
    fi
    
    echo
    log_info "Możesz teraz testować nowe API v3:"
    echo -e "  ${YELLOW}curl -X GET http://localhost:8000/api/v3/receipts/health${NC}"
    echo
}

# Główna funkcja
main() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  FoodSave AI - Async Dev Setup${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
    
    # Sprawdzenia wstępne
    check_docker
    check_env_file
    
    # Instalacja i konfiguracja
    install_dependencies
    create_temp_dirs
    
    # Uruchomienie systemu
    start_system
    
    # Sprawdzenie statusu
    check_services
    
    # Informacje końcowe
    show_system_info
    test_async_api
    
    echo
    log_success "System gotowy do użycia!"
    echo
}

# Obsługa sygnałów
trap 'log_info "Zatrzymywanie systemu..."; docker-compose -f docker-compose.dev.yaml down' INT TERM

# Uruchom główną funkcję
main "$@" 