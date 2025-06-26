# Docker Build Troubleshooting Guide

## Problem: Timeout podczas instalacji zależności

### Przyczyna
PyTorch i inne duże pakiety ML mogą przekraczać domyślne limity czasu podczas instalacji w Docker.

### Rozwiązania

#### 1. Użyj pip zamiast poetry (ZALECANE)

```bash
# Użyj nowego Dockerfile z pip
docker build -f src/backend/Dockerfile.pip -t foodsave-backend .

# Lub użyj skryptu
./scripts/build_backend.sh -m pip
```

#### 2. Zwiększ timeout dla poetry

```bash
# Użyj zmodyfikowanego Dockerfile z retry mechanism
docker build -f src/backend/Dockerfile.prod -t foodsave-backend .

# Lub użyj skryptu z większym timeout
./scripts/build_backend.sh -m poetry -t 3600
```

#### 3. Szybki build dla testów

```bash
# Użyj minimalnych zależności
./scripts/build_backend.sh -m fast
```

#### 4. Clean build

```bash
# Wyczyść cache Docker
./scripts/build_backend.sh -m pip -c
```

## Dostępne tryby budowania

### pip (ZALECANE)
- Używa `requirements.txt` zamiast `pyproject.toml`
- Bardziej niezawodny dla dużych pakietów
- Szybszy build

### poetry
- Używa Poetry z retry mechanism
- Dłuższy build, ale zachowuje lock file
- Dobre dla development

### fast
- Minimalne zależności
- Szybki build dla testów
- Brak ciężkich pakietów ML

## Zmienne środowiskowe

```bash
# Ustaw timeout dla pip
export PIP_TIMEOUT=1800

# Ustaw retry dla pip
export PIP_RETRIES=5

# Włącz BuildKit
export DOCKER_BUILDKIT=1
```

## Rozwiązywanie problemów

### Problem: "Read timed out"
```bash
# Rozwiązanie: Zwiększ timeout
./scripts/build_backend.sh -m pip -t 3600
```

### Problem: "Connection reset by peer"
```bash
# Rozwiązanie: Clean build
./scripts/build_backend.sh -m pip -c
```

### Problem: "No space left on device"
```bash
# Rozwiązanie: Wyczyść Docker
docker system prune -a
docker builder prune
```

### Problem: "Permission denied"
```bash
# Rozwiązanie: Sprawdź uprawnienia
chmod +x scripts/build_backend.sh
```

## Optymalizacja

### 1. Użyj .dockerignore
```dockerfile
# Dodaj do .dockerignore
node_modules/
__pycache__/
*.pyc
.git/
.env
```

### 2. Multi-stage builds
```dockerfile
# Użyj multi-stage dla mniejszych obrazów
FROM python:3.12-slim as builder
# ... build dependencies

FROM python:3.12-slim as production
# ... copy only runtime files
```

### 3. Layer caching
```dockerfile
# Kopiuj requirements przed kodem
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
```

## Monitoring

### Sprawdź rozmiar obrazu
```bash
docker images foodsave-backend --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Sprawdź warstwy
```bash
docker history foodsave-backend:latest
```

### Analiza obrazu
```bash
docker run --rm -it foodsave-backend:latest du -sh /usr/local/lib/python3.12/site-packages
```

## Najlepsze praktyki

1. **Używaj pip dla production** - bardziej niezawodny
2. **Zwiększ timeout** - minimum 1800s dla dużych pakietów
3. **Używaj retry mechanism** - automatyczne ponowne próby
4. **Clean build** - gdy występują problemy z cache
5. **Monitoruj rozmiar** - unikaj niepotrzebnych pakietów

## Przykłady użycia

```bash
# Standardowy build
./scripts/build_backend.sh

# Build z większym timeout
./scripts/build_backend.sh -t 3600

# Clean build dla production
./scripts/build_backend.sh -m pip -c

# Szybki build dla testów
./scripts/build_backend.sh -m fast

# Build z poetry (development)
./scripts/build_backend.sh -m poetry -t 3600
``` 