#!/bin/bash

# FoodSave AI Docker Environment Setup Script
# This script prepares the environment for running FoodSave AI in Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker installation
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is properly installed and running"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create logs directory
    mkdir -p logs/{backend,frontend,postgres,redis,nginx,ollama}
    
    # Create data directories
    mkdir -p data/{vector_store,search_cache,config}
    
    # Create nginx SSL directory
    mkdir -p nginx/ssl
    
    # Create backups directory
    mkdir -p backups
    
    # Set proper permissions
    chmod 755 logs data backups
    chmod 700 nginx/ssl
    
    print_success "Directories created successfully"
}

# Function to generate SSL certificates for development
generate_ssl_certificates() {
    print_status "Generating SSL certificates for development..."
    
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=PL/ST=Warsaw/L=Warsaw/O=FoodSave/OU=IT/CN=localhost" \
            -addext "subjectAltName=DNS:localhost,DNS:foodsave.local,IP:127.0.0.1"
        
        chmod 600 nginx/ssl/key.pem
        chmod 644 nginx/ssl/cert.pem
        
        print_success "SSL certificates generated successfully"
    else
        print_warning "SSL certificates already exist, skipping generation"
    fi
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# FoodSave AI Environment Configuration

# Database Configuration
POSTGRES_DB=foodsave_prod
POSTGRES_USER=foodsave
POSTGRES_PASSWORD=foodsave_prod_password_$(openssl rand -hex 8)
DATABASE_URL=postgresql+asyncpg://foodsave:\${POSTGRES_PASSWORD}@postgres:5432/foodsave_prod

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# LLM Configuration
OLLAMA_MODEL=SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0
DEFAULT_CHAT_MODEL=SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0
DEFAULT_CODE_MODEL=SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0
DEFAULT_EMBEDDING_MODEL=nomic-embed-text

# Application Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://frontend:80,https://foodsave.local

# Vector Store Configuration
RAG_VECTOR_STORE_PATH=/app/data/vector_store

# Frontend Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_TELEMETRY_DISABLED=1
EOF
        
        print_success "Environment file created successfully"
        print_warning "Please review and modify the .env file according to your needs"
    else
        print_warning "Environment file already exists, skipping creation"
    fi
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -f src/backend/Dockerfile.prod -t foodsave-backend:latest .
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -f myappassistant-chat-frontend/Dockerfile.prod -t foodsave-frontend:latest ./myappassistant-chat-frontend
    
    print_success "Docker images built successfully"
}

# Function to start services
start_services() {
    print_status "Starting FoodSave AI services..."
    
    # Start core services
    docker-compose -f docker-compose.prod.yaml up -d postgres redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Start backend
    docker-compose -f docker-compose.prod.yaml up -d backend
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    sleep 15
    
    # Start frontend
    docker-compose -f docker-compose.prod.yaml up -d frontend
    
    print_success "Services started successfully"
}

# Function to show status
show_status() {
    print_status "Checking service status..."
    
    docker-compose -f docker-compose.prod.yaml ps
    
    echo ""
    print_status "Service URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:8000"
    echo "  Database: localhost:5432"
    echo "  Redis: localhost:6379"
    
    echo ""
    print_status "To view logs:"
    echo "  docker-compose -f docker-compose.prod.yaml logs -f"
    
    echo ""
    print_status "To stop services:"
    echo "  docker-compose -f docker-compose.prod.yaml down"
}

# Main execution
main() {
    echo "=========================================="
    echo "FoodSave AI Docker Environment Setup"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_docker
    
    # Create directories
    create_directories
    
    # Generate SSL certificates
    generate_ssl_certificates
    
    # Create environment file
    create_env_file
    
    # Ask user if they want to build images
    echo ""
    read -p "Do you want to build Docker images now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_images
    fi
    
    # Ask user if they want to start services
    echo ""
    read -p "Do you want to start the services now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_services
        show_status
    fi
    
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Review and modify the .env file if needed"
    echo "2. Run: docker-compose -f docker-compose.prod.yaml up -d"
    echo "3. Access the application at http://localhost"
    echo "4. Check logs with: docker-compose -f docker-compose.prod.yaml logs -f"
}

# Run main function
main "$@" 