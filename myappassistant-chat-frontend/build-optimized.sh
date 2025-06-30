#!/bin/bash

# Optimized Docker build script for Next.js frontend
# Uses BuildKit features for better caching and performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting optimized Docker build...${NC}"

# Enable Docker BuildKit for better performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build arguments
IMAGE_NAME="myappassistant-frontend"
TAG=${1:-latest}
DOCKERFILE=${2:-Dockerfile.prod.optimized}

echo -e "${YELLOW}📦 Building image: ${IMAGE_NAME}:${TAG}${NC}"
echo -e "${YELLOW}📄 Using Dockerfile: ${DOCKERFILE}${NC}"

# Build with BuildKit optimizations
docker build \
    --file ${DOCKERFILE} \
    --tag ${IMAGE_NAME}:${TAG} \
    --tag ${IMAGE_NAME}:latest \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --cache-from ${IMAGE_NAME}:latest \
    --progress=plain \
    .

# Show build results
echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Show image size
IMAGE_SIZE=$(docker images ${IMAGE_NAME}:${TAG} --format "table {{.Size}}" | tail -n 1)
echo -e "${GREEN}📏 Image size: ${IMAGE_SIZE}${NC}"

# Show image layers
echo -e "${YELLOW}🔍 Image layers:${NC}"
docker history ${IMAGE_NAME}:${TAG} --format "table {{.CreatedBy}}\t{{.Size}}" | head -10

# Optional: Run container for testing
if [[ "$3" == "--test" ]]; then
    echo -e "${YELLOW}🧪 Testing container...${NC}"
    docker run --rm -d --name test-frontend -p 3000:3000 ${IMAGE_NAME}:${TAG}
    sleep 5
    
    # Check if container is running
    if docker ps | grep -q test-frontend; then
        echo -e "${GREEN}✅ Container is running successfully!${NC}"
        echo -e "${YELLOW}🌐 Frontend available at: http://localhost:3000${NC}"
        
        # Stop test container
        docker stop test-frontend
    else
        echo -e "${RED}❌ Container failed to start${NC}"
        docker logs test-frontend
        exit 1
    fi
fi

echo -e "${GREEN}🎉 Build process completed!${NC}" 