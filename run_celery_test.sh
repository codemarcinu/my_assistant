#!/bin/bash
# Script to run minimal Celery test with proper setup and cleanup.
# This helps isolate serialization issues from the main project.

set -e

echo "🚀 Setting up minimal Celery test environment..."
echo "=================================================="

# Check if Redis is running
if ! docker ps | grep -q redis; then
    echo "❌ Redis container not found. Starting Redis..."
    docker run -d --name test-redis -p 6379:6379 redis:7-alpine
    sleep 3
else
    echo "✅ Redis container found"
fi

# Clear Redis
echo "🧹 Clearing Redis cache..."
docker exec test-redis redis-cli FLUSHALL || echo "Warning: Could not clear Redis"

# Start Celery worker in background
echo "🔧 Starting Celery worker..."
celery -A test_celery_minimal worker --loglevel=info --detach

# Wait for worker to start
echo "⏳ Waiting for worker to start..."
sleep 5

# Run the test
echo "🧪 Running Celery serialization test..."
python test_celery_minimal.py

# Cleanup
echo "🧹 Cleaning up..."
celery -A test_celery_minimal control shutdown || true
docker stop test-redis || true
docker rm test-redis || true

echo "✅ Test completed!" 