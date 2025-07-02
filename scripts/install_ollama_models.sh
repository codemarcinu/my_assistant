#!/bin/bash

# Skrypt do instalacji modeli Ollama dla MyAppAssistant
# Uruchom: ./scripts/install_ollama_models.sh

set -e

echo "🚀 Instalacja modeli Ollama dla MyAppAssistant..."

# Sprawdź czy Ollama jest uruchomiona
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama nie jest uruchomiona. Uruchom Ollama i spróbuj ponownie."
    exit 1
fi

echo "✅ Ollama jest uruchomiona"

# Lista modeli do zainstalowania (w kolejności preferencji)
MODELS=(
    "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"
    "SpeakLeash/bielik-11b-v2.3-instruct:Q5_K_M"
    "gemma3:12b"
    "gemma3:8b"
    "llama3.2:3b"
    "mistral:7b"
    "nomic-embed-text"
)

# Instalacja modeli
for model in "${MODELS[@]}"; do
    echo "📥 Instalacja modelu: $model"
    
    # Sprawdź czy model już istnieje
    if ollama list | grep -q "$model"; then
        echo "✅ Model $model już zainstalowany"
    else
        echo "⏳ Pobieranie modelu $model..."
        if ollama pull "$model"; then
            echo "✅ Model $model zainstalowany pomyślnie"
        else
            echo "❌ Błąd podczas instalacji modelu $model"
        fi
    fi
done

echo ""
echo "🎉 Instalacja modeli zakończona!"
echo ""
echo "Zainstalowane modele:"
ollama list

echo ""
echo "📋 Następne kroki:"
echo "1. Uruchom testy: python -m pytest tests/ -v"
echo "2. Sprawdź logi: tail -f logs/backend/backend.log"
echo "3. Uruchom aplikację: python -m uvicorn src.backend.main:app --reload" 