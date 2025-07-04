#!/bin/bash

# Cleanup and Restart Script for FoodSave AI
# Comprehensive cleanup and restart following .cursorrules standards
# Version: 2025-07-02

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 FoodSave AI - Cleanup and Restart${NC}"
echo "================================================"

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to stop all containers
stop_containers() {
    echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
    
    # Stop all running containers
    docker compose down --volumes --remove-orphans 2>/dev/null || true
    
    # Stop any remaining containers with foodsave in name
    docker ps -q --filter "name=foodsave" | xargs -r docker stop 2>/dev/null || true
    docker ps -q --filter "name=aiasisstmarubo" | xargs -r docker stop 2>/dev/null || true
    
    echo -e "${GREEN}✅ All containers stopped${NC}"
}

# Function to remove containers and images
cleanup_containers_and_images() {
    echo -e "${YELLOW}🗑️  Removing containers and images...${NC}"
    
    # Remove all stopped containers
    docker container prune -f
    
    # Remove foodsave images
    docker images -q --filter "reference=foodsave*" | xargs -r docker rmi -f 2>/dev/null || true
    docker images -q --filter "reference=aiasisstmarubo*" | xargs -r docker rmi -f 2>/dev/null || true
    
    echo -e "${GREEN}✅ Containers and images cleaned${NC}"
}

# Function to clean volumes (optional)
cleanup_volumes() {
    echo -e "${YELLOW}💾 Cleaning volumes...${NC}"
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove specific volumes if they exist
    docker volume rm foodsave_ai_network 2>/dev/null || true
    docker volume rm postgres_data 2>/dev/null || true
    docker volume rm redis_data 2>/dev/null || true
    docker volume rm ollama_data 2>/dev/null || true
    
    echo -e "${GREEN}✅ Volumes cleaned${NC}"
}

# Function to clean networks
cleanup_networks() {
    echo -e "${YELLOW}🌐 Cleaning networks...${NC}"
    
    # Remove unused networks
    docker network prune -f
    
    # Remove specific networks if they exist
    docker network rm foodsave_ai_network 2>/dev/null || true
    docker network rm foodsave-network 2>/dev/null || true
    
    echo -e "${GREEN}✅ Networks cleaned${NC}"
}

# Function to check port conflicts
check_ports() {
    echo -e "${PURPLE}🔍 Checking port conflicts...${NC}"
    
    local ports=(8000 8001 3000 3003 5432 6379 6380 11434)
    
    for port in "${ports[@]}"; do
        if netstat -tulpn 2>/dev/null | grep -q ":$port "; then
            echo -e "${YELLOW}⚠️  Port $port is in use${NC}"
        else
            echo -e "${GREEN}✅ Port $port is available${NC}"
        fi
    done
}

# Function to rebuild and start
rebuild_and_start() {
    echo -e "${BLUE}🔨 Rebuilding and starting services...${NC}"
    
    # Build all containers
    ./build-all-containers.sh
    
    # Start services
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    docker compose up -d
    
    echo -e "${GREEN}✅ Services started${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Current status:${NC}"
    docker compose ps
    
    echo -e "${BLUE}📈 Resource usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Main function
main() {
    echo -e "${BLUE}🔧 Starting cleanup and restart process...${NC}"
    echo ""
    
    # Check Docker
    check_docker
    
    # Check ports
    check_ports
    echo ""
    
    # Ask user for confirmation
    echo -e "${YELLOW}⚠️  This will stop and remove all FoodSave AI containers and images.${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Operation cancelled${NC}"
        exit 0
    fi
    
    # Stop containers
    stop_containers
    echo ""
    
    # Cleanup containers and images
    cleanup_containers_and_images
    echo ""
    
    # Cleanup volumes (optional)
    read -p "Do you want to clean volumes too? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup_volumes
        echo ""
    fi
    
    # Cleanup networks
    cleanup_networks
    echo ""
    
    # Rebuild and start
    rebuild_and_start
    echo ""
    
    # Wait a moment for services to start
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 30
    
    # Show status
    show_status
    
    echo ""
    echo -e "${GREEN}🎉 Cleanup and restart completed!${NC}"
    echo -e "${YELLOW}💡 Useful commands:${NC}"
    echo "   - View logs: docker compose logs -f"
    echo "   - Check health: docker compose ps"
    echo "   - Stop services: docker compose down"
}

# Error handling
trap 'echo -e "${RED}❌ Operation failed!${NC}"; exit 1' ERR

# Run main function
main "$@" 