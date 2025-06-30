#!/bin/bash

# Build All Containers with Optimizations (excluding Ollama)
# This script builds all containers with Docker BuildKit optimizations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Building All Containers with Optimizations${NC}"
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

# Function to check if Ollama is running
check_ollama() {
    echo -e "${PURPLE}🔍 Checking Ollama status...${NC}"
    if docker ps --format "table {{.Names}}" | grep -q "ollama"; then
        echo -e "${GREEN}✅ Ollama is running - keeping existing container${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Ollama not running - please start it manually${NC}"
        echo -e "${YELLOW}   Run: docker run -d --name foodsave-ollama-opt -p 11434:11434 -v ollama_data:/root/.ollama aiasisstmarubo-ollama:latest${NC}"
        return 1
    fi
}

# Main build process
main() {
    echo -e "${BLUE}🔧 Starting optimized build process...${NC}"
    echo ""
    
    # Check Ollama first
    check_ollama
    
    echo -e "${BLUE}📋 Build Plan:${NC}"
    echo "1. Backend (FastAPI)"
    echo "2. Frontend (Next.js)"
    echo "3. Celery Worker"
    echo "4. Celery Beat"
    echo "5. PostgreSQL (using official image)"
    echo "6. Redis (using official image)"
    echo ""
    
    # Build Backend
    build_service "Backend" "src/backend/Dockerfile.prod" "." "foodsave-backend:latest"
    
    # Build Frontend with optimized Dockerfile
    build_service "Frontend" "myappassistant-chat-frontend/Dockerfile.prod.optimized" "./myappassistant-chat-frontend" "foodsave-frontend:latest"
    
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
    echo "   - Run: docker-compose -f docker-compose.optimized.yml up -d"
    echo "   - Check logs: docker-compose -f docker-compose.optimized.yml logs -f"
    echo "   - Monitor: docker stats"
}

# Error handling
trap 'echo -e "${RED}❌ Build failed!${NC}"; exit 1' ERR

# Run main function
main "$@" 