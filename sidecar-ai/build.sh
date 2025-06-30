#!/bin/bash

# Build script for FoodSave AI Agent Sidecar
echo "Building FoodSave AI Agent Sidecar..."

# Install dependencies
pip install -r requirements.txt
pip install pyinstaller

# Create executable
pyinstaller --onefile \
    --name ai-agent \
    --distpath ../myappassistant-chat-frontend/src-tauri/binaries \
    agent.py

echo "AI Agent sidecar built successfully!" 