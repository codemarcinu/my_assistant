#!/bin/bash

# Docker build benchmark script
# Compares performance between original and optimized Dockerfiles

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔬 Docker Build Benchmark Tool${NC}"
echo "=================================="

# Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Clean up any existing images
echo -e "${YELLOW}🧹 Cleaning up existing images...${NC}"
docker rmi myappassistant-frontend:original myappassistant-frontend:optimized 2>/dev/null || true

# Function to measure build time and image size
benchmark_build() {
    local dockerfile=$1
    local tag=$2
    local description=$3
    
    echo -e "${YELLOW}📦 Building with ${description}...${NC}"
    
    # Measure build time
    start_time=$(date +%s.%N)
    docker build -f $dockerfile -t myappassistant-frontend:$tag . > /dev/null 2>&1
    end_time=$(date +%s.%N)
    
    build_time=$(echo "$end_time - $start_time" | bc)
    
    # Get image size
    image_size=$(docker images myappassistant-frontend:$tag --format "{{.Size}}" | head -1)
    
    echo -e "${GREEN}✅ ${description} build completed${NC}"
    echo -e "   ⏱️  Build time: ${build_time}s"
    echo -e "   📏 Image size: ${image_size}"
    echo ""
    
    # Store results
    eval "${tag}_build_time=$build_time"
    eval "${tag}_image_size=$image_size"
}

# Run benchmarks
echo -e "${BLUE}🚀 Starting benchmarks...${NC}"
echo ""

# Benchmark original Dockerfile
benchmark_build "Dockerfile.prod" "original" "Original Dockerfile"

# Benchmark optimized Dockerfile
benchmark_build "Dockerfile.prod.optimized" "optimized" "Optimized Dockerfile"

# Calculate improvements
echo -e "${BLUE}📊 Performance Comparison${NC}"
echo "=============================="

# Build time improvement
time_improvement=$(echo "scale=2; (${original_build_time} - ${optimized_build_time}) / ${original_build_time} * 100" | bc)
echo -e "${GREEN}⏱️  Build Time Improvement: ${time_improvement}%${NC}"
echo -e "   Original: ${original_build_time}s"
echo -e "   Optimized: ${optimized_build_time}s"

# Image size comparison (convert to MB for easier comparison)
original_size_mb=$(echo $original_image_size | sed 's/MB//' | sed 's/GB/*1024/' | bc)
optimized_size_mb=$(echo $optimized_image_size | sed 's/MB//' | sed 's/GB/*1024/' | bc)

size_improvement=$(echo "scale=2; (${original_size_mb} - ${optimized_size_mb}) / ${original_size_mb} * 100" | bc)
echo -e "${GREEN}📏 Image Size Reduction: ${size_improvement}%${NC}"
echo -e "   Original: ${original_image_size}"
echo -e "   Optimized: ${optimized_image_size}"

echo ""
echo -e "${BLUE}🔍 Layer Analysis${NC}"
echo "=================="

echo -e "${YELLOW}Original Dockerfile layers:${NC}"
docker history myappassistant-frontend:original --format "table {{.CreatedBy}}\t{{.Size}}" | head -5

echo ""
echo -e "${YELLOW}Optimized Dockerfile layers:${NC}"
docker history myappassistant-frontend:optimized --format "table {{.CreatedBy}}\t{{.Size}}" | head -5

echo ""
echo -e "${GREEN}🎉 Benchmark completed!${NC}"

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up test images...${NC}"
docker rmi myappassistant-frontend:original myappassistant-frontend:optimized

echo -e "${GREEN}✅ Cleanup completed${NC}" 