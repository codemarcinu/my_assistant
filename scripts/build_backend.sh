#!/bin/bash

# FoodSave AI Backend Build Script
# This script provides multiple build strategies for the backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -m, --mode MODE        Build mode (pip|poetry|fast)"
    echo "  -t, --timeout SECONDS  Timeout for package installation (default: 1800)"
    echo "  -r, --retries NUM      Number of retry attempts (default: 3)"
    echo "  -c, --clean           Clean build (no cache)"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Build modes:"
    echo "  pip      - Use pip-based Dockerfile (recommended for production)"
    echo "  poetry   - Use poetry-based Dockerfile with retries"
    echo "  fast     - Use minimal dependencies for quick testing"
    echo ""
    echo "Examples:"
    echo "  $0 -m pip                    # Build with pip (recommended)"
    echo "  $0 -m poetry -t 3600        # Build with poetry and 1-hour timeout"
    echo "  $0 -m fast -c               # Fast build with clean cache"
}

# Default values
MODE="pip"
TIMEOUT=1800
RETRIES=3
CLEAN_BUILD=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            MODE="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -r|--retries)
            RETRIES="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate mode
case $MODE in
    pip|poetry|fast)
        ;;
    *)
        print_error "Invalid mode: $MODE"
        show_usage
        exit 1
        ;;
esac

print_status "Starting backend build with mode: $MODE"

# Set Dockerfile based on mode
case $MODE in
    pip)
        DOCKERFILE="src/backend/Dockerfile.pip"
        print_status "Using pip-based Dockerfile for reliable builds"
        ;;
    poetry)
        DOCKERFILE="src/backend/Dockerfile.prod"
        print_status "Using poetry-based Dockerfile with retry mechanism"
        ;;
    fast)
        DOCKERFILE="src/backend/Dockerfile.fast"
        print_status "Using fast Dockerfile with minimal dependencies"
        ;;
esac

# Check if Dockerfile exists
if [[ ! -f "$DOCKERFILE" ]]; then
    print_error "Dockerfile not found: $DOCKERFILE"
    exit 1
fi

# Build arguments
BUILD_ARGS=""
if [[ "$CLEAN_BUILD" == "true" ]]; then
    BUILD_ARGS="--no-cache"
    print_status "Building with clean cache"
fi

# Set environment variables for build
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Build command
BUILD_CMD="docker build $BUILD_ARGS -f $DOCKERFILE -t foodsave-backend:$MODE ."

print_status "Executing: $BUILD_CMD"
print_status "Timeout: ${TIMEOUT}s, Retries: $RETRIES"

# Execute build with timeout
if timeout $TIMEOUT bash -c "$BUILD_CMD"; then
    print_success "Backend build completed successfully!"
    print_status "Image tagged as: foodsave-backend:$MODE"
    
    # Show image info
    print_status "Image details:"
    docker images foodsave-backend:$MODE --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
else
    print_error "Build failed or timed out after ${TIMEOUT}s"
    print_warning "Consider trying:"
    print_warning "  - Increase timeout: $0 -m $MODE -t 3600"
    print_warning "  - Use different mode: $0 -m pip"
    print_warning "  - Clean build: $0 -m $MODE -c"
    exit 1
fi

print_success "Build script completed!" 