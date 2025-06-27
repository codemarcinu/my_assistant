# 🔧 API Reference - FoodSave AI

## 📋 Overview

The FoodSave AI API is a RESTful service built with FastAPI that provides endpoints for interacting with the multi-agent AI system. The API supports real-time chat, file uploads, RAG operations, weather data, concise responses, and system monitoring.

## 🔗 Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.foodsave-ai.com`

## 📚 API Versioning

The API uses URL-based versioning:
- **v1**: Legacy endpoints (deprecated)
- **v2**: Current stable endpoints (recommended)

## 🔐 Authentication

Currently, the API operates without authentication for development purposes. For production deployment, JWT-based authentication will be implemented.

## 📊 Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-12-21T10:30:00Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "error description"
    }
  },
  "timestamp": "2024-12-21T10:30:00Z"
}
```

## 🗣️ Chat API

### POST `/api/v1/chat`

Main endpoint for interacting with AI agents.

**Request Body:**
```json
{
  "message": "What can I cook with chicken and rice?",
  "session_id": "user_123_session_456",
  "context": {
    "user_preferences": {
      "diet": "vegetarian",
      "allergies": ["nuts", "shellfish"]
    },
    "available_ingredients": ["chicken", "rice", "onions"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "You can make a delicious chicken and rice stir-fry! Here's a recipe...",
    "agent_used": "chef_agent",
    "confidence": 0.95,
    "suggestions": [
      "Add vegetables for more nutrition",
      "Try using brown rice for better health benefits"
    ],
    "session_id": "user_123_session_456"
  },
  "message": "Response generated successfully"
}
```

### POST `/api/v2/chat/stream`

Streaming chat endpoint for real-time responses.

**Request Body:**
```json
{
  "message": "Tell me about sustainable cooking",
  "session_id": "user_123_session_456",
  "stream": true
}
```

**Response:** Server-Sent Events (SSE) stream

## 📝 Concise Response API

The Concise Response API provides Perplexity.ai-style response length control with map-reduce RAG processing.

### POST `/api/v2/concise/generate`

Generate concise responses with controlled length and style.

**Request Body:**
```json
{
  "query": "What is the weather today?",
  "style": "concise",
  "use_rag": true,
  "context": {
    "user_preferences": {
      "location": "Warsaw, Poland"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Sunny, 25°C with light breeze.",
    "style": "concise",
    "conciseness_score": 0.95,
    "stats": {
      "characters": 32,
      "words": 7,
      "sentences": 1
    },
    "metadata": {
      "processing_time": 1.23,
      "rag_used": true,
      "sources": ["weather_api", "local_forecast"]
    }
  },
  "message": "Concise response generated successfully"
}
```

### POST `/api/v2/concise/expand`

Expand a concise response with more details.

**Request Body:**
```json
{
  "concise_text": "Sunny, 25°C with light breeze.",
  "original_query": "What is the weather today?",
  "expansion_style": "detailed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expanded_response": "Today's weather in Warsaw is sunny with a temperature of 25°C (77°F). There's a light breeze from the northwest at 10 km/h. Humidity is at 45% and visibility is excellent at 10 km. Perfect weather for outdoor activities!",
    "original_concise": "Sunny, 25°C with light breeze.",
    "expansion_ratio": 4.2,
    "stats": {
      "characters": 245,
      "words": 42,
      "sentences": 3
    }
  },
  "message": "Response expanded successfully"
}
```

### GET `/api/v2/concise/analyze`

Analyze the conciseness of a given text.

**Query Parameters:**
- `text`: The text to analyze (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Sunny, 25°C with light breeze.",
    "conciseness_score": 0.95,
    "stats": {
      "characters": 32,
      "words": 7,
      "sentences": 1,
      "avg_words_per_sentence": 7.0
    },
    "recommendations": [
      "Text is very concise",
      "Good for quick information"
    ],
    "category": "very_concise"
  },
  "message": "Text analysis completed"
}
```

### GET `/api/v2/concise/config/{style}`

Get configuration for a specific response style.

**Path Parameters:**
- `style`: Response style (concise, standard, detailed)

**Response:**
```json
{
  "success": true,
  "data": {
    "style": "concise",
    "config": {
      "max_tokens": 60,
      "num_predict": 60,
      "temperature": 0.2,
      "max_characters": 200,
      "max_sentences": 2,
      "system_prompt_modifier": "Be very concise. Maximum 2 sentences."
    },
    "description": "Very brief responses for quick information"
  },
  "message": "Configuration retrieved successfully"
}
```

### GET `/api/v2/concise/agent/status`

Get the status of the concise response agent.

**Response:**
```json
{
  "success": true,
  "data": {
    "agent_name": "concise_response_agent",
    "status": "active",
    "model": "SpeakLeash/bielik-11b-v2.3-instruct:Q5_K_M",
    "capabilities": [
      "concise_generation",
      "response_expansion",
      "rag_processing",
      "conciseness_analysis"
    ],
    "metrics": {
      "requests_processed": 1250,
      "avg_response_time": 1.2,
      "success_rate": 0.98
    }
  },
  "message": "Agent status retrieved successfully"
}
```

## 📱 Telegram Bot API

The Telegram Bot API provides full integration with Telegram Bot API for real-time messaging with the AI assistant.

### POST `/api/v2/telegram/webhook`

Webhook endpoint for receiving Telegram updates.

**Headers:**
- `X-Telegram-Bot-Api-Secret-Token`: Secret token for webhook validation

**Request Body:** Telegram Update object
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "first_name": "John",
      "username": "john_doe"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "text": "Hello, how can you help me?",
    "date": 1640995200
  }
}
```

**Response:**
```json
{
  "status": "ok"
}
```

### POST `/api/v2/telegram/set-webhook`

Configure webhook URL for the Telegram bot.

**Request Body:**
```json
{
  "webhook_url": "https://your-domain.com/api/v2/telegram/webhook"
}
```

**Response:**
```json
{
  "status": "success",
  "webhook_url": "https://your-domain.com/api/v2/telegram/webhook"
}
```

### GET `/api/v2/telegram/webhook-info`

Get information about the current webhook configuration.

**Response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://your-domain.com/api/v2/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": null,
    "last_error_message": null,
    "max_connections": 40
  }
}
```

### POST `/api/v2/telegram/send-message`

Send a message through Telegram Bot API.

**Request Body:**
```json
{
  "chat_id": 123456789,
  "message": "Hello! I'm your AI assistant."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Message sent"
}
```

### GET `/api/v2/telegram/test-connection`

Test connection with Telegram Bot API.

**Response:**
```json
{
  "status": "success",
  "bot_info": {
    "id": 123456789,
    "is_bot": true,
    "first_name": "FoodSave AI Assistant",
    "username": "foodsave_ai_bot",
    "can_join_groups": false,
    "can_read_all_group_messages": false,
    "supports_inline_queries": false
  }
}
```

### GET `/api/v2/telegram/settings`

Get current Telegram bot settings.

**Response:**
```json
{
  "status": "success",
  "data": {
    "enabled": true,
    "bot_token": "***",
    "bot_username": "foodsave_ai_bot",
    "webhook_url": "https://your-domain.com/api/v2/telegram/webhook",
    "webhook_secret": "***",
    "max_message_length": 4096,
    "rate_limit_per_minute": 30
  }
}
```

### PUT `/api/v2/telegram/settings`

Update Telegram bot settings.

**Request Body:**
```json
{
  "enabled": true,
  "bot_token": "your_bot_token",
  "bot_username": "foodsave_ai_bot",
  "webhook_url": "https://your-domain.com/api/v2/telegram/webhook",
  "max_message_length": 4096,
  "rate_limit_per_minute": 30
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "enabled": true,
    "bot_token": "***",
    "bot_username": "foodsave_ai_bot",
    "webhook_url": "https://your-domain.com/api/v2/telegram/webhook",
    "webhook_secret": "***",
    "max_message_length": 4096,
    "rate_limit_per_minute": 30
  }
}
```

## 📤 File Upload API

### POST `/api/v2/upload/receipt`

Upload and process receipt images using OCR.

**Request:** Multipart form data
- `file`: Image file (JPEG, PNG, PDF)
- `session_id`: User session identifier
- `metadata`: Optional JSON metadata

**Response:**
```json
{
  "success": true,
  "data": {
    "receipt_id": "receipt_789",
    "extracted_data": {
      "store": "Walmart",
      "total": 45.67,
      "date": "2024-12-21",
      "items": [
        {
          "name": "Chicken Breast",
          "price": 12.99,
          "quantity": 1
        },
        {
          "name": "Brown Rice",
          "price": 3.49,
          "quantity": 2
        }
      ]
    },
    "confidence": 0.92,
    "processing_time": 1.23
  }
}
```

### POST `/api/v2/upload/document`

Upload documents for RAG processing.

**Request:** Multipart form data
- `file`: Document file (PDF, DOCX, TXT)
- `category`: Document category
- `tags`: Optional tags

**Response:**
```json
{
  "success": true,
  "data": {
    "document_id": "doc_456",
    "title": "Cooking Guide",
    "category": "recipes",
    "tags": ["cooking", "guide"],
    "processing_status": "completed",
    "vectorized": true
  }
}
```

## 🧠 RAG (Retrieval-Augmented Generation) API

### POST `/api/v2/rag/query`

Query the knowledge base using RAG.

**Request Body:**
```json
{
  "query": "How to make pasta carbonara?",
  "filters": {
    "category": "recipes",
    "tags": ["italian", "pasta"]
  },
  "max_results": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "How to make pasta carbonara?",
    "results": [
      {
        "document_id": "doc_123",
        "title": "Classic Carbonara Recipe",
        "content": "Ingredients: spaghetti, eggs, pancetta...",
        "relevance_score": 0.95,
        "source": "cooking_guide.pdf"
      }
    ],
    "generated_answer": "Here's how to make authentic pasta carbonara...",
    "sources": ["doc_123", "doc_456"]
  }
}
```

### GET `/api/v2/rag/documents`

List all documents in the knowledge base.

**Query Parameters:**
- `category`: Filter by category
- `tags`: Filter by tags (comma-separated)
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "document_id": "doc_123",
        "title": "Cooking Guide",
        "category": "recipes",
        "tags": ["cooking", "guide"],
        "upload_date": "2024-12-21T10:30:00Z",
        "size": 1024000
      }
    ],
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

### DELETE `/api/v2/rag/documents/{document_id}`

Delete a document from the knowledge base.

**Response:**
```json
{
  "success": true,
  "data": {
    "document_id": "doc_123",
    "deleted": true
  },
  "message": "Document deleted successfully"
}
```

## 🌤️ Weather API

### GET `/api/v2/weather/current`

Get current weather information.

**Query Parameters:**
- `location`: City name or coordinates
- `units`: `metric` or `imperial` (default: metric)

**Response:**
```json
{
  "success": true,
  "data": {
    "location": "Warsaw, Poland",
    "temperature": 15.5,
    "feels_like": 13.2,
    "humidity": 65,
    "description": "Partly cloudy",
    "icon": "02d",
    "timestamp": "2024-12-21T10:30:00Z"
  }
}
```

### GET `/api/v2/weather/forecast`

Get weather forecast.

**Query Parameters:**
- `location`: City name or coordinates
- `days`: Number of days (1-7, default: 5)
- `units`: `metric` or `imperial`

**Response:**
```json
{
  "success": true,
  "data": {
    "location": "Warsaw, Poland",
    "forecast": [
      {
        "date": "2024-12-22",
        "temperature": {
          "min": 8.5,
          "max": 16.2
        },
        "description": "Sunny",
        "icon": "01d"
      }
    ]
  }
}
```

## 💾 Backup API

### POST `/api/v2/backup/create`

Create a system backup.

**Request Body:**
```json
{
  "backup_type": "full",
  "description": "Weekly backup",
  "include_data": true,
  "include_config": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "backup_id": "backup_20241221_103000",
    "backup_type": "full",
    "size": 52428800,
    "created_at": "2024-12-21T10:30:00Z",
    "status": "completed"
  }
}
```

### GET `/api/v2/backup/list`

List all available backups.

**Response:**
```json
{
  "success": true,
  "data": {
    "backups": [
      {
        "backup_id": "backup_20241221_103000",
        "backup_type": "full",
        "size": 52428800,
        "created_at": "2024-12-21T10:30:00Z",
        "status": "completed"
      }
    ]
  }
}
```

### POST `/api/v2/backup/restore/{backup_id}`

Restore from a backup.

**Response:**
```json
{
  "success": true,
  "data": {
    "backup_id": "backup_20241221_103000",
    "restored": true,
    "restored_at": "2024-12-21T11:00:00Z"
  }
}
```

## 📊 Monitoring API

### GET `/health`

Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-21T10:30:00Z",
  "version": "2.0.0"
}
```

### GET `/ready`

Readiness check for Kubernetes deployments.

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": "healthy",
    "ollama": "healthy",
    "vector_store": "healthy"
  },
  "timestamp": "2024-12-21T10:30:00Z"
}
```

### GET `/metrics`

Prometheus metrics endpoint.

**Response:** Prometheus format metrics

### GET `/api/v1/status`

Detailed system status.

**Response:**
```json
{
  "success": true,
  "data": {
    "system": {
      "status": "healthy",
      "uptime": 86400,
      "version": "2.0.0"
    },
    "agents": {
      "chef_agent": "healthy",
      "weather_agent": "healthy",
      "ocr_agent": "healthy",
      "rag_agent": "healthy"
    },
    "services": {
      "database": "connected",
      "ollama": "running",
      "vector_store": "ready"
    },
    "performance": {
      "memory_usage": 1342177280,
      "cpu_usage": 15.5,
      "active_connections": 5
    }
  }
}
```

### GET `/api/v1/alerts`

Get active system alerts.

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "alert_id": "alert_123",
        "severity": "warning",
        "message": "High memory usage detected",
        "created_at": "2024-12-21T10:25:00Z",
        "resolved": false
      }
    ]
  }
}
```

## 🚨 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid request data | 400 |
| `AUTHENTICATION_ERROR` | Authentication required | 401 |
| `AUTHORIZATION_ERROR` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | 503 |

## ⚡ Rate Limiting

- **Chat API**: 100 requests per minute per session
- **Upload API**: 10 requests per minute per session
- **RAG API**: 50 requests per minute per session
- **Weather API**: 60 requests per minute per session

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640087400
```

## 📝 Examples

### Python Example

```python
import requests
import json

# Chat with AI
response = requests.post(
    "http://localhost:8000/api/v1/chat",
    json={
        "message": "What can I cook with chicken?",
        "session_id": "user_123"
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"AI Response: {data['data']['response']}")
```

### JavaScript Example

```javascript
// Chat with AI
const response = await fetch('http://localhost:8000/api/v1/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        message: 'What can I cook with chicken?',
        session_id: 'user_123'
    })
});

const data = await response.json();
console.log(`AI Response: ${data.data.response}`);
```

### cURL Example

```bash
# Chat with AI
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What can I cook with chicken?",
    "session_id": "user_123"
  }'

# Upload receipt
curl -X POST "http://localhost:8000/api/v2/upload/receipt" \
  -F "file=@receipt.jpg" \
  -F "session_id=user_123"
```

## 🔄 WebSocket Support

For real-time communication, WebSocket endpoints are available:

- `ws://localhost:8000/ws/chat` - Real-time chat
- `ws://localhost:8000/ws/status` - System status updates

## 📚 Additional Resources

- [Interactive API Documentation](http://localhost:8000/docs) - Swagger UI
- [Alternative Documentation](http://localhost:8000/redoc) - ReDoc
- [OpenAPI Schema](http://localhost:8000/openapi.json) - OpenAPI specification

---

**Last Updated**: 2025-06-25
**API Version**: 2.0.0

## Receipt Analysis Endpoints

### Upload Receipt Image

Upload a receipt image for OCR processing.

```http
POST /api/v2/receipts/upload
Content-Type: multipart/form-data
```

**Request Parameters:**
- `file` (required): Receipt image file (JPEG, PNG, PDF)

**Response:**
```json
{
  "status_code": 200,
  "message": "Receipt processed successfully",
  "data": {
    "text": "Extracted OCR text from receipt",
    "message": "Pomyślnie wyodrębniono tekst z pliku",
    "metadata": {
      "file_type": "image",
      "prompts_applied": true,
      "processing_time": 2.5
    }
  }
}
```

**Error Responses:**
- `400`: Invalid file format
- `422`: OCR processing failed
- `500`: Internal server error

### Analyze Receipt Text

Analyze extracted OCR text to extract structured data.

```http
POST /api/v2/receipts/analyze
Content-Type: application/x-www-form-urlencoded
```

**Request Parameters:**
- `ocr_text` (required): Extracted OCR text from receipt

**Response:**
```json
{
  "status_code": 200,
  "message": "Receipt analyzed successfully",
  "data": {
    "store_name": "BIEDRONKA",
    "normalized_store_name": "Biedronka",
    "store_chain": "Biedronka",
    "store_type": "discount_store",
    "store_confidence": 1.0,
    "store_normalization_method": "exact_match",
    "date": "2025-06-15 00:00",
    "items": [
      {
        "name": "Mleko 3.2% 1L",
        "normalized_name": "Mleko 3.2% 1L",
        "quantity": 1.0,
        "unit_price": 4.99,
        "total_price": 4.99,
        "category": "Nabiał > Mleko i śmietana",
        "category_en": "Dairy Products > Milk & Cream",
        "gpt_category": "Food, Beverages & Tobacco > Food Items > Dairy Products > Milk & Cream",
        "category_confidence": 0.9,
        "category_method": "bielik_ai"
      }
    ],
    "total_amount": 4.99,
    "discounts": [],
    "coupons": [],
    "vat_summary": [
      {
        "rate": 5,
        "amount": 0.24
      }
    ]
  }
}
```

### Data Structures

#### Store Information

```json
{
  "store_name": "string",           // Original store name from receipt
  "normalized_store_name": "string", // Normalized store name
  "store_chain": "string",          // Store chain name
  "store_type": "string",           // Type: discount_store, hypermarket, etc.
  "store_confidence": "float",      // Confidence score (0.0-1.0)
  "store_normalization_method": "string" // Method used: exact_match, partial_match, etc.
}
```

#### Product Item

```json
{
  "name": "string",                 // Original product name
  "normalized_name": "string",      // Normalized product name
  "quantity": "float",              // Quantity purchased
  "unit_price": "float",            // Price per unit
  "total_price": "float",           // Total price for this item
  "category": "string",             // Polish category path
  "category_en": "string",          // English category path
  "gpt_category": "string",         // Full Google Product Taxonomy path
  "category_confidence": "float",   // Categorization confidence (0.0-1.0)
  "category_method": "string"       // Method: bielik_ai, keyword_match, etc.
}
```

#### VAT Summary

```json
{
  "rate": "integer",                // VAT rate percentage
  "amount": "float"                 // VAT amount
}
```

## Chat Endpoints

### Send Message

Send a message to the AI assistant.

```http
POST /api/v2/chat/send
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "string",
  "context": "string",
  "user_id": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "message": "Message sent successfully",
  "data": {
    "response": "AI response text",
    "intent": "detected_intent",
    "confidence": 0.95
  }
}
```

### Get Chat History

Retrieve chat history for a user.

```http
GET /api/v2/chat/history?user_id={user_id}&limit={limit}
```

**Query Parameters:**
- `user_id` (required): User identifier
- `limit` (optional): Number of messages to retrieve (default: 50)

**Response:**
```json
{
  "status_code": 200,
  "data": {
    "messages": [
      {
        "id": "string",
        "user_id": "string",
        "message": "string",
        "response": "string",
        "timestamp": "2025-01-27T10:30:00Z",
        "intent": "string"
      }
    ]
  }
}
```

## Agent Management Endpoints

### List Available Agents

Get list of all available AI agents.

```http
GET /api/v2/agents/list
```

**Response:**
```json
{
  "status_code": 200,
  "data": {
    "agents": [
      {
        "name": "OCRAgent",
        "description": "Extracts text from receipt images",
        "status": "active",
        "capabilities": ["ocr", "text_extraction"]
      },
      {
        "name": "ReceiptAnalysisAgent",
        "description": "Analyzes receipt text and extracts structured data",
        "status": "active",
        "capabilities": ["analysis", "categorization", "normalization"]
      }
    ]
  }
}
```

### Get Agent Status

Get detailed status of a specific agent.

```http
GET /api/v2/agents/{agent_name}/status
```

**Response:**
```json
{
  "status_code": 200,
  "data": {
    "name": "ReceiptAnalysisAgent",
    "status": "active",
    "uptime": "2h 30m",
    "requests_processed": 150,
    "average_response_time": 1.2,
    "error_rate": 0.02
  }
}
```

## Backup Endpoints

### Create Backup

Create a system backup.

```http
POST /api/v2/backup/create
```

**Response:**
```json
{
  "status_code": 200,
  "message": "Backup created successfully",
  "data": {
    "backup_id": "backup_20250127_103000",
    "timestamp": "2025-01-27T10:30:00Z",
    "size": "150MB",
    "components": ["database", "files", "vector_store"]
  }
}
```

### List Backups

Get list of available backups.

```http
GET /api/v2/backup/list
```

**Response:**
```json
{
  "status_code": 200,
  "data": {
    "backups": [
      {
        "id": "backup_20250127_103000",
        "timestamp": "2025-01-27T10:30:00Z",
        "size": "150MB",
        "status": "completed"
      }
    ]
  }
}
```

### Restore Backup

Restore system from a backup.

```http
POST /api/v2/backup/restore/{backup_id}
```

**Response:**
```json
{
  "status_code": 200,
  "message": "Backup restored successfully",
  "data": {
    "restore_id": "restore_20250127_104500",
    "timestamp": "2025-01-27T10:45:00Z",
    "components_restored": ["database", "files", "vector_store"]
  }
}
```

## Error Responses

All endpoints return consistent error responses:

### Standard Error Format

```json
{
  "status_code": 400,
  "error": "ValidationError",
  "message": "Invalid request parameters",
  "details": {
    "field": "error description"
  }
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Unprocessable Entity
- `500`: Internal Server Error
- `503`: Service Unavailable

### Error Types

- `ValidationError`: Invalid request parameters
- `AuthenticationError`: Invalid or missing authentication
- `AuthorizationError`: Insufficient permissions
- `NotFoundError`: Resource not found
- `ProcessingError`: Error during processing
- `SystemError`: Internal system error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per minute
- **File upload endpoints**: 10 requests per minute
- **AI processing endpoints**: 20 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643270400
```

## WebSocket Endpoints

### Real-time Chat

Connect to real-time chat updates.

```http
WS /api/v2/chat/ws?user_id={user_id}
```

**Message Types:**

1. **Client to Server:**
```json
{
  "type": "message",
  "data": {
    "message": "Hello",
    "context": "general"
  }
}
```

2. **Server to Client:**
```json
{
  "type": "response",
  "data": {
    "response": "Hello! How can I help you?",
    "intent": "greeting"
  }
}
```

## SDK Examples

### Python SDK

```python
import requests

# Upload receipt
with open('receipt.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/api/v2/receipts/upload', files=files)
    ocr_text = response.json()['data']['text']

# Analyze receipt
data = {'ocr_text': ocr_text}
response = requests.post('http://localhost:8000/api/v2/receipts/analyze', data=data)
analysis = response.json()['data']
```

### JavaScript SDK

```javascript
// Upload receipt
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/v2/receipts/upload', {
  method: 'POST',
  body: formData
});

const { data: { text } } = await response.json();

// Analyze receipt
const analysisResponse = await fetch('/api/v2/receipts/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `ocr_text=${encodeURIComponent(text)}`
});

const analysis = await analysisResponse.json();
```

## Testing

### Test Endpoints

Use the test endpoints for development and testing:

```http
GET /api/v2/test/health
GET /api/v2/test/agents
POST /api/v2/test/ocr
```

### Postman Collection

Import the Postman collection for easy API testing:

```json
{
  "info": {
    "name": "MyAppAssistant API",
    "version": "2.0.0"
  },
  "item": [
    {
      "name": "Receipt Analysis",
      "item": [
        {
          "name": "Upload Receipt",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/v2/receipts/upload",
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "file",
                  "type": "file",
                  "src": []
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```
