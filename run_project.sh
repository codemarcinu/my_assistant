#!/bin/bash

# FoodSave AI - Project Startup Script
# Zgodny z regułami .cursorrules

set -e

echo "🚀 Starting FoodSave AI Project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}ℹ️  INFO${NC}: $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ SUCCESS${NC}: $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  WARNING${NC}: $message"
            ;;
        "ERROR")
            echo -e "${RED}❌ ERROR${NC}: $message"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "INFO" "Checking prerequisites..."

if ! command_exists docker; then
    print_status "ERROR" "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    print_status "ERROR" "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "SUCCESS" "Prerequisites check passed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_status "WARNING" ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "SUCCESS" ".env file created from .env.example"
    else
        print_status "ERROR" ".env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Validate Docker Compose configuration
print_status "INFO" "Validating Docker Compose configuration..."
if docker compose config --quiet; then
    print_status "SUCCESS" "Docker Compose configuration is valid"
else
    print_status "ERROR" "Docker Compose configuration has errors"
    exit 1
fi

# Stop any existing containers
print_status "INFO" "Stopping any existing containers..."
docker compose down --remove-orphans

# Build and start services
print_status "INFO" "Building and starting services..."
docker compose up -d --build

# Wait for services to be ready
print_status "INFO" "Waiting for services to be ready..."
if [ -f "myappassistant/scripts/wait-for-services.sh" ]; then
    myappassistant/scripts/wait-for-services.sh
else
    print_status "WARNING" "wait-for-services.sh not found, waiting manually..."
    sleep 30
fi

# Check health endpoints
print_status "INFO" "Checking service health..."

# Check backend health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_status "SUCCESS" "Backend is healthy"
else
    print_status "ERROR" "Backend health check failed"
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "SUCCESS" "Frontend is accessible"
else
    print_status "WARNING" "Frontend health check failed (may still be starting)"
fi

# Display service URLs
echo ""
print_status "SUCCESS" "FoodSave AI is now running!"
echo ""
echo "🌐 Service URLs:"
echo "   Backend API:     http://localhost:8000"
echo "   Frontend:        http://localhost:3000"
echo "   API Docs:        http://localhost:8000/docs"
echo "   Health Check:    http://localhost:8000/health"
echo ""
echo "📊 Monitoring (if enabled):"
echo "   Prometheus:      http://localhost:9090"
echo "   Grafana:         http://localhost:3001"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:       docker compose logs -f"
echo "   Stop services:   docker compose down"
echo "   Restart:         docker compose restart"
echo ""

# Run validation if available
if [ -f "myappassistant/scripts/validate_rules.py" ]; then
    print_status "INFO" "Running Cursor-Rules validation..."
    if python3 myappassistant/scripts/validate_rules.py; then
        print_status "SUCCESS" "Cursor-Rules validation passed"
    else
        print_status "WARNING" "Cursor-Rules validation found issues (see output above)"
    fi
fi

print_status "SUCCESS" "Project startup completed successfully!" 