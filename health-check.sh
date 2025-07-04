#!/bin/bash

# Health Check Script for FoodSave AI
# Comprehensive health monitoring following .cursorrules standards
# Version: 2025-07-02

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 FoodSave AI - Health Check${NC}"
echo "================================================"

# Function to check Docker status
check_docker() {
    echo -e "${PURPLE}🔍 Checking Docker status...${NC}"
    
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Docker is running${NC}"
    return 0
}

# Function to check container status
check_containers() {
    echo -e "${PURPLE}🐳 Checking container status...${NC}"
    
    local containers=(
        "aiasisstmarubo-backend-1:8000"
        "aiasisstmarubo-frontend-1:3000"
        "aiasisstmarubo-postgres-1:5432"
        "aiasisstmarubo-redis-1:6379"
        "aiasisstmarubo-ollama-1:11434"
        "aiasisstmarubo-celery_worker-1:8000"
        "aiasisstmarubo-celery_beat-1:8000"
    )
    
    for container in "${containers[@]}"; do
        IFS=':' read -r name port <<< "$container"
        
        if docker ps --format "{{.Names}}" | grep -q "$name"; then
            local status=$(docker ps --format "{{.Status}}" --filter "name=$name")
            if [[ $status == *"Up"* ]]; then
                echo -e "${GREEN}✅ $name is running ($status)${NC}"
            else
                echo -e "${YELLOW}⚠️  $name is not healthy ($status)${NC}"
            fi
        else
            echo -e "${RED}❌ $name is not running${NC}"
        fi
    done
}

# Function to check API endpoints
check_api_endpoints() {
    echo -e "${PURPLE}🌐 Checking API endpoints...${NC}"
    
    local endpoints=(
        "http://localhost:8001/health:Backend Health"
        "http://localhost:3003/:Frontend"
        "http://localhost:11434/api/version:Ollama API"
    )
    
    for endpoint in "${endpoints[@]}"; do
        IFS=':' read -r url name <<< "$endpoint"
        
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is responding${NC}"
        else
            echo -e "${RED}❌ $name is not responding${NC}"
        fi
    done
}

# Function to check database connectivity
check_database() {
    echo -e "${PURPLE}🗄️  Checking database connectivity...${NC}"
    
    if docker exec aiasisstmarubo-postgres-1 pg_isready -U foodsave_user -d foodsave_ai > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not ready${NC}"
    fi
    
    if docker exec aiasisstmarubo-redis-1 redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is responding${NC}"
    else
        echo -e "${RED}❌ Redis is not responding${NC}"
    fi
}

# Function to check resource usage
check_resources() {
    echo -e "${PURPLE}📊 Checking resource usage...${NC}"
    
    echo -e "${BLUE}Container Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    
    echo -e "${BLUE}Disk Usage:${NC}"
    df -h | grep -E "(Filesystem|/dev/)"
}

# Function to check logs for errors
check_logs() {
    echo -e "${PURPLE}📝 Checking recent logs for errors...${NC}"
    
    local services=("backend" "frontend" "postgres" "redis" "ollama")
    
    for service in "${services[@]}"; do
        echo -e "${BLUE}Recent errors in $service:${NC}"
        docker compose logs --tail=10 "$service" 2>/dev/null | grep -i "error\|exception\|failed" || echo "No recent errors found"
        echo ""
    done
}

# Function to check port conflicts
check_ports() {
    echo -e "${PURPLE}🔌 Checking port conflicts...${NC}"
    
    local ports=(8000 8001 3000 3003 5432 6379 6380 11434)
    
    for port in "${ports[@]}"; do
        if netstat -tulpn 2>/dev/null | grep -q ":$port "; then
            local process=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}')
            echo -e "${GREEN}✅ Port $port is in use by: $process${NC}"
        else
            echo -e "${YELLOW}⚠️  Port $port is not in use${NC}"
        fi
    done
}

# Function to check Ollama models
check_ollama_models() {
    echo -e "${PURPLE}🤖 Checking Ollama models...${NC}"
    
    if curl -f -s "http://localhost:11434/api/tags" > /dev/null 2>&1; then
        local models=$(curl -s "http://localhost:11434/api/tags" | jq -r '.models[].name' 2>/dev/null || echo "No models found")
        if [ -n "$models" ]; then
            echo -e "${GREEN}✅ Available models:${NC}"
            echo "$models" | while read -r model; do
                echo "   - $model"
            done
        else
            echo -e "${YELLOW}⚠️  No models found in Ollama${NC}"
        fi
    else
        echo -e "${RED}❌ Cannot connect to Ollama API${NC}"
    fi
}

# Function to generate health report
generate_report() {
    echo -e "${BLUE}📋 Generating health report...${NC}"
    
    local report_file="health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "FoodSave AI Health Report"
        echo "Generated: $(date)"
        echo "========================================"
        echo ""
        echo "Docker Status:"
        docker info 2>&1 | head -10
        echo ""
        echo "Container Status:"
        docker compose ps
        echo ""
        echo "Resource Usage:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        echo ""
        echo "Recent Logs:"
        docker compose logs --tail=20
    } > "$report_file"
    
    echo -e "${GREEN}✅ Health report saved to: $report_file${NC}"
}

# Main function
main() {
    echo -e "${BLUE}🔧 Starting comprehensive health check...${NC}"
    echo ""
    
    # Check Docker
    if ! check_docker; then
        echo -e "${RED}❌ Cannot proceed without Docker${NC}"
        exit 1
    fi
    
    # Check containers
    check_containers
    echo ""
    
    # Check API endpoints
    check_api_endpoints
    echo ""
    
    # Check database
    check_database
    echo ""
    
    # Check ports
    check_ports
    echo ""
    
    # Check Ollama models
    check_ollama_models
    echo ""
    
    # Check resources
    check_resources
    echo ""
    
    # Check logs
    check_logs
    echo ""
    
    # Generate report
    generate_report
    
    echo ""
    echo -e "${GREEN}🎉 Health check completed!${NC}"
    echo -e "${YELLOW}💡 If you see issues, try:${NC}"
    echo "   - docker compose restart"
    echo "   - ./cleanup-and-restart.sh"
    echo "   - Check logs: docker compose logs -f"
}

# Error handling
trap 'echo -e "${RED}❌ Health check failed!${NC}"; exit 1' ERR

# Run main function
main "$@" 