#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Optimizing FoodSave AI for RTX 3060${NC}"
echo "======================================"

# Check if NVIDIA GPU is available
if ! command -v nvidia-smi &> /dev/null; then
    echo -e "${RED}❌ NVIDIA GPU not detected${NC}"
    exit 1
fi

# Get GPU info
GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits)
echo -e "${GREEN}✅ GPU detected: $GPU_INFO${NC}"

# Check if it's RTX 3060
if echo "$GPU_INFO" | grep -q "RTX 3060"; then
    echo -e "${GREEN}✅ RTX 3060 confirmed - applying optimizations${NC}"
else
    echo -e "${YELLOW}⚠️  Different GPU detected - optimizations may need adjustment${NC}"
fi

# Set optimal environment variables
export CUDA_VISIBLE_DEVICES=0
export CUDA_LAUNCH_BLOCKING=0
export TORCH_CUDA_ARCH_LIST=8.6
export CUDA_MEMORY_FRACTION=0.8
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
export CUDA_MEMORY_POOL_SIZE=1073741824

# Optimize Docker settings
echo -e "${BLUE}📦 Optimizing Docker settings...${NC}"

# Create optimized docker-compose override
cat > docker-compose.rtx3060.override.yml << EOF
version: '3.8'

services:
  ollama:
    environment:
      - OLLAMA_NUM_PARALLEL=6
      - OLLAMA_NUM_GPU=1
      - OLLAMA_GPU_LAYERS=35
      - OLLAMA_CPU_LAYERS=10
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
        limits:
          memory: 8G
          cpus: '2.0'

  backend:
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - CUDA_MEMORY_FRACTION=0.8
      - PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '1.5'
        reservations:
          memory: 2G
          cpus: '0.5'

  postgres:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

  redis:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.25'
EOF

echo -e "${GREEN}✅ Docker override file created${NC}"

# Optimize system settings
echo -e "${BLUE}⚙️  Optimizing system settings...${NC}"

# Check and set swappiness
CURRENT_SWAPPINESS=$(cat /proc/sys/vm/swappiness)
if [ "$CURRENT_SWAPPINESS" -gt 10 ]; then
    echo -e "${YELLOW}⚠️  Current swappiness: $CURRENT_SWAPPINESS (recommended: 10)${NC}"
    echo "To optimize, run: sudo sysctl vm.swappiness=10"
fi

# Check available memory
TOTAL_MEM=$(free -g | awk 'NR==2{print $2}')
if [ "$TOTAL_MEM" -ge 32 ]; then
    echo -e "${GREEN}✅ Sufficient RAM: ${TOTAL_MEM}GB${NC}"
else
    echo -e "${YELLOW}⚠️  Limited RAM: ${TOTAL_MEM}GB${NC}"
fi

# Create performance monitoring script
cat > scripts/monitor_rtx3060.sh << 'EOF'
#!/bin/bash

echo "=== RTX 3060 Performance Monitor ==="
echo "GPU Usage:"
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader

echo ""
echo "System Memory:"
free -h

echo ""
echo "Docker Containers:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
EOF

chmod +x scripts/monitor_rtx3060.sh

echo -e "${GREEN}✅ Performance monitor script created${NC}"

# Create startup script with optimizations
cat > scripts/start_optimized.sh << 'EOF'
#!/bin/bash

# Set optimal environment variables for RTX 3060
export CUDA_VISIBLE_DEVICES=0
export CUDA_LAUNCH_BLOCKING=0
export TORCH_CUDA_ARCH_LIST=8.6
export CUDA_MEMORY_FRACTION=0.8
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
export CUDA_MEMORY_POOL_SIZE=1073741824

# Start with optimized settings
docker-compose -f docker-compose.yaml -f docker-compose.rtx3060.override.yml up -d

echo "🚀 FoodSave AI started with RTX 3060 optimizations"
echo "📊 Monitor performance: ./scripts/monitor_rtx3060.sh"
EOF

chmod +x scripts/start_optimized.sh

echo -e "${GREEN}✅ Optimized startup script created${NC}"

echo ""
echo -e "${GREEN}🎉 RTX 3060 optimization complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Start optimized system:"
echo "   ./scripts/start_optimized.sh"
echo ""
echo "2. Monitor performance:"
echo "   ./scripts/monitor_rtx3060.sh"
echo ""
echo "3. Check GPU usage:"
echo "   nvidia-smi"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- Keep GPU drivers updated"
echo "- Monitor VRAM usage (max ~10GB for Bielik-11B)"
echo "- Use Q5_K_M quantization for larger models"
echo "- Enable GPU acceleration in Ollama settings" 