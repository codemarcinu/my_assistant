#!/bin/bash

# 🧠 Skrypt do uruchamiania testów E2E wszystkich modeli LLM
# Autor: AI Assistant
# Data: 26.06.2025

set -e  # Zatrzymaj na błędzie

echo "🚀 URUCHAMIANIE TESTÓW E2E MODELI LLM"
echo "====================================="
echo ""

# Sprawdź czy backend działa
echo "🔍 Sprawdzanie statusu backendu..."
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend nie odpowiada na http://localhost:8000/health"
    echo "   Uruchom backend: uvicorn src.backend.main:app --host 0.0.0.0 --port 8000"
    exit 1
fi
echo "✅ Backend działa poprawnie"

# Sprawdź czy Ollama działa
echo "🔍 Sprawdzanie statusu Ollama..."
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    echo "❌ Ollama nie odpowiada na http://localhost:11434"
    echo "   Uruchom Ollama: ollama serve"
    exit 1
fi
echo "✅ Ollama działa poprawnie"

# Utwórz katalog na logi jeśli nie istnieje
mkdir -p logs/llm_tests

# Funkcja do uruchamiania testu z monitoringiem GPU
run_test() {
    local model_name=$1
    local test_name=$2
    local log_file="logs/llm_tests/gpu_usage_${model_name}_$(date +%Y%m%d_%H%M%S).log"
    
    echo ""
    echo "🧪 TEST: $model_name"
    echo "📝 Nazwa testu: $test_name"
    echo "📊 Log GPU: $log_file"
    echo "⏱️  Rozpoczynam test..."
    
    # Uruchom test z monitoringiem GPU
    ./monitor_gpu_during_test.sh \
        "poetry run pytest src/backend/tests/test_gemma3_12b_e2e.py::TestGemma312BE2E::$test_name -v --tb=short" \
        "$log_file"
    
    # Sprawdź wynik testu
    if [ $? -eq 0 ]; then
        echo "✅ Test $model_name zakończony sukcesem"
    else
        echo "❌ Test $model_name zakończony błędem"
    fi
    
    echo "📊 Analiza logów GPU..."
    if [ -f "$log_file" ]; then
        echo "   Rozmiar logu: $(du -h "$log_file" | cut -f1)"
        echo "   Ostatnie linie:"
        tail -3 "$log_file" | sed 's/^/   /'
    fi
    
    echo "⏳ Czekam 30 sekund przed następnym testem..."
    sleep 30
}

# Uruchom testy sekwencyjnie
echo ""
echo "🎯 ROZPOCZYNAM TESTY SEKWENCYJNE"
echo "================================"

# Test 1: Bielik 11B Q4_K_M (model domyślny)
run_test "bielik_11b" "test_gemma3_food_knowledge"

# Test 2: Mistral 7B (model fallback)
run_test "mistral_7b" "test_gemma3_food_knowledge"

# Test 3: Gemma3 12B (model zaawansowany)
run_test "gemma3_12b" "test_gemma3_food_knowledge"

echo ""
echo "🎉 WSZYSTKIE TESTY ZAKOŃCZONE"
echo "============================="
echo ""

# Podsumowanie wyników
echo "📊 PODSUMOWANIE WYNIKÓW:"
echo "========================"

# Sprawdź pliki wyników
echo "📋 Pliki wyników JSON:"
ls -la test_results_*_$(date +%Y%m%d)*.json 2>/dev/null || echo "   Brak plików wyników"

echo ""
echo "📈 Pliki logów GPU:"
ls -la logs/llm_tests/gpu_usage_*_$(date +%Y%m%d)*.log 2>/dev/null || echo "   Brak plików logów"

echo ""
echo "🔍 Status systemu:"
echo "   Backend: $(curl -s http://localhost:8000/health | jq -r '.status' 2>/dev/null || echo 'N/A')"
echo "   Ollama: $(curl -s http://localhost:11434/api/version | jq -r '.version' 2>/dev/null || echo 'N/A')"

echo ""
echo "📝 Następne kroki:"
echo "   1. Sprawdź szczegółowy raport: RAPORT_E2E_MODELI_LLM.md"
echo "   2. Przeanalizuj logi GPU w katalogu logs/llm_tests/"
echo "   3. Sprawdź pliki wyników JSON"
echo "   4. Zaktualizuj dokumentację jeśli potrzeba"

echo ""
echo "✅ Testy E2E modeli LLM zakończone!" 