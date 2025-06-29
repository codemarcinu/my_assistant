#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅${NC} $message" ;;
        "error") echo -e "${RED}❌${NC} $message" ;;
        "warning") echo -e "${YELLOW}⚠️${NC} $message" ;;
        "info") echo -e "${BLUE}ℹ️${NC} $message" ;;
    esac
}

echo -e "${BLUE}🧪 Testing Tauri Setup for FoodSave AI${NC}"
echo "======================================"

# Store original directory
ORIGINAL_DIR=$(pwd)

# Check if we're in the right directory
if [ ! -f "myappassistant-chat-frontend/package.json" ]; then
    print_status "error" "Not in the correct directory. Please run from project root."
    exit 1
fi

cd myappassistant-chat-frontend
FRONTEND_DIR=$(pwd)

print_status "info" "Working directory: $FRONTEND_DIR"

# Check Node.js and npm
echo ""
print_status "info" "Checking Node.js environment..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "success" "Node.js found: $NODE_VERSION"
else
    print_status "error" "Node.js not found. Please install Node.js 18+"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "success" "npm found: $NPM_VERSION"
else
    print_status "error" "npm not found. Please install npm"
    exit 1
fi

# Check and install dependencies
echo ""
print_status "info" "Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -d "node_modules/@tauri-apps" ]; then
    print_status "warning" "Tauri dependencies not found. Installing..."
    if npm install; then
        print_status "success" "Dependencies installed successfully"
    else
        print_status "error" "Failed to install dependencies"
        exit 1
    fi
else
    print_status "success" "Tauri dependencies found"
fi

# Check Tauri CLI
echo ""
print_status "info" "Checking Tauri CLI..."
if npx tauri --version &> /dev/null; then
    TAURI_VERSION=$(npx tauri --version)
    print_status "success" "Tauri CLI found: $TAURI_VERSION"
else
    print_status "warning" "Tauri CLI not found. Installing..."
    if npm install -g @tauri-apps/cli; then
        print_status "success" "Tauri CLI installed"
    else
        print_status "error" "Failed to install Tauri CLI"
        exit 1
    fi
fi

# Check Tauri configuration files
echo ""
print_status "info" "Checking Tauri configuration..."
TAURI_FILES=("src-tauri/Cargo.toml" "src-tauri/tauri.conf.json" "src-tauri/src/main.rs")
for file in "${TAURI_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "success" "Found: $file"
    else
        print_status "error" "Missing: $file"
        exit 1
    fi
done

# Check Rust toolchain
echo ""
print_status "info" "Checking Rust toolchain..."
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version)
    print_status "success" "Cargo found: $CARGO_VERSION"
    
    # Check Rust version
    RUST_VERSION=$(rustc --version | cut -d' ' -f2)
    print_status "success" "Rust version: $RUST_VERSION"
else
    print_status "error" "Cargo not found. Please install Rust: https://rustup.rs/"
    print_status "info" "Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check system dependencies for Linux
echo ""
print_status "info" "Checking system dependencies..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    DEPS=("libwebkit2gtk-4.0-dev" "libgtk-3-dev" "libayatana-appindicator3-dev" "libssl-dev")
    MISSING_DEPS=()
    
    for dep in "${DEPS[@]}"; do
        if dpkg -l | grep -q "$dep"; then
            print_status "success" "$dep installed"
        else
            print_status "warning" "$dep not found"
            MISSING_DEPS+=("$dep")
        fi
    done
    
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        echo ""
        print_status "warning" "Missing system dependencies detected:"
        for dep in "${MISSING_DEPS[@]}"; do
            echo "   - $dep"
        done
        echo ""
        print_status "info" "To install missing dependencies, run:"
        echo "   sudo apt update && sudo apt install ${MISSING_DEPS[*]}"
        echo ""
        read -p "Do you want to install missing dependencies now? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if sudo apt update && sudo apt install -y "${MISSING_DEPS[@]}"; then
                print_status "success" "System dependencies installed successfully"
            else
                print_status "error" "Failed to install system dependencies"
            fi
        fi
    fi
else
    print_status "info" "System dependency check skipped (not Linux)"
fi

# Check if Tauri can build
echo ""
print_status "info" "Testing Tauri build capability..."
cd src-tauri
if cargo check --quiet; then
    print_status "success" "Rust project compiles successfully"
else
    print_status "error" "Rust project has compilation errors"
    cd "$FRONTEND_DIR"
    exit 1
fi
cd "$FRONTEND_DIR"

# Check package.json scripts
echo ""
print_status "info" "Checking package.json scripts..."
REQUIRED_SCRIPTS=("tauri:dev" "tauri:build")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if npm run --silent "$script" --help &> /dev/null; then
        print_status "success" "Script available: $script"
    else
        print_status "warning" "Script not found: $script"
    fi
done

# Check for common issues
echo ""
print_status "info" "Running additional checks..."

# Check if .next directory exists (Next.js build)
if [ -d ".next" ]; then
    print_status "success" "Next.js build directory found"
else
    print_status "warning" "Next.js build directory not found (run 'npm run build' first)"
fi

# Check for TypeScript configuration
if [ -f "tsconfig.json" ]; then
    print_status "success" "TypeScript configuration found"
else
    print_status "warning" "TypeScript configuration not found"
fi

# Check for environment variables
if [ -f ".env.local" ] || [ -f ".env" ]; then
    print_status "success" "Environment configuration found"
else
    print_status "info" "No environment file found (create .env.local if needed)"
fi

echo ""
echo -e "${GREEN}🚀 Setup verification complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Start development server:"
echo "   cd myappassistant-chat-frontend"
echo "   npm run tauri:dev"
echo ""
echo "2. Build for production:"
echo "   npm run tauri:build"
echo ""
echo "3. Run tests:"
echo "   npm test"
echo "   npm run test:e2e"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "   npm run dev          # Next.js dev server only"
echo "   npm run build        # Next.js build only"
echo "   npm run lint         # Run ESLint"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "   - Tauri: https://tauri.app/docs"
echo "   - Next.js: https://nextjs.org/docs"
echo "   - Project docs: docs/TAURI_IMPLEMENTATION_GUIDE.md"

# Return to original directory
cd "$ORIGINAL_DIR" 