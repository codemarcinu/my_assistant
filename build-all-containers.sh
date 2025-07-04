#!/bin/bash

# Build All Containers for FoodSave AI
# Comprehensive build script following .cursorrules standards
# Version: 2025-07-02

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 FoodSave AI - Building All Containers${NC}"
echo "================================================"

# Enable Docker BuildKit for better performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Function to build with progress
build_service() {
    local service=$1
    local dockerfile=$2
    local context=$3
    local tag=$4
    
    echo -e "${YELLOW}📦 Building ${service}...${NC}"
    echo -e "   📄 Dockerfile: ${dockerfile}"
    echo -e "   📁 Context: ${context}"
    
    start_time=$(date +%s)
    
    docker build \
        --file ${dockerfile} \
        --tag ${tag} \
        --progress=plain \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        ${context}
    
    end_time=$(date +%s)
    build_time=$((end_time - start_time))
    
    # Get image size
    image_size=$(docker images ${tag} --format "{{.Size}}" | head -1)
    
    echo -e "${GREEN}✅ ${service} built successfully!${NC}"
    echo -e "   ⏱️  Build time: ${build_time}s"
    echo -e "   📏 Image size: ${image_size}"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${PURPLE}🔍 Checking prerequisites...${NC}"
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "pyproject.toml" ]; then
        echo -e "${RED}❌ pyproject.toml not found in current directory${NC}"
        exit 1
    fi
    
    if [ ! -f "myappassistant-chat-frontend/package.json" ]; then
        echo -e "${RED}❌ Frontend package.json not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
    echo ""
}

# Function to clean up old containers and images
cleanup_old_builds() {
    echo -e "${PURPLE}🧹 Cleaning up old builds...${NC}"
    
    # Stop and remove existing containers
    docker compose down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove old images (optional - uncomment if needed)
    # docker rmi $(docker images -q foodsave-*) 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
    echo ""
}

# Main build process
main() {
    echo -e "${BLUE}🔧 Starting build process...${NC}"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Cleanup old builds
    cleanup_old_builds
    
    echo -e "${BLUE}📋 Build Plan:${NC}"
    echo "1. Backend (FastAPI + Poetry)"
    echo "2. Frontend (Next.js + TypeScript)"
    echo "3. Celery Worker"
    echo "4. Celery Beat"
    echo "5. PostgreSQL (using official image)"
    echo "6. Redis (using official image)"
    echo "7. Ollama (using official image)"
    echo ""
    
    # Build Backend
    build_service "Backend" "src/backend/Dockerfile.prod" "." "foodsave-backend:latest"
    
    # Build Frontend
    build_service "Frontend" "myappassistant-chat-frontend/Dockerfile.prod" "./myappassistant-chat-frontend" "foodsave-frontend:latest"
    
    # Build Celery Worker (same as backend but different command)
    build_service "Celery Worker" "src/backend/Dockerfile.prod" "." "foodsave-celery-worker:latest"
    
    # Build Celery Beat (same as backend but different command)
    build_service "Celery Beat" "src/backend/Dockerfile.prod" "." "foodsave-celery-beat:latest"
    
    echo -e "${GREEN}🎉 All containers built successfully!${NC}"
    echo ""
    
    # Show final image sizes
    echo -e "${BLUE}📊 Final Image Sizes:${NC}"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep foodsave
    
    echo ""
    echo -e "${GREEN}✅ Build process completed!${NC}"
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo "   - Run: docker compose up -d"
    echo "   - Check logs: docker compose logs -f"
    echo "   - Monitor: docker stats"
    echo "   - Health check: docker compose ps"
}

# Error handling
trap 'echo -e "${RED}❌ Build failed!${NC}"; exit 1' ERR

# Run main function
main "$@" 