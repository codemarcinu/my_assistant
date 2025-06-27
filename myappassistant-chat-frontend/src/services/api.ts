// ✅ REQUIRED: API service for backend communication
import axios from 'axios';
import type {
  AxiosInstance,
  AxiosResponse
} from 'axios';
import type {
  ApiResponse,
  ChatMessage,
  FoodItem,
  ReceiptData,
  WeatherData,
  UserSettings,
  AgentStatus,
  PaginatedResponse,
  SearchParams,
  ShoppingItem
} from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication and logging
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.debug('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
    });
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.debug('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// Chat API endpoints - using real backend endpoints
export const chatAPI = {
  // Send message to AI assistant
  sendMessage: async (message: string, context?: any): Promise<ApiResponse<ChatMessage>> => {
    const response = await apiClient.post('/api/chat/chat', {
      message,
      context,
    });
    return response.data;
  },

  // Get chat history
  getHistory: async (limit: number = 50): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await apiClient.get(`/api/chat/memory_chat?limit=${limit}`);
    return response.data;
  },

  // Clear chat history
  clearHistory: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete('/api/chat/memory_chat');
    return response.data;
  },

  // Test simple chat
  testSimpleChat: async (message: string): Promise<ApiResponse<ChatMessage>> => {
    const response = await apiClient.post('/api/chat/test_simple_chat', { message });
    return response.data;
  },

  // Get suggested actions based on context
  getSuggestedActions: async (context: any): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.post('/api/agents/process_query', { context });
    return response.data;
  },
};

// Export sendChatMessage function for use in chatStore
export const sendChatMessage = async ({ content, role }: { content: string; role: string }): Promise<{ content: string; role: string }> => {
  try {
    const response = await chatAPI.sendMessage(content);
    // Convert ChatMessage to the format expected by chatStore
    const chatMessage = response.data || response;
    return {
      content: chatMessage.content || content,
      role: chatMessage.type || role
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// Food and pantry API endpoints - using real backend endpoints
export const foodAPI = {
  // Get all food items
  getFoodItems: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<FoodItem>>> => {
    const response = await apiClient.get('/api/pantry/pantry/products', { params });
    return response.data;
  },

  // Get food item by ID
  getFoodItem: async (id: string): Promise<ApiResponse<FoodItem>> => {
    const response = await apiClient.get(`/api/food/products/${id}`);
    return response.data;
  },

  // Create new food item
  createFoodItem: async (item: Omit<FoodItem, 'id' | 'addedDate'>): Promise<ApiResponse<FoodItem>> => {
    const response = await apiClient.post('/api/pantry/pantry/products', item);
    return response.data;
  },

  // Update food item
  updateFoodItem: async (id: string, updates: Partial<FoodItem>): Promise<ApiResponse<FoodItem>> => {
    const response = await apiClient.put(`/api/food/products/${id}`, updates);
    return response.data;
  },

  // Delete food item
  deleteFoodItem: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/food/products/${id}`);
    return response.data;
  },

  // Get expiring items
  getExpiringItems: async (days: number = 7): Promise<ApiResponse<FoodItem[]>> => {
    const response = await apiClient.get(`/api/pantry/pantry/products?expiring_days=${days}`);
    return response.data;
  },
};

// OCR and receipt API endpoints - using real backend endpoints
export const receiptAPI = {
  // Upload receipt image
  uploadReceipt: async (file: File): Promise<ApiResponse<ReceiptData>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/v2/receipts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Process receipt with OCR
  processReceipt: async (file: File): Promise<ApiResponse<ReceiptData>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/v2/receipts/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Map backend response to frontend expected format
    const backendData = response.data.data;
    const mappedData: ReceiptData = {
      id: `receipt_${Date.now()}`,
      items: backendData.analysis?.items?.map((item: any) => ({
        name: item.name,
        price: item.total_price,
        quantity: item.quantity,
        category: item.category as any
      })) || [],
      total: backendData.analysis?.total_amount || 0,
      store: backendData.analysis?.store_name || 'Nieznany sklep',
      date: new Date(backendData.analysis?.date || Date.now()),
      imageUrl: '',
      status: 'completed' as any,
      ocr_text: backendData.ocr_text
    };
    
    return {
      data: mappedData,
      status: 'success',
      message: response.data.message,
      timestamp: new Date().toISOString()
    };
  },

  // Analyze receipt data
  analyzeReceipt: async (receiptData: any): Promise<ApiResponse<ReceiptData>> => {
    const response = await apiClient.post('/api/v2/receipts/analyze', receiptData);
    return response.data;
  },

  // Save receipt data
  saveReceipt: async (receiptData: any): Promise<ApiResponse<ReceiptData>> => {
    const response = await apiClient.post('/api/v2/receipts/save', receiptData);
    return response.data;
  },

  // Get receipt by ID
  getReceipt: async (id: string): Promise<ApiResponse<ReceiptData>> => {
    const response = await apiClient.get(`/api/food/shopping-trips/${id}`);
    return response.data;
  },

  // Get all receipts
  getReceipts: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<ReceiptData>>> => {
    const response = await apiClient.get('/api/food/shopping-trips/', { params });
    return response.data;
  },

  // Verify receipt items
  verifyReceipt: async (id: string, items: any[]): Promise<ApiResponse<ReceiptData>> => {
    const response = await apiClient.post(`/api/food/shopping-trips/${id}/verify`, { items });
    return response.data;
  },
};

// Weather API endpoints - using real backend endpoints
export const weatherAPI = {
  // Get current weather
  getCurrentWeather: async (location?: string): Promise<ApiResponse<WeatherData>> => {
    const params = location ? { locations: [location] } : { locations: ['Warszawa'] };
    const response = await apiClient.get('/api/v2/weather/', { params });
    return {
      data: response.data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },

  // Get weather forecast
  getForecast: async (location?: string, days: number = 7): Promise<ApiResponse<WeatherData>> => {
    const params = { locations: [location || 'Warszawa'], days };
    const response = await apiClient.get('/api/v2/weather/', { params });
    return {
      data: response.data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },
};

// Shopping list API endpoints - using real backend endpoints
export const shoppingAPI = {
  // Get all shopping items
  getShoppingItems: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<ShoppingItem>>> => {
    const response = await apiClient.get('/api/food/shopping-trips/', { params });
    return response.data;
  },

  // Get shopping item by ID
  getShoppingItem: async (id: string): Promise<ApiResponse<ShoppingItem>> => {
    const response = await apiClient.get(`/api/food/shopping-trips/${id}`);
    return response.data;
  },

  // Create new shopping item
  createShoppingItem: async (item: Omit<ShoppingItem, 'id' | 'createdAt'>): Promise<ApiResponse<ShoppingItem>> => {
    const response = await apiClient.post('/api/food/shopping-trips/', item);
    return response.data;
  },

  // Update shopping item
  updateShoppingItem: async (id: string, updates: Partial<ShoppingItem>): Promise<ApiResponse<ShoppingItem>> => {
    const response = await apiClient.put(`/api/food/shopping-trips/${id}`, updates);
    return response.data;
  },

  // Delete shopping item
  deleteShoppingItem: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/food/shopping-trips/${id}`);
    return response.data;
  },

  // Toggle item completion
  toggleItemCompletion: async (id: string): Promise<ApiResponse<ShoppingItem>> => {
    const response = await apiClient.patch(`/api/food/shopping-trips/${id}/toggle`);
    return response.data;
  },

  // Clear completed items
  clearCompletedItems: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete('/api/food/shopping-trips/completed');
    return response.data;
  },
};

// Settings API endpoints - using real backend endpoints
export const settingsAPI = {
  // Get user settings
  getSettings: async (): Promise<ApiResponse<UserSettings>> => {
    const response = await apiClient.get('/api/settings/llm-models');
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> => {
    const response = await apiClient.put('/api/settings/llm-model/selected', settings);
    return response.data;
  },

  // Get agent status
  getAgentStatus: async (): Promise<ApiResponse<AgentStatus[]>> => {
    const response = await apiClient.get('/api/agents/agents');
    return response.data;
  },

  // Restart agent
  restartAgent: async (agentId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/agents/${agentId}/restart`);
    return response.data;
  },
};

// RAG API endpoints - using real backend endpoints
export const ragAPI = {
  // Upload document
  uploadDocument: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/v2/rag/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      data: response.data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },

  // Get all documents
  getDocuments: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/api/v2/rag/documents');
    return {
      data: response.data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },

  // Search documents
  searchDocuments: async (query: string, k: number = 5): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/api/v2/rag/search?query=${encodeURIComponent(query)}&k=${k}`);
    return {
      data: response.data.data || response.data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },

  // Query RAG system
  queryRAG: async (question: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/api/v2/rag/query', { question });
    return {
      data: response.data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },

  // Delete document
  deleteDocument: async (documentId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/v2/rag/documents/${documentId}`);
    return {
      data: undefined,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },

  // Get RAG stats
  getStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/api/v2/rag/stats');
    return {
      data: response.data.data || response.data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },
};

// Health check API
export const healthAPI = {
  // Get system health status
  getHealth: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Get system metrics
  getMetrics: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/metrics');
    return response.data;
  },

  // Get system status
  getStatus: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/status');
    return response.data;
  },
};

// Export all API modules
export const api = {
  chat: chatAPI,
  food: foodAPI,
  receipt: receiptAPI,
  weather: weatherAPI,
  settings: settingsAPI,
  health: healthAPI,
  shopping: shoppingAPI,
  rag: ragAPI,
};

export default api; 