# Bielik-4.5B Primary Model Configuration

## 🎯 Overview

This document describes the complete configuration of **Bielik-4.5B** as the primary AI model for the FoodSave AI system. All configuration files have been updated to use `SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0` as the default model.

## 📋 Configuration Summary

### ✅ Updated Files

#### Environment Configuration
- `env.dev` - Development environment variables
- `env.dev.example` - Example environment file
- `docker-compose.yaml` - Main Docker Compose
- `docker-compose.dev.yaml` - Development Docker Compose
- `docker-compose.prod.yaml` - Production Docker Compose

#### Backend Configuration
- `src/backend/settings.py` - Backend settings
- `src/backend/core/model_selector.py` - Model selection logic
- `src/backend/core/hybrid_llm_client.py` - LLM client configuration
- `src/backend/agents/agent_builder.py` - Agent builder defaults
- `src/backend/agents/general_conversation_agent.py` - Conversation agent

#### Frontend Configuration
- `myappassistant-chat-frontend/src/stores/settingsStore.ts` - Frontend settings

#### Scripts
- `run_all.sh` - Main run script
- `scripts/dev-setup.sh` - Development setup
- `scripts/preload_models.py` - Model preloading
- `scripts/start_ollama.sh` - Ollama startup
- `scripts/rebuild-with-models.sh` - Docker rebuild
- `scripts/docker-setup.sh` - Docker setup
- `scripts/foodsave-manager.sh` - Manager script

#### Configuration Files
- `data/config/llm_settings.json` - LLM settings with Bielik-4.5B as primary

## 🔧 Model Configuration Details

### Primary Model: Bielik-4.5B
```json
{
  "selected_model": "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0",
  "fallback_model": "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0",
  "polish_model": "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"
}
```

### Model Priority Order
1. **Bielik-4.5B** - Primary model for all tasks
2. **Bielik-11B** - Fallback for complex tasks
3. **Gemma3:12B** - Only for image analysis tasks
4. **Other models** - Additional fallbacks

### Environment Variables
```bash
OLLAMA_MODEL=SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0
DEFAULT_CHAT_MODEL=SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0
DEFAULT_CODE_MODEL=SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0
```

## 🚀 Model Selection Logic

### Updated Model Selector
The `ModelSelector` class now prioritizes Bielik-4.5B for:
- Polish language queries (95% confidence)
- English language queries (85% confidence)
- Most task types (TEXT_ONLY, CREATIVE, RAG, STRUCTURED_OUTPUT)
- Code generation (80% capability)

### Hybrid LLM Client
The `HybridLLMClient` now:
- Uses Bielik-4.5B as the primary model (priority 1)
- Uses Bielik-11B as secondary (priority 2)
- Uses Gemma3:12B only for image analysis (priority 3)
- Increased concurrency limit for Bielik-4.5B (6 concurrent requests)

## 📊 Performance Expectations

### Bielik-4.5B Performance
- **Loading Time**: 20-40 seconds
- **Response Time**: 1-3 seconds (simple), 3-8 seconds (complex)
- **Memory Usage**: ~6GB VRAM
- **Language Support**: Polish (95%), English (85%), German/French/Spanish (75%)

### Model Comparison
| Model | VRAM | Speed | Polish Quality | English Quality | Image Support |
|-------|------|-------|----------------|-----------------|---------------|
| Bielik-4.5B | ~6GB | Fast | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ |
| Bielik-11B | ~10GB | Medium | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ |
| Gemma3:12B | ~8GB | Fast | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |

## 🔍 Verification

### Run Configuration Check
```bash
./scripts/verify_bielik_config.sh
```

This script will verify that all configuration files are properly set to use Bielik-4.5B as the primary model.

### Manual Verification
1. **Check Environment Variables**:
   ```bash
   grep "OLLAMA_MODEL" env.dev
   ```

2. **Check Docker Configuration**:
   ```bash
   grep "OLLAMA_MODEL" docker-compose.yaml
   ```

3. **Check Backend Settings**:
   ```bash
   grep "bielik-4.5b" src/backend/settings.py
   ```

4. **Check Model Availability**:
   ```bash
   ollama list | grep bielik
   ```

## 🚀 Getting Started

### 1. Pull the Model
```bash
ollama pull SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0
```

### 2. Start the System
```bash
# Use optimized startup
./scripts/start_optimized.sh

# Or standard startup
./scripts/foodsave.sh start
```

### 3. Verify Model Selection
```bash
# Check which model is being used
curl -X POST http://localhost:8000/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Cześć, jak się masz?"}'
```

## 🔧 Troubleshooting

### Model Not Loading
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama
sudo systemctl restart ollama

# Pull model again
ollama pull SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0
```

### Wrong Model Selected
1. Check environment variables are loaded
2. Restart the backend service
3. Verify model selector configuration
4. Check logs for model selection decisions

### Performance Issues
1. Ensure GPU is available and configured
2. Check VRAM usage: `nvidia-smi`
3. Monitor model loading times
4. Adjust concurrency limits if needed

## 📈 Monitoring

### Model Usage Metrics
The system tracks:
- Model selection frequency
- Response times per model
- Error rates per model
- Language detection accuracy

### Health Checks
```bash
# Check model availability
curl http://localhost:8000/health

# Check model status
curl http://localhost:8000/api/v2/agents/list
```

## 🎯 Benefits of Bielik-4.5B

### For Polish Users
- **Native Polish Support**: 95% confidence for Polish queries
- **Cultural Context**: Better understanding of Polish culture and context
- **Local Knowledge**: Familiar with Polish products, stores, and customs

### For All Users
- **Fast Response**: 1-3 seconds for simple queries
- **Efficient Resource Usage**: 6GB VRAM vs 8-10GB for alternatives
- **Reliable Performance**: Stable and consistent responses
- **Good English Support**: 85% confidence for English queries

### For Developers
- **Simplified Configuration**: Single primary model for most tasks
- **Predictable Behavior**: Consistent model selection logic
- **Easy Maintenance**: Fewer model dependencies
- **Better Testing**: Focused testing on primary model

## 🔄 Migration Notes

### From Gemma3:12B
- Bielik-4.5B is now the default for all text-based tasks
- Gemma3:12B is reserved for image analysis only
- No changes needed for existing code - model selection is automatic

### From Bielik-11B
- Bielik-4.5B is faster and more efficient
- Bielik-11B is still available as a fallback for complex tasks
- Automatic fallback when Bielik-4.5B cannot handle the task

## 📚 Additional Resources

- [Bielik Model Documentation](https://huggingface.co/SpeakLeash/bielik-4.5b-v3.0-instruct)
- [Ollama Model Management](https://ollama.ai/library)
- [Hardware Optimization Guide](docs/HARDWARE_OPTIMIZATION_GUIDE.md)
- [Model Selection Logic](src/backend/core/model_selector.py) 