#!/bin/bash

# FoodSave AI - Advanced Management Script
# Comprehensive project management for development, testing, and production environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_NAME="foodsave-ai"
VERSION="2.0.0"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Environment configurations
ENVIRONMENTS=("dev" "test" "prod")
DEFAULT_ENV="dev"

# Service configurations
SERVICES=("backend" "frontend" "ollama" "postgres" "redis" "prometheus" "grafana" "loki" "promtail" "nginx")

# Port mappings
declare -A PORTS=(
    ["backend"]="8000"
    ["frontend"]="5173"
    ["ollama"]="11434"
    ["postgres"]="5433"
    ["redis"]="6379"
    ["prometheus"]="9090"
    ["grafana"]="3000"
    ["loki"]="3100"
    ["promtail"]="9080"
    ["nginx"]="80"
)

# Logging
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/manager.log"

# Functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log "INFO" "$1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log "SUCCESS" "$1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log "WARNING" "$1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "ERROR" "$1"
}

debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
        log "DEBUG" "$1"
    fi
}

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
}

# Get Docker Compose command
get_docker_compose_cmd() {
    if docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

# Check port availability
check_port() {
    local port="$1"
    local service="$2"
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        warning "Port $port is already in use by another process"
        if command -v lsof >/dev/null 2>&1; then
            lsof -i :$port 2>/dev/null || true
        fi
        return 1
    fi
    return 0
}

# Check all required ports
check_ports() {
    info "Checking port availability..."
    local conflicts=()
    
    for service in "${SERVICES[@]}"; do
        local port="${PORTS[$service]}"
        if ! check_port "$port" "$service"; then
            conflicts+=("$service:$port")
        fi
    done
    
    if [[ ${#conflicts[@]} -gt 0 ]]; then
        error "Port conflicts detected:"
        for conflict in "${conflicts[@]}"; do
            echo "  - $conflict"
        done
        echo
        echo "Options:"
        echo "  1. Stop conflicting processes manually"
        echo "  2. Use 'manager stop' to stop all containers"
        echo "  3. Use 'manager clean' to clean up everything"
        return 1
    fi
    
    success "All ports are available"
    return 0
}

# Get environment-specific compose file
get_compose_file() {
    local env="$1"
    case "$env" in
        "dev")
            echo "docker-compose.dev.yaml"
            ;;
        "test")
            echo "docker-compose.test.yaml"
            ;;
        "prod")
            echo "docker-compose.yaml"
            ;;
        *)
            error "Unknown environment: $env"
            exit 1
            ;;
    esac
}

# Start services
start_services() {
    local env="${1:-$DEFAULT_ENV}"
    local compose_file=$(get_compose_file "$env")
    
    info "Starting FoodSave AI services in $env environment..."
    
    check_docker
    check_docker_compose
    
    if [[ "$env" == "dev" ]]; then
        check_ports
    fi
    
    local compose_cmd=$(get_docker_compose_cmd)
    
    cd "$PROJECT_ROOT"
    
    # Build images if needed
    if [[ "${2:-}" == "--build" ]]; then
        info "Building images..."
        $compose_cmd -f "$compose_file" build
    fi
    
    # Start services
    info "Starting services with $compose_file..."
    $compose_cmd -f "$compose_file" up -d
    
    # Wait for services to be ready
    wait_for_services "$env"
    
    success "FoodSave AI services started successfully in $env environment"
    show_status "$env"
}

# Stop services
stop_services() {
    local env="${1:-$DEFAULT_ENV}"
    local compose_file=$(get_compose_file "$env")
    
    info "Stopping FoodSave AI services in $env environment..."
    
    cd "$PROJECT_ROOT"
    local compose_cmd=$(get_docker_compose_cmd)
    $compose_cmd -f "$compose_file" down
    
    success "FoodSave AI services stopped successfully"
}

# Restart services
restart_services() {
    local env="${1:-$DEFAULT_ENV}"
    local build="${2:-}"
    
    info "Restarting FoodSave AI services in $env environment..."
    stop_services "$env"
    sleep 2
    start_services "$env" "$build"
}

# Show service status
show_status() {
    local env="${1:-$DEFAULT_ENV}"
    local compose_file=$(get_compose_file "$env")
    
    echo
    echo -e "${CYAN}=== FoodSave AI Status ($env environment) ===${NC}"
    echo
    
    cd "$PROJECT_ROOT"
    local compose_cmd=$(get_docker_compose_cmd)
    
    # Show container status
    $compose_cmd -f "$compose_file" ps
    
    echo
    echo -e "${CYAN}=== Service URLs ===${NC}"
    echo "Frontend:     http://localhost:${PORTS[frontend]}"
    echo "Backend API:  http://localhost:${PORTS[backend]}/docs"
    echo "Grafana:      http://localhost:${PORTS[grafana]}"
    echo "Prometheus:   http://localhost:${PORTS[prometheus]}"
    echo "Ollama:       http://localhost:${PORTS[ollama]}"
    echo
    
    # Show resource usage
    show_resource_usage
}

# Show resource usage
show_resource_usage() {
    echo -e "${CYAN}=== Resource Usage ===${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" 2>/dev/null || true
    echo
}

# Wait for services to be ready
wait_for_services() {
    local env="$1"
    local timeout=120
    local interval=5
    local elapsed=0
    
    info "Waiting for services to be ready..."
    
    while [[ $elapsed -lt $timeout ]]; do
        local ready=true
        
        # Check if containers are running
        local compose_file=$(get_compose_file "$env")
        local compose_cmd=$(get_docker_compose_cmd)
        
        cd "$PROJECT_ROOT"
        if ! $compose_cmd -f "$compose_file" ps | grep -q "Up"; then
            ready=false
        fi
        
        if [[ "$ready" == "true" ]]; then
            success "All services are ready"
            return 0
        fi
        
        sleep $interval
        elapsed=$((elapsed + interval))
        echo -n "."
    done
    
    warning "Timeout waiting for services to be ready"
    return 1
}

# Show logs
show_logs() {
    local env="${1:-$DEFAULT_ENV}"
    local service="${2:-}"
    local compose_file=$(get_compose_file "$env")
    
    cd "$PROJECT_ROOT"
    local compose_cmd=$(get_docker_compose_cmd)
    
    if [[ -n "$service" ]]; then
        info "Showing logs for $service..."
        $compose_cmd -f "$compose_file" logs -f "$service"
    else
        info "Showing logs for all services..."
        $compose_cmd -f "$compose_file" logs -f
    fi
}

# Build services
build_services() {
    local env="${1:-$DEFAULT_ENV}"
    local compose_file=$(get_compose_file "$env")
    
    info "Building FoodSave AI services..."
    
    cd "$PROJECT_ROOT"
    local compose_cmd=$(get_docker_compose_cmd)
    $compose_cmd -f "$compose_file" build --no-cache
    
    success "Services built successfully"
}

# Clean up everything
clean_environment() {
    local env="${1:-$DEFAULT_ENV}"
    local compose_file=$(get_compose_file "$env")
    
    warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        info "Cleanup cancelled"
        return
    fi
    
    info "Cleaning up FoodSave AI environment..."
    
    cd "$PROJECT_ROOT"
    local compose_cmd=$(get_docker_compose_cmd)
    
    # Stop and remove containers
    $compose_cmd -f "$compose_file" down -v --remove-orphans
    
    # Remove images
    $compose_cmd -f "$compose_file" down --rmi all
    
    # Clean up dangling resources
    docker system prune -f
    
    success "Environment cleaned successfully"
}

# Run tests
run_tests() {
    local test_type="${1:-all}"
    local env="${2:-$DEFAULT_ENV}"
    
    info "Running tests: $test_type"
    
    case "$test_type" in
        "unit")
            run_unit_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "all")
            run_unit_tests
            run_integration_tests
            run_e2e_tests
            ;;
        *)
            error "Unknown test type: $test_type"
            exit 1
            ;;
    esac
}

# Run unit tests
run_unit_tests() {
    info "Running unit tests..."
    
    # Backend unit tests
    cd "$PROJECT_ROOT"
    if [[ -f "pyproject.toml" ]]; then
        python -m pytest tests/unit/ -v --tb=short
    fi
    
    # Frontend unit tests
    cd "$PROJECT_ROOT/myappassistant-chat-frontend"
    if [[ -f "package.json" ]]; then
        npm test -- --watchAll=false
    fi
}

# Run integration tests
run_integration_tests() {
    info "Running integration tests..."
    
    cd "$PROJECT_ROOT"
    if [[ -f "pyproject.toml" ]]; then
        python -m pytest tests/integration/ -v --tb=short
    fi
}

# Run E2E tests
run_e2e_tests() {
    info "Running E2E tests..."
    
    # Frontend E2E tests
    cd "$PROJECT_ROOT/myappassistant-chat-frontend"
    if [[ -f "package.json" ]]; then
        npm run test:e2e
    fi
    
    # Backend E2E tests
    cd "$PROJECT_ROOT"
    if [[ -f "pyproject.toml" ]]; then
        python -m pytest tests/e2e/ -v --tb=short
    fi
}

# Backup data
backup_data() {
    local backup_dir="$PROJECT_ROOT/data/backups"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_name="foodsave_backup_$timestamp"
    
    mkdir -p "$backup_dir"
    
    info "Creating backup: $backup_name"
    
    # Backup database
    docker exec foodsave-postgres pg_dump -U foodsave_user foodsave_db > "$backup_dir/${backup_name}_db.sql" 2>/dev/null || warning "Database backup failed"
    
    # Backup configuration files
    tar -czf "$backup_dir/${backup_name}_config.tar.gz" \
        -C "$PROJECT_ROOT" \
        data/config/ \
        monitoring/ \
        docker-compose*.yaml \
        2>/dev/null || warning "Config backup failed"
    
    success "Backup created: $backup_name"
}

# Restore data
restore_data() {
    local backup_name="$1"
    local backup_dir="$PROJECT_ROOT/data/backups"
    
    if [[ ! -f "$backup_dir/${backup_name}_db.sql" ]]; then
        error "Backup not found: $backup_name"
        exit 1
    fi
    
    warning "This will overwrite current data. Are you sure? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        info "Restore cancelled"
        return
    fi
    
    info "Restoring backup: $backup_name"
    
    # Restore database
    docker exec -i foodsave-postgres psql -U foodsave_user foodsave_db < "$backup_dir/${backup_name}_db.sql" || warning "Database restore failed"
    
    # Restore configuration
    if [[ -f "$backup_dir/${backup_name}_config.tar.gz" ]]; then
        tar -xzf "$backup_dir/${backup_name}_config.tar.gz" -C "$PROJECT_ROOT" || warning "Config restore failed"
    fi
    
    success "Backup restored: $backup_name"
}

# Health check
health_check() {
    local env="${1:-$DEFAULT_ENV}"
    
    info "Performing health check..."
    
    local healthy=true
    
    # Check if containers are running
    local compose_file=$(get_compose_file "$env")
    local compose_cmd=$(get_docker_compose_cmd)
    
    cd "$PROJECT_ROOT"
    if ! $compose_cmd -f "$compose_file" ps | grep -q "Up"; then
        error "Some containers are not running"
        healthy=false
    fi
    
    # Check service endpoints
    for service in "${SERVICES[@]}"; do
        local port="${PORTS[$service]}"
        if [[ "$service" == "postgres" || "$service" == "redis" ]]; then
            continue  # Skip internal services
        fi
        
        if ! curl -s "http://localhost:$port" >/dev/null 2>&1; then
            warning "Service $service is not responding on port $port"
            healthy=false
        fi
    done
    
    if [[ "$healthy" == "true" ]]; then
        success "All services are healthy"
    else
        error "Health check failed"
        return 1
    fi
}

# Monitor resources
monitor_resources() {
    info "Starting resource monitoring..."
    
    while true; do
        clear
        echo -e "${CYAN}=== FoodSave AI Resource Monitor ===${NC}"
        echo
        show_resource_usage
        echo "Press Ctrl+C to stop monitoring"
        sleep 5
    done
}

# Show help
show_help() {
    echo -e "${CYAN}FoodSave AI Management Script v$VERSION${NC}"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  start [env] [--build]     Start services (default: dev)"
    echo "  stop [env]                Stop services (default: dev)"
    echo "  restart [env] [--build]   Restart services (default: dev)"
    echo "  status [env]              Show service status (default: dev)"
    echo "  logs [env] [service]      Show logs (default: all services)"
    echo "  build [env]               Build services (default: dev)"
    echo "  clean [env]               Clean up environment (default: dev)"
    echo "  test [type] [env]         Run tests (unit|integration|e2e|all)"
    echo "  backup                    Create backup"
    echo "  restore <backup_name>     Restore backup"
    echo "  health [env]              Health check (default: dev)"
    echo "  monitor                   Monitor resources"
    echo "  ports                     Check port availability"
    echo "  help                      Show this help"
    echo
    echo "Environments:"
    echo "  dev                       Development environment"
    echo "  test                      Testing environment"
    echo "  prod                      Production environment"
    echo
    echo "Examples:"
    echo "  $0 start dev --build      Start dev environment with rebuild"
    echo "  $0 logs dev backend       Show backend logs in dev"
    echo "  $0 test all               Run all tests"
    echo "  $0 health prod            Health check production"
    echo
    echo "Environment Variables:"
    echo "  DEBUG=true                Enable debug output"
    echo "  COMPOSE_FILE              Override compose file"
}

# Main script logic
main() {
    local command="${1:-help}"
    local env="${2:-$DEFAULT_ENV}"
    local option="${3:-}"
    
    case "$command" in
        "start")
            start_services "$env" "$option"
            ;;
        "stop")
            stop_services "$env"
            ;;
        "restart")
            restart_services "$env" "$option"
            ;;
        "status")
            show_status "$env"
            ;;
        "logs")
            show_logs "$env" "$option"
            ;;
        "build")
            build_services "$env"
            ;;
        "clean")
            clean_environment "$env"
            ;;
        "test")
            run_tests "$env" "$option"
            ;;
        "backup")
            backup_data
            ;;
        "restore")
            if [[ -z "$env" ]]; then
                error "Backup name required for restore"
                exit 1
            fi
            restore_data "$env"
            ;;
        "health")
            health_check "$env"
            ;;
        "monitor")
            monitor_resources
            ;;
        "ports")
            check_ports
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            error "Unknown command: $command"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
