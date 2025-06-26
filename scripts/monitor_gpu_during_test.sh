#!/bin/bash

# 📊 AIASISSTMARUBO - Monitoring GPU podczas testów
# Ostatnia aktualizacja: 26.06.2025

set -e

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Sprawdzenie argumentów
if [ $# -lt 2 ]; then
    error "Użycie: $0 <komenda_testowa> <plik_logu>"
    echo ""
    echo "Przykłady:"
    echo "  $0 'pytest test_file.py' logs/gpu-monitoring/test.log"
    echo "  $0 'python script.py' logs/gpu-monitoring/script.log"
    exit 1
fi

COMMAND="$1"
LOG_FILE="$2"

# Sprawdzenie czy nvidia-smi jest dostępny
if ! command -v nvidia-smi &> /dev/null; then
    error "nvidia-smi nie jest dostępny. Sprawdź czy masz zainstalowane sterowniki NVIDIA."
    exit 1
fi

# Sprawdzenie czy GPU jest dostępny
if ! nvidia-smi &> /dev/null; then
    error "Nie można uzyskać dostępu do GPU NVIDIA"
    exit 1
fi

# Tworzenie katalogu dla logów jeśli nie istnieje
LOG_DIR=$(dirname "$LOG_FILE")
mkdir -p "$LOG_DIR"

log "🚀 Rozpoczynam monitoring GPU"
log "📝 Komenda: $COMMAND"
log "📁 Log: $LOG_FILE"

# Informacje o GPU
log "🔍 Informacje o GPU:"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits | while IFS=, read -r name memory driver; do
    info "   GPU: $name"
    info "   Pamięć: ${memory} MiB"
    info "   Sterownik: $driver"
done

# Uruchomienie monitoringu GPU w tle
log "📊 Uruchamiam monitoring GPU..."
nvidia-smi dmon -s pucvmet -d 1 > "$LOG_FILE" &
GPU_MONITOR_PID=$!

# Czekaj na uruchomienie monitoringu
sleep 2

# Sprawdź czy monitoring działa
if ! kill -0 $GPU_MONITOR_PID 2>/dev/null; then
    error "Nie udało się uruchomić monitoringu GPU"
    exit 1
fi

success "Monitoring GPU uruchomiony (PID: $GPU_MONITOR_PID)"

# Uruchomienie komendy testowej
log "🧪 Uruchamiam komendę testową..."
start_time=$(date +%s)

# Uruchom komendę w tle i zapisz PID
eval "$COMMAND" &
TEST_PID=$!

# Funkcja do czyszczenia
cleanup() {
    log "🧹 Czyszczenie zasobów..."
    
    # Zatrzymaj monitoring GPU
    if kill -0 $GPU_MONITOR_PID 2>/dev/null; then
        kill $GPU_MONITOR_PID 2>/dev/null || true
        log "📊 Monitoring GPU zatrzymany"
    fi
    
    # Zatrzymaj test jeśli nadal działa
    if kill -0 $TEST_PID 2>/dev/null; then
        kill $TEST_PID 2>/dev/null || true
        log "🧪 Test zatrzymany"
    fi
    
    exit 0
}

# Obsługa sygnałów
trap cleanup SIGINT SIGTERM

# Czekaj na zakończenie testu
wait $TEST_PID
TEST_EXIT_CODE=$?

end_time=$(date +%s)
duration=$((end_time - start_time))

# Zatrzymanie monitoringu GPU
kill $GPU_MONITOR_PID 2>/dev/null || true
sleep 1

# Analiza wyników
log "📊 Analizuję wyniki..."

if [ $TEST_EXIT_CODE -eq 0 ]; then
    success "✅ Test zakończony sukcesem (${duration}s)"
else
    error "❌ Test zakończony błędem (kod: $TEST_EXIT_CODE, czas: ${duration}s)"
fi

# Analiza logów GPU
if [ -f "$LOG_FILE" ]; then
    log "📈 Analiza wykorzystania GPU:"
    
    # Sprawdź czy plik nie jest pusty
    if [ ! -s "$LOG_FILE" ]; then
        warning "Plik logu GPU jest pusty"
    else
        # Wyciągnięcie statystyk
        total_lines=$(wc -l < "$LOG_FILE")
        log "   Łącznie pomiarów: $total_lines"
        
        # Maksymalne wykorzystanie pamięci
        max_memory=$(grep -v "gpu" "$LOG_FILE" | awk '{print $3}' | sort -nr | head -1)
        if [ -n "$max_memory" ] && [ "$max_memory" != "0" ]; then
            log "   💾 Maksymalne wykorzystanie pamięci: ${max_memory} MiB"
        fi
        
        # Średnie wykorzystanie pamięci
        avg_memory=$(grep -v "gpu" "$LOG_FILE" | awk '{sum+=$3; count++} END {if(count>0) printf "%.0f", sum/count; else print 0}')
        if [ -n "$avg_memory" ] && [ "$avg_memory" != "0" ]; then
            log "   📊 Średnie wykorzystanie pamięci: ${avg_memory} MiB"
        fi
        
        # Maksymalne wykorzystanie GPU
        max_utilization=$(grep -v "gpu" "$LOG_FILE" | awk '{print $4}' | sort -nr | head -1)
        if [ -n "$max_utilization" ] && [ "$max_utilization" != "0" ]; then
            log "   🔥 Maksymalne wykorzystanie GPU: ${max_utilization}%"
        fi
        
        # Średnie wykorzystanie GPU
        avg_utilization=$(grep -v "gpu" "$LOG_FILE" | awk '{sum+=$4; count++} END {if(count>0) printf "%.1f", sum/count; else print 0}')
        if [ -n "$avg_utilization" ] && [ "$avg_utilization" != "0.0" ]; then
            log "   📈 Średnie wykorzystanie GPU: ${avg_utilization}%"
        fi
        
        # Temperatura (jeśli dostępna)
        if grep -q "temp" "$LOG_FILE"; then
            max_temp=$(grep -v "gpu" "$LOG_FILE" | awk '{print $5}' | sort -nr | head -1)
            if [ -n "$max_temp" ] && [ "$max_temp" != "0" ]; then
                log "   🌡️  Maksymalna temperatura: ${max_temp}°C"
            fi
        fi
        
        # Rozmiar pliku logu
        file_size=$(du -h "$LOG_FILE" | cut -f1)
        log "   📁 Rozmiar pliku logu: $file_size"
    fi
else
    warning "Plik logu GPU nie został utworzony"
fi

# Podsumowanie
log "📋 PODSUMOWANIE"
log "==============="
log "Czas wykonania: ${duration}s"
log "Kod wyjścia: $TEST_EXIT_CODE"
log "Plik logu: $LOG_FILE"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    success "🎉 Monitoring zakończony sukcesem!"
else
    warning "⚠️  Test zakończony z błędem, ale monitoring został wykonany"
fi

log "🏁 Monitoring zakończony o $(date)" 