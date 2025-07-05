FROM python:3.11-slim

# Install system dependencies including tesseract-ocr and build essentials
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-pol \
    build-essential \
    swig \
    git \
    libopenblas-dev \
    libblas-dev \
    liblapack-dev \
    gfortran \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files
COPY requirements.txt /app/

# Install Python dependencies with WebSocket support
RUN pip install --retries 3 --timeout 300 -r requirements.txt && \
    pip install "uvicorn[standard]>=0.24.0" && \
    pip install websockets>=12.0

# Copy backend code
COPY . /app/backend

# Set environment variables
ENV PYTHONPATH=/app

# Expose port 8000
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
