#!/bin/bash

# Uruchom backend (docker)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null; then
  echo "Port 8000 jest zajęty! Backend nie zostanie uruchomiony."
else
  echo "Uruchamiam backend (docker)..."
  docker start foodsave-backend-dev || docker restart foodsave-backend-dev
fi

# Uruchom frontend na porcie 3000 w tle
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
  echo "Port 3000 jest zajęty! Frontend nie zostanie uruchomiony."
else
  echo "Uruchamiam frontend na porcie 3000..."
  cd "$(dirname "$0")/myappassistant-chat-frontend"
  nohup npm run dev > frontend.log 2>&1 &
  cd -
fi 