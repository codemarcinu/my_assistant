#!/bin/bash

# Skrypt do automatycznego monitorowania GPU podczas testów E2E
# Użycie: ./monitor_gpu_during_test.sh <polecenie_testu> <plik_logu_gpu>

TEST_CMD="$1"
GPU_LOG="$2"

if [ -z "$TEST_CMD" ] || [ -z "$GPU_LOG" ]; then
  echo "Użycie: $0 '<polecenie_testu>' <plik_logu_gpu>"
  echo "Przykład: $0 'OLLAMA_URL=http://localhost:11434 PYTHONPATH=src python -m pytest src/backend/tests/test_real_llm_e2e.py -v -s' gpu_usage.log"
  exit 1
fi

# Uruchom testy w tle
bash -c "$TEST_CMD" &
TEST_PID=$!

# Monitoruj GPU co sekundę do pliku
while kill -0 $TEST_PID 2>/dev/null; do
  echo "--- $(date) ---" >> "$GPU_LOG"
  nvidia-smi >> "$GPU_LOG"
  sleep 1
done

echo "Test zakończony. Log GPU zapisany w $GPU_LOG" 