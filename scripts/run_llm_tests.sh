#!/bin/bash

# 🧠 AIASISSTMARUBO - Testy modeli LLM z monitoringiem GPU
# Ostatnia aktualizacja: 26.06.2025

set -e

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcja logowania
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Sprawdzenie czy jesteśmy w katalogu głównym projektu
if [ ! -f "pyproject.toml" ]; then
    error "Uruchom skrypt z katalogu głównego projektu AIASISSTMARUBO"
    exit 1
fi

# Konfiguracja
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="logs/gpu-monitoring"
RESULTS_DIR="test-results"
SCRIPTS_DIR="scripts"

# Tworzenie katalogów jeśli nie istnieją
mkdir -p "$LOG_DIR"
mkdir -p "$RESULTS_DIR"

log "🚀 Rozpoczynam testy modeli LLM z monitoringiem GPU"
log "📁 Logi: $LOG_DIR"
log "📁 Wyniki: $RESULTS_DIR"

# Sprawdzenie czy Ollama jest uruchomiony
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    error "Ollama nie jest uruchomiony. Uruchom: ollama serve"
    exit 1
fi

success "Ollama jest dostępny"

# Lista modeli do przetestowania (w kolejności preferencji)
MODELS=(
    "bielik:11b-q4_k_m"  # Model domyślny (polski)
    "mistral:7b"         # Model fallback
    "gemma3:12b"         # Model zaawansowany
)

# Funkcja testowania pojedynczego modelu
test_model() {
    local model=$1
    local model_name=$(echo $model | sed 's/:/_/g')
    local log_file="$LOG_DIR/gpu_usage_${model_name}_${TIMESTAMP}.log"
    
    log "🧠 Testuję model: $model"
    
    # Uruchomienie monitoringu GPU w tle
    log "📊 Uruchamiam monitoring GPU..."
    nvidia-smi dmon -s pucvmet -d 1 > "$log_file" &
    GPU_MONITOR_PID=$!
    
    # Czekaj na uruchomienie monitoringu
    sleep 2
    
    # Uruchomienie testu
    log "🧪 Uruchamiam test E2E dla $model..."
    start_time=$(date +%s)
    
    if poetry run python -m pytest src/backend/tests/test_gemma3_12b_e2e.py::TestGemma312BE2E::test_gemma3_food_knowledge -v; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        success "✅ Test $model zakończony sukcesem (${duration}s)"
    else
        error "❌ Test $model zakończony błędem"
        return 1
    fi
    
    # Zatrzymanie monitoringu GPU
    kill $GPU_MONITOR_PID 2>/dev/null || true
    sleep 1
    
    # Analiza logów GPU
    if [ -f "$log_file" ]; then
        log "📊 Analizuję wykorzystanie GPU dla $model..."
        
        # Wyciągnięcie maksymalnego wykorzystania pamięci
        max_memory=$(grep -v "gpu" "$log_file" | awk '{print $3}' | sort -nr | head -1)
        if [ -n "$max_memory" ]; then
            log "💾 Maksymalne wykorzystanie GPU: ${max_memory} MiB"
        fi
        
        # Wyciągnięcie średniego wykorzystania
        avg_utilization=$(grep -v "gpu" "$log_file" | awk '{sum+=$4; count++} END {if(count>0) print sum/count; else print 0}')
        if [ -n "$avg_utilization" ]; then
            log "📈 Średnie wykorzystanie GPU: ${avg_utilization}%"
        fi
    fi
    
    return 0
}

# Główna pętla testów
total_tests=${#MODELS[@]}
current_test=1
successful_tests=0

for model in "${MODELS[@]}"; do
    log "📋 Test $current_test/$total_tests: $model"
    
    if test_model "$model"; then
        success "✅ Model $model przeszedł test"
        ((successful_tests++))
    else
        error "❌ Model $model nie przeszedł testu"
    fi
    
    ((current_test++))
    
    # Przerwa między testami
    if [ $current_test -le $total_tests ]; then
        log "⏳ Czekam 10 sekund przed następnym testem..."
        sleep 10
    fi
done

# Podsumowanie
log "📊 PODSUMOWANIE TESTOW"
log "======================"
log "Łącznie modeli: $total_tests"
log "Przeszło: $successful_tests"
log "Nie przeszło: $((total_tests - successful_tests))"

if [ $successful_tests -eq $total_tests ]; then
    success "🎉 WSZYSTKIE TESTY PRZESZŁY!"
    log "📁 Logi GPU: $LOG_DIR"
    log "📁 Wyniki testów: $RESULTS_DIR"
    
    # Wyświetlenie plików wyników
    log "📋 Pliki wyników z dzisiejszego dnia:"
    ls -la "$RESULTS_DIR"/test_results_*_$(date +%Y%m%d)*.json 2>/dev/null || echo "   Brak plików wyników"
    
    # Wyświetlenie logów GPU
    log "📊 Logi monitoring GPU z dzisiejszego dnia:"
    ls -la "$LOG_DIR"/gpu_usage_*_$(date +%Y%m%d)*.log 2>/dev/null || echo "   Brak plików logów"
    
else
    warning "⚠️  Nie wszystkie testy przeszły"
    log "Sprawdź logi w katalogu: $LOG_DIR"
fi

log "🏁 Testy zakończone o $(date)" 