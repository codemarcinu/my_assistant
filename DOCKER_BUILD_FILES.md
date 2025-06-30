# 🐳 Docker Build Files & Commands Reference

## 📁 Critical Docker Files

### Backend Container
- **Dockerfile:** `src/backend/Dockerfile.prod`
- **Dev Dockerfile:** `src/backend/Dockerfile.dev`
- **Dependencies:** `pyproject.toml`, `poetry.lock`

### Frontend Container
- **Dockerfile:** `myappassistant-chat-frontend/Dockerfile.prod`
- **Optimized Dockerfile:** `myappassistant-chat-frontend/Dockerfile.prod.optimized`
- **Dependencies:** `myappassistant-chat-frontend/package.json`, `myappassistant-chat-frontend/package-lock.json`
- **Dockerignore:** `myappassistant-chat-frontend/.dockerignore`

### Docker Compose
- **Main compose:** `docker-compose.yml`
- **Optimized compose:** `docker-compose.optimized.yml`

## 🚀 Build Commands

### Quick Build (Backend Only)
```bash
# Build only backend (fastest for development)
docker compose build backend

# Restart backend only
docker compose up -d --no-deps backend
```

### Full Build (All Services)
```bash
# Build all containers
docker compose build

# Start all services
docker compose up -d
```

### Optimized Build Scripts
```bash
# Use optimized build script
./build-all-optimized.sh

# Benchmark builds
./myappassistant-chat-frontend/benchmark-docker-builds.sh
```

## 🔧 Critical Fixes Applied

### 1. EnhancedBackupManager Lazy Singleton
**File:** `src/backend/core/enhanced_backup_manager.py`
**Problem:** Global instantiation caused PermissionError during import
**Solution:** Implemented lazy singleton pattern
```python
def get_enhanced_backup_manager() -> EnhancedBackupManager:
    global _enhanced_backup_manager_instance
    if _enhanced_backup_manager_instance is None:
        _enhanced_backup_manager_instance = EnhancedBackupManager()
    return _enhanced_backup_manager_instance
```

### 2. Dockerfile Fixes
**File:** `src/backend/Dockerfile.prod`
**Fixes:**
- Removed invalid `--timeout` flag from `poetry install`
- Fixed casing warnings (`as` → `AS`)

### 3. API Import Fixes
**File:** `src/backend/api/v2/endpoints/enhanced_backup.py`
**Added imports:**
```python
from backend.auth.models import User
from backend.core.security_manager import security_manager
```

### 4. App Factory Cleanup
**File:** `src/backend/app_factory.py`
**Removed:** Problematic `src.api.v3` import that doesn't exist

### 5. Frontend Dependencies
**File:** `myappassistant-chat-frontend/Dockerfile.prod`
**Fix:** Removed `--only=production` to include devDependencies for build

## 📂 Host Directory Permissions

### Required Permissions (UID 999:999)
```bash
# Set permissions for host-mounted directories
sudo chown -R 999:999 backups/ logs/ data/ temp_uploads/
```

**Directories that need proper permissions:**
- `backups/` - Backup storage
- `logs/` - Application logs
- `data/` - Application data
- `temp_uploads/` - Temporary file uploads

## 🏥 Health Check Endpoints

### Backend Health
```bash
curl -f http://localhost:8000/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### Frontend Health
```bash
curl -f http://localhost:3000/api/health
# Expected: {"status":"healthy"}
```

## 🚨 Troubleshooting

### Permission Errors
```bash
# Check container user
docker exec aiasisstmarubo-backend-1 id foodsave

# Fix permissions
sudo chown -R 999:999 backups/ logs/ data/ temp_uploads/
```

### Build Cache Issues
```bash
# Clear build cache
docker builder prune -f

# Force rebuild
docker compose build --no-cache backend
```

### Container Status
```bash
# Check all containers
docker compose ps

# Check logs
docker compose logs backend --tail=50
```

## 📊 Build Optimization

### Layer Caching Strategy
1. **Dependencies first** - Copy package files before source code
2. **Multi-stage builds** - Separate build and runtime stages
3. **Cache mounts** - Use `--mount=type=cache` for npm/poetry
4. **Minimal layers** - Combine RUN commands where possible

### Performance Tips
- Use `.dockerignore` to exclude unnecessary files
- Build only changed services: `docker compose build backend`
- Use optimized Dockerfiles for production builds
- Monitor build times with benchmark scripts

## 🔄 Development Workflow

### Daily Development
```bash
# 1. Start services
docker compose up -d

# 2. Make code changes

# 3. Rebuild only changed service
docker compose build backend

# 4. Restart service
docker compose up -d --no-deps backend

# 5. Check health
curl -f http://localhost:8000/health
```

### Production Deployment
```bash
# 1. Build optimized images
./build-all-optimized.sh

# 2. Deploy with optimized compose
docker compose -f docker-compose.optimized.yml up -d

# 3. Verify deployment
docker compose ps
curl -f http://localhost:8000/health
```

## 📝 Notes

- **Backend UID:** 999 (foodsave user in container)
- **Frontend UID:** 1001 (nextjs user in container)
- **Critical files:** Always check permissions after git operations
- **Build time:** ~2-3 minutes for full rebuild, ~30 seconds for backend only
- **Cache efficiency:** 90%+ cache hit rate with proper layer ordering

---
*Last updated: 2025-06-30*
*Commit: 34502bb - Fix Docker container startup issues* 