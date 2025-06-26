# FoodSave AI - Docker Environment Setup

This document provides comprehensive instructions for setting up and running the FoodSave AI application using Docker containers.

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 8GB RAM (16GB recommended for LLM models)
- At least 20GB free disk space

### Automated Setup

Run the automated setup script:

```bash
./scripts/docker-setup.sh
```

This script will:
- Check Docker installation
- Create necessary directories
- Generate SSL certificates
- Create environment configuration
- Build Docker images (optional)
- Start services (optional)

### Manual Setup

If you prefer manual setup, follow these steps:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AIASISSTMARUBO
   ```

2. **Create directories**
   ```bash
   mkdir -p logs/{backend,frontend,postgres,redis,nginx,ollama}
   mkdir -p data/{vector_store,search_cache,config}
   mkdir -p nginx/ssl backups
   ```

3. **Generate SSL certificates**
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
       -keyout nginx/ssl/key.pem \
       -out nginx/ssl/cert.pem \
       -subj "/C=PL/ST=Warsaw/L=Warsaw/O=FoodSave/OU=IT/CN=localhost" \
       -addext "subjectAltName=DNS:localhost,DNS:foodsave.local,IP:127.0.0.1"
   ```

4. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Build and start services**
   ```bash
   docker-compose -f docker-compose.prod.yaml up -d
   ```

## 📁 Project Structure

```
AIASISSTMARUBO/
├── docker-compose.yaml          # Development configuration
├── docker-compose.prod.yaml     # Production configuration
├── src/backend/
│   ├── Dockerfile               # Development backend
│   └── Dockerfile.prod          # Production backend
├── foodsave-frontend/
│   ├── Dockerfile.dev           # Development frontend
│   ├── Dockerfile.prod          # Production frontend
│   └── nginx.conf               # Nginx configuration
├── nginx/
│   ├── proxy.conf               # Reverse proxy configuration
│   └── ssl/                     # SSL certificates
├── scripts/
│   ├── docker-setup.sh          # Setup script
│   └── init-db.sql              # Database initialization
└── .dockerignore                # Docker ignore rules
```

## 🐳 Docker Services

### Core Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80 | React/Vite application with Nginx |
| Backend | 8000 | FastAPI backend |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Caching and sessions |

### Optional Services

| Service | Port | Profile | Description |
|---------|------|---------|-------------|
| Ollama | 11434 | with-ollama | Local LLM models |
| Nginx Proxy | 80/443 | with-proxy | SSL termination |

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database Configuration
POSTGRES_DB=foodsave_prod
POSTGRES_USER=foodsave
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://foodsave:${POSTGRES_PASSWORD}@postgres:5432/foodsave_prod

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# LLM Configuration
OLLAMA_MODEL=gemma3:12b
DEFAULT_CHAT_MODEL=gemma3:12b
DEFAULT_CODE_MODEL=gemma3:12b
DEFAULT_EMBEDDING_MODEL=nomic-embed-text

# Application Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://frontend:80,https://foodsave.local

# Vector Store Configuration
RAG_VECTOR_STORE_PATH=/app/data/vector_store

# Frontend Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_TELEMETRY_DISABLED=1
```

## 🚀 Usage

### Development Mode

```bash
# Start development services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Mode

```bash
# Start production services
docker-compose -f docker-compose.prod.yaml up -d

# Start with Ollama (LLM models)
docker-compose -f docker-compose.prod.yaml --profile with-ollama up -d

# Start with reverse proxy
docker-compose -f docker-compose.prod.yaml --profile with-proxy up -d

# View logs
docker-compose -f docker-compose.prod.yaml logs -f

# Stop services
docker-compose -f docker-compose.prod.yaml down
```

### Building Images

```bash
# Build backend image
docker build -f src/backend/Dockerfile.prod -t foodsave-backend:latest .

# Build frontend image
docker build -f foodsave-frontend/Dockerfile.prod -t foodsave-frontend:latest ./foodsave-frontend

# Build all images
docker-compose -f docker-compose.prod.yaml build
```

## 📊 Monitoring

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose -f docker-compose.prod.yaml ps

# View health check logs
docker-compose -f docker-compose.prod.yaml logs backend | grep health
```

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yaml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yaml logs -f backend
docker-compose -f docker-compose.prod.yaml logs -f frontend

# View logs with timestamps
docker-compose -f docker-compose.prod.yaml logs -f -t
```

### Resource Usage

```bash
# Check resource usage
docker stats

# Check disk usage
docker system df
```

## 🔒 Security

### SSL/TLS Configuration

The production setup includes SSL certificates:

- Self-signed certificates for development
- Configure proper certificates for production
- HTTPS redirect enabled
- Security headers configured

### Security Headers

Nginx is configured with security headers:

- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy
- Content-Security-Policy

### Rate Limiting

API endpoints are protected with rate limiting:

- General requests: 30 requests/second
- API requests: 10 requests/second

## 🗄️ Database

### Initialization

The database is automatically initialized with:

- Required extensions (uuid-ossp, pg_trgm)
- Optimized PostgreSQL settings
- Proper user permissions

### Backup and Restore

```bash
# Create backup
docker exec foodsave-postgres-prod pg_dump -U foodsave foodsave_prod > backup.sql

# Restore backup
docker exec -i foodsave-postgres-prod psql -U foodsave foodsave_prod < backup.sql
```

### Migration

```bash
# Run migrations
docker exec foodsave-backend-prod alembic upgrade head

# Check migration status
docker exec foodsave-backend-prod alembic current
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Conflicts

If ports are already in use:

```bash
# Check what's using the port
sudo lsof -i :8000

# Stop conflicting service or change port in docker-compose.prod.yaml
```

#### 2. Permission Issues

```bash
# Fix directory permissions
sudo chown -R $USER:$USER logs data nginx/ssl backups

# Fix SSL certificate permissions
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem
```

#### 3. Database Connection Issues

```bash
# Check database status
docker-compose -f docker-compose.prod.yaml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yaml restart postgres
```

#### 4. Memory Issues

If you encounter memory issues with LLM models:

```bash
# Increase Docker memory limit
# Edit Docker Desktop settings or docker daemon configuration

# Or reduce model size in .env
OLLAMA_MODEL=gemma3:2b  # Use smaller model
```

### Debug Mode

Enable debug logging:

```bash
# Set debug level
export LOG_LEVEL=DEBUG

# Restart services
docker-compose -f docker-compose.prod.yaml restart
```

### Cleanup

```bash
# Remove all containers and volumes
docker-compose -f docker-compose.prod.yaml down -v

# Remove all images
docker rmi foodsave-backend:latest foodsave-frontend:latest

# Clean up unused resources
docker system prune -a
```

## 📈 Performance Optimization

### Resource Limits

Services are configured with resource limits:

- Backend: 2GB RAM, 1 CPU
- Frontend: 512MB RAM, 0.5 CPU
- PostgreSQL: 1GB RAM, 0.5 CPU
- Redis: 512MB RAM, 0.25 CPU
- Ollama: 4GB RAM, 2 CPU

### Scaling

To scale services:

```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yaml up -d --scale backend=3

# Scale frontend instances
docker-compose -f docker-compose.prod.yaml up -d --scale frontend=2
```

### Caching

Redis is configured for optimal caching:

- Max memory: 512MB
- Eviction policy: LRU
- Persistence enabled

## 🔄 Updates

### Updating Images

```bash
# Pull latest changes
git pull

# Rebuild images
docker-compose -f docker-compose.prod.yaml build --no-cache

# Restart services
docker-compose -f docker-compose.prod.yaml up -d
```

### Rolling Updates

```bash
# Update backend with zero downtime
docker-compose -f docker-compose.prod.yaml up -d --no-deps backend

# Update frontend
docker-compose -f docker-compose.prod.yaml up -d --no-deps frontend
```

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review logs: `docker-compose -f docker-compose.prod.yaml logs -f`
3. Check health status: `docker-compose -f docker-compose.prod.yaml ps`
4. Create an issue in the repository

## 📝 Changelog

### Version 1.0.0
- Initial Docker setup
- Production-ready configurations
- SSL/TLS support
- Health checks
- Resource limits
- Security headers
- Rate limiting
- Comprehensive documentation 