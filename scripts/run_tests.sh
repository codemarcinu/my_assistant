#!/bin/bash

# Skrypt do uruchamiania testów MyAppAssistant
# Uruchom: ./scripts/run_tests.sh

set -e

echo "🧪 Uruchamianie testów MyAppAssistant..."

# Sprawdź czy jesteśmy w środowisku wirtualnym
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "❌ Nie jesteś w środowisku wirtualnym. Aktywuj środowisko i spróbuj ponownie."
    exit 1
fi

echo "✅ Środowisko wirtualne aktywne: $VIRTUAL_ENV"

# Instalacja/aktualizacja zależności
echo "📦 Instalacja zależności..."
pip install -r src/backend/requirements.txt

# Sprawdź czy Ollama jest uruchomiona
echo "🔍 Sprawdzanie Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⚠️  Ollama nie jest uruchomiona. Niektóre testy mogą nie przejść."
    echo "   Uruchom: ollama serve"
fi

# Uruchom walidację modeli
echo "🔍 Walidacja modeli Ollama..."
python -c "
import asyncio
import sys
sys.path.append('src')
from backend.core.model_validator import validate_ollama_models

async def main():
    results = await validate_ollama_models()
    available = sum(results.values())
    total = len(results)
    print(f'📊 Modele dostępne: {available}/{total}')
    if available == 0:
        print('❌ Brak dostępnych modeli! Uruchom: ./scripts/install_ollama_models.sh')
        return False
    return True

if not asyncio.run(main()):
    exit(1)
"

# Uruchom testy jednostkowe
echo "🧪 Uruchamianie testów jednostkowych..."
python -m pytest tests/unit/ -v --tb=short

# Uruchom testy integracyjne
echo "🔗 Uruchamianie testów integracyjnych..."
python -m pytest tests/integration/ -v --tb=short

# Uruchom testy wydajnościowe
echo "⚡ Uruchamianie testów wydajnościowych..."
python -m pytest tests/performance/ -v --tb=short

# Uruchom testy end-to-end
echo "🌐 Uruchamianie testów end-to-end..."
python -m pytest tests/e2e/ -v --tb=short

echo ""
echo "🎉 Wszystkie testy zakończone!"
echo ""
echo "📊 Podsumowanie:"
echo "   - Testy jednostkowe: ✅"
echo "   - Testy integracyjne: ✅"
echo "   - Testy wydajnościowe: ✅"
echo "   - Testy end-to-end: ✅" 