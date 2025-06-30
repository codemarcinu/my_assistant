#!/bin/bash

# FoodSave AI - Complete System Startup Script
# Zgodnie z najlepszymi praktykami programistycznymi

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8000
OLLAMA_PORT=11434
APP_NAME="FoodSave AI_1.0.0_amd64.AppImage"
APP_PATH="myappassistant-chat-frontend/src-tauri/target/release/bundle/appimage/$APP_NAME"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if service is running
check_service() {
    local port=$1
    local service_name=$2
    
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        print_success "$service_name is running on port $port"
        return 0
    else
        print_warning "$service_name is not running on port $port"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if check_service $port "$service_name" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to start backend services
start_backend() {
    print_status "Starting backend services..."
    
    if [ ! -f "docker-compose.dev.yaml" ]; then
        print_error "docker-compose.dev.yaml not found!"
        exit 1
    fi
    
    # Start services in background
    docker compose -f docker-compose.dev.yaml up -d
    
    # Wait for services to be ready
    wait_for_service $BACKEND_PORT "Backend API"
    wait_for_service $OLLAMA_PORT "Ollama"
    
    print_success "Backend services started successfully!"
}

# Function to check and pull required models
check_models() {
    print_status "Checking required AI models..."
    
    # Check if bielik model is available
    if curl -s "http://localhost:$OLLAMA_PORT/api/tags" | grep -q "bielik"; then
        print_success "Bielik model is already available"
    else
        print_warning "Bielik model not found. Starting download..."
        print_status "This may take several minutes depending on your internet connection..."
        
        # Start model download in background
        curl -X POST "http://localhost:$OLLAMA_PORT/api/pull" \
             -H "Content-Type: application/json" \
             -d '{"name": "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"}' > /dev/null 2>&1 &
        
        print_status "Model download started in background. You can start using the app while it downloads."
    fi
}

# Function to start Tauri application
start_tauri_app() {
    print_status "Starting Tauri application..."
    
    if [ ! -f "$APP_PATH" ]; then
        print_error "Tauri application not found at: $APP_PATH"
        print_status "Please build the application first with: cd myappassistant-chat-frontend && npm run tauri:build"
        exit 1
    fi
    
    # Check if app is already running
    if pgrep -f "$APP_NAME" > /dev/null; then
        print_warning "Tauri application is already running"
        return 0
    fi
    
    # Make executable and start
    chmod +x "$APP_PATH"
    "$APP_PATH" > /dev/null 2>&1 &
    
    sleep 2
    
    if pgrep -f "$APP_NAME" > /dev/null; then
        print_success "Tauri application started successfully!"
    else
        print_error "Failed to start Tauri application"
        exit 1
    fi
}

# Function to show system status
show_status() {
    echo
    print_status "=== FoodSave AI System Status ==="
    
    # Check backend
    if check_service $BACKEND_PORT "Backend API"; then
        # Test API endpoint
        if curl -s "http://localhost:$BACKEND_PORT/health" | grep -q "healthy"; then
            print_success "Backend API is healthy"
        else
            print_warning "Backend API is running but health check failed"
        fi
    fi
    
    # Check Ollama
    if check_service $OLLAMA_PORT "Ollama"; then
        # Check available models
        models=$(curl -s "http://localhost:$OLLAMA_PORT/api/tags" | jq -r '.models[].name' 2>/dev/null || echo "none")
        print_status "Available models: $models"
    fi
    
    # Check Tauri app
    if pgrep -f "$APP_NAME" > /dev/null; then
        print_success "Tauri application is running"
    else
        print_warning "Tauri application is not running"
    fi
    
    echo
    print_status "=== Quick Commands ==="
    echo "  Backend logs: docker compose -f docker-compose.dev.yaml logs -f backend"
    echo "  Stop services: docker compose -f docker-compose.dev.yaml down"
    echo "  Kill Tauri app: pkill -f '$APP_NAME'"
    echo "  Full restart: ./start_foodsave_ai.sh restart"
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    
    # Stop Tauri app
    if pgrep -f "$APP_NAME" > /dev/null; then
        pkill -f "$APP_NAME"
        print_success "Tauri application stopped"
    fi
    
    # Stop backend services
    if [ -f "docker-compose.dev.yaml" ]; then
        docker compose -f docker-compose.dev.yaml down
        print_success "Backend services stopped"
    fi
}

# Main script logic
main() {
    case "${1:-start}" in
        "start")
            print_status "Starting FoodSave AI system..."
            start_backend
            check_models
            start_tauri_app
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            main start
            ;;
        "status")
            show_status
            ;;
        "backend")
            start_backend
            check_models
            ;;
        "app")
            start_tauri_app
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|backend|app}"
            echo "  start   - Start all services (default)"
            echo "  stop    - Stop all services"
            echo "  restart - Restart all services"
            echo "  status  - Show system status"
            echo "  backend - Start only backend services"
            echo "  app     - Start only Tauri application"
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 