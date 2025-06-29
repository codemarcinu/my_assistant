#!/bin/bash

echo "🧪 Testing Tauri Setup for FoodSave AI"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "myappassistant-chat-frontend/package.json" ]; then
    echo "❌ Error: Not in the correct directory. Please run from project root."
    exit 1
fi

cd myappassistant-chat-frontend

echo "📦 Checking dependencies..."
if [ ! -d "node_modules/@tauri-apps" ]; then
    echo "❌ Tauri dependencies not found. Installing..."
    npm install
else
    echo "✅ Tauri dependencies found"
fi

echo "🔧 Checking Tauri configuration..."
if [ ! -f "src-tauri/Cargo.toml" ]; then
    echo "❌ Tauri Cargo.toml not found"
    exit 1
else
    echo "✅ Tauri Cargo.toml found"
fi

if [ ! -f "src-tauri/tauri.conf.json" ]; then
    echo "❌ Tauri config not found"
    exit 1
else
    echo "✅ Tauri config found"
fi

if [ ! -f "src-tauri/src/main.rs" ]; then
    echo "❌ Tauri main.rs not found"
    exit 1
else
    echo "✅ Tauri main.rs found"
fi

echo "🔍 Checking Rust toolchain..."
if command -v cargo &> /dev/null; then
    echo "✅ Cargo found: $(cargo --version)"
else
    echo "❌ Cargo not found. Please install Rust: https://rustup.rs/"
    exit 1
fi

echo "🔍 Checking system dependencies..."
DEPS=("libwebkit2gtk-4.0-dev" "libgtk-3-dev" "libayatana-appindicator3-dev")
for dep in "${DEPS[@]}"; do
    if dpkg -l | grep -q "$dep"; then
        echo "✅ $dep installed"
    else
        echo "⚠️  $dep not found. You may need to install it:"
        echo "   sudo apt install $dep"
    fi
done

echo ""
echo "🚀 Setup verification complete!"
echo ""
echo "To start development:"
echo "  cd myappassistant-chat-frontend"
echo "  npm run tauri dev"
echo ""
echo "To build for production:"
echo "  npm run tauri build"
echo ""
echo "📚 See TAURI_IMPLEMENTATION_GUIDE.md for detailed documentation" 