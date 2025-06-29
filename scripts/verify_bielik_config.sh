#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying Bielik-4.5B Configuration${NC}"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "data/config/llm_settings.json" ]; then
    echo -e "${RED}❌ Not in the correct directory. Please run from project root.${NC}"
    exit 1
fi

# Function to check if a file contains the expected model
check_model_in_file() {
    local file="$1"
    local expected_model="$2"
    local description="$3"
    
    if [ -f "$file" ]; then
        if grep -q "$expected_model" "$file"; then
            echo -e "${GREEN}✅ $description: OK${NC}"
            return 0
        else
            echo -e "${RED}❌ $description: NOT FOUND${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  $description: FILE NOT FOUND${NC}"
        return 1
    fi
}

echo ""
echo -e "${BLUE}📋 Checking Configuration Files${NC}"

# Check llm_settings.json
check_model_in_file "data/config/llm_settings.json" "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0" "LLM Settings - Bielik-4.5B as selected_model"

# Check environment files
check_model_in_file "env.dev" "OLLAMA_MODEL=SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0" "Environment - OLLAMA_MODEL"
check_model_in_file "env.dev" "DEFAULT_CHAT_MODEL=SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0" "Environment - DEFAULT_CHAT_MODEL"

# Check Docker Compose files
check_model_in_file "docker-compose.yaml" "OLLAMA_MODEL.*SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0" "Docker Compose - OLLAMA_MODEL"

echo ""
echo -e "${BLUE}🔧 Checking Backend Configuration${NC}"

# Check backend settings
check_model_in_file "src/backend/settings.py" "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0" "Backend Settings - OLLAMA_MODEL"
check_model_in_file "src/backend/core/model_selector.py" "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0" "Model Selector - DEFAULT_POLISH_MODEL"

echo ""
echo -e "${BLUE}🎨 Checking Frontend Configuration${NC}"

# Check frontend settings
check_model_in_file "myappassistant-chat-frontend/src/stores/settingsStore.ts" "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0" "Frontend Settings - default model"

echo ""
echo -e "${BLUE}📜 Checking Scripts${NC}"

# Check scripts
check_model_in_file "run_all.sh" "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0" "Run All Script - OLLAMA_MODEL"

echo ""
echo -e "${BLUE}🤖 Checking Ollama Models${NC}"

# Check if Ollama is running and has the model
if command -v ollama &> /dev/null; then
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        if ollama list | grep -q "bielik-4.5b-v3.0-instruct"; then
            echo -e "${GREEN}✅ Ollama - Bielik-4.5B model available${NC}"
        else
            echo -e "${YELLOW}⚠️  Ollama - Bielik-4.5B model not found${NC}"
            echo "   Run: ollama pull SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"
        fi
    else
        echo -e "${YELLOW}⚠️  Ollama - Service not running${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Ollama - Not installed${NC}"
fi

echo ""
echo -e "${BLUE}📊 Summary${NC}"
echo "======================================"
echo -e "${GREEN}✅ Configuration verification complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. If any checks failed, review the configuration files"
echo "2. Pull the Bielik-4.5B model:"
echo "   ollama pull SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"
echo "3. Restart the application:"
echo "   ./scripts/start_optimized.sh"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- Bielik-4.5B is now the primary model for all tasks"
echo "- Gemma3:12b will be used only for image analysis tasks"
echo "- The model selector will automatically choose the best model"
echo "- Check logs for model selection decisions" 