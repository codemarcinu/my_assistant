# Changelog

## [Unreleased] - 2025-06-30

### Added
- **Promotion Monitoring System**: Complete implementation of automated promotion tracking
  - New PromotionsMonitor component with real-time dashboard
  - Automated promotion scraping agent for data collection
  - Sidecar services for AI processing and web scraping
  - Tauri integration for desktop application features
  - Polish language support for promotion monitoring UI
  - Client-side rendering with React hooks compatibility

### Fixed
- **Docker Setup**: Resolved multiple container startup issues
  - Fixed container name conflicts by removing stale containers
  - Resolved frontend dependency conflicts with React 19 using `--legacy-peer-deps`
  - Fixed Next.js standalone build configuration for Docker compatibility
  - Resolved backend uvicorn and celery missing executables with fallback installations
  - Fixed Docker network configuration conflicts
  - Resolved port conflicts with local PostgreSQL service
- **Frontend**: Fixed client component directive for React hooks in PromotionsMonitor

### Changed
- **Frontend**: Updated Dockerfile.prod to use `--legacy-peer-deps` for npm install
- **Backend**: Modified Dockerfile.prod to include fallback package installations
- **Next.js**: Added `output: 'standalone'` configuration for Docker builds
- **Docker Compose**: Removed obsolete `version` field

### Technical Details
- **Frontend**: React 19 compatibility with @testing-library/react@14.2.1
- **Backend**: Poetry dependency resolution issues resolved with fallback installations
- **Infrastructure**: All services now start successfully with proper health checks

### Services Status
All services are now running successfully:
- ✅ Backend (FastAPI) - Port 8000
- ✅ Frontend (Next.js) - Port 3000
- ✅ PostgreSQL - Port 5432
- ✅ Redis - Port 6379
- ✅ Ollama (LLM) - Port 11434
- ✅ Celery Worker - Background processing
- ✅ Celery Beat - Task scheduling

---

## Previous Versions

*Documentation of previous changes will be added here as the project evolves.* 