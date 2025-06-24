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

// Chat API endpoints
export const chatAPI = {
  // Send message to AI assistant
  sendMessage: async (message: string, context?: any): Promise<ApiResponse<ChatMessage>> => {
    const response = await apiClient.post('/api/v1/chat/message', {
      message,
      context,
    });
    return response.data;
  },

  // Get chat history
  getHistory: async (limit: number = 50): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await apiClient.get(`/api/v1/chat/history?limit=${limit}`);
    return response.data;
  },

  // Clear chat history
  clearHistory: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete('/api/v1/chat/history');
    return response.data;
  },

  // Get suggested actions based on context
  getSuggestedActions: async (context: any): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.post('/api/v1/chat/suggestions', { context });
    return response.data;
  },
};

// Food and pantry API endpoints
export const foodAPI = {
  // Get all food items
  getFoodItems: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<FoodItem>>> => {
    const response = await apiClient.get('/api/v1/food-items', { params });
    return response.data;
  },

  // Get food item by ID
  getFoodItem: async (id: string): Promise<ApiResponse<FoodItem>> => {
    const response = await apiClient.get(`/api/v1/food-items/${id}`);
    return response.data;
  },

  // Create new food item
  createFoodItem: async (item: Omit<FoodItem, 'id' | 'addedDate'>): Promise<ApiResponse<FoodItem>> => {
    const response = await apiClient.post('/api/v1/food-items', item);
    return response.data;
  },

  // Update food item
  updateFoodItem: async (id: string, updates: Partial<FoodItem>): Promise<ApiResponse<FoodItem>> => {
    const response = await apiClient.put(`/api/v1/food-items/${id}`, updates);
    return response.data;
  },

  // Delete food item
  deleteFoodItem: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/v1/food-items/${id}`);
    return response.data;
  },

  // Get expiring items
  getExpiringItems: async (days: number = 7): Promise<ApiResponse<FoodItem[]>> => {
    const response = await apiClient.get(`/api/v1/food-items/expiring?days=${days}`);
    return response.data;
  },
};

// OCR and receipt API endpoints
export const receiptAPI = {
  // Upload receipt image
  uploadReceipt: async (file: File): Promise<ApiResponse<ReceiptData>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/v1/receipts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get receipt by ID
  getReceipt: async (id: string): Promise<ApiResponse<ReceiptData>> => {
    const response = await apiClient.get(`/api/v1/receipts/${id}`);
    return response.data;
  },

  // Get all receipts
  getReceipts: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<ReceiptData>>> => {
    const response = await apiClient.get('/api/v1/receipts', { params });
    return response.data;
  },

  // Verify receipt items
  verifyReceipt: async (id: string, items: any[]): Promise<ApiResponse<ReceiptData>> => {
    const response = await apiClient.post(`/api/v1/receipts/${id}/verify`, { items });
    return response.data;
  },
};

// Weather API endpoints
export const weatherAPI = {
  // Get current weather
  getCurrentWeather: async (location?: string): Promise<ApiResponse<WeatherData>> => {
    const params = location ? { location } : {};
    const response = await apiClient.get('/api/v1/weather/current', { params });
    return response.data;
  },

  // Get weather forecast
  getForecast: async (location?: string, days: number = 7): Promise<ApiResponse<WeatherData>> => {
    const params = { days, ...(location && { location }) };
    const response = await apiClient.get('/api/v1/weather/forecast', { params });
    return response.data;
  },
};

// Shopping list API endpoints
export const shoppingAPI = {
  // Get all shopping items
  getShoppingItems: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<ShoppingItem>>> => {
    const response = await apiClient.get('/api/v1/shopping/items', { params });
    return response.data;
  },

  // Get shopping item by ID
  getShoppingItem: async (id: string): Promise<ApiResponse<ShoppingItem>> => {
    const response = await apiClient.get(`/api/v1/shopping/items/${id}`);
    return response.data;
  },

  // Create new shopping item
  createShoppingItem: async (item: Omit<ShoppingItem, 'id' | 'createdAt'>): Promise<ApiResponse<ShoppingItem>> => {
    const response = await apiClient.post('/api/v1/shopping/items', item);
    return response.data;
  },

  // Update shopping item
  updateShoppingItem: async (id: string, updates: Partial<ShoppingItem>): Promise<ApiResponse<ShoppingItem>> => {
    const response = await apiClient.put(`/api/v1/shopping/items/${id}`, updates);
    return response.data;
  },

  // Delete shopping item
  deleteShoppingItem: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/v1/shopping/items/${id}`);
    return response.data;
  },

  // Toggle item completion
  toggleItemCompletion: async (id: string): Promise<ApiResponse<ShoppingItem>> => {
    const response = await apiClient.patch(`/api/v1/shopping/items/${id}/toggle`);
    return response.data;
  },

  // Clear completed items
  clearCompletedItems: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete('/api/v1/shopping/items/completed');
    return response.data;
  },
};

// Settings API endpoints
export const settingsAPI = {
  // Get user settings
  getSettings: async (): Promise<ApiResponse<UserSettings>> => {
    const response = await apiClient.get('/api/v1/settings');
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> => {
    const response = await apiClient.put('/api/v1/settings', settings);
    return response.data;
  },

  // Get agent status
  getAgentStatus: async (): Promise<ApiResponse<AgentStatus[]>> => {
    const response = await apiClient.get('/api/v1/agents/status');
    return response.data;
  },

  // Restart agent
  restartAgent: async (agentId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/v1/agents/${agentId}/restart`);
    return response.data;
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
};

export default api; 