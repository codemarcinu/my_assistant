// API client for communicating with the backend

interface ChatRequest {
  message: string;
  session_id: string;
  usePerplexity: boolean;
  useBielik: boolean;
  agent_states: Record<string, boolean>;
}

interface ChatResponse {
  data: {
    reply: string;
    agent_type?: string;
    history_length?: number;
  };
  status: string;
  timestamp: string;
}

interface ApiResponse<T> {
  data: T;
  status: string;
  timestamp: string;
}

interface StreamingChatResponse {
  text: string;
  success: boolean;
  session_id: string;
  data?: any;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  }

  private async streamingRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Handle streaming response (NDJSON format)
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available');
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let lastChunk: StreamingChatResponse | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data: StreamingChatResponse = JSON.parse(line);
            fullText += data.text || '';
            lastChunk = data;
          } catch (e) {
            console.warn('Failed to parse JSON line:', line);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Return the accumulated response
    return {
      data: {
        reply: fullText,
        agent_type: lastChunk?.data?.agent_type,
        history_length: lastChunk?.data?.history_length,
      } as T,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postStreaming<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.streamingRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }
}

const apiClient = new ApiClient();

export const chatAPI = {
  sendMessage: async (request: ChatRequest): Promise<ApiResponse<ChatResponse>> => {
    return apiClient.postStreaming<ChatResponse>('/api/chat/memory_chat', request);
  },

  getHistory: async (sessionId: string = 'default'): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/api/chat/memory_chat?session_id=${sessionId}`);
  },

  clearHistory: async (sessionId: string = 'default'): Promise<ApiResponse<any>> => {
    return apiClient.post<any>(`/api/chat/memory_chat/clear?session_id=${sessionId}`, {});
  }
};

export const agentsAPI = {
  executeTask: async (task: string, sessionId?: string): Promise<ApiResponse<any>> => {
    return apiClient.post<any>('/api/agents/execute', {
      task,
      session_id: sessionId,
      usePerplexity: false,
      useBielik: true,
      agent_states: {}
    });
  },

  getAgents: async (): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>('/api/agents/agents');
  }
};

export const ragAPI = {
  uploadDocument: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${apiClient['baseURL']}/api/v2/rag/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },

  getDocuments: async (): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>('/api/v2/rag/documents');
  },

  searchDocuments: async (query: string, k: number = 5): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/api/v2/rag/search?query=${encodeURIComponent(query)}&k=${k}`);
  },

  queryRAG: async (question: string): Promise<ApiResponse<any>> => {
    return apiClient.post<any>('/api/v2/rag/query', { question });
  },

  getStats: async (): Promise<ApiResponse<any>> => {
    return apiClient.get<any>('/api/v2/rag/stats');
  }
};

// API dla przetwarzania paragonów
export const receiptAPI = {
  // Przetwarzanie paragonu (OCR + analiza)
  async processReceipt(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${apiClient['baseURL']}/api/v2/receipts/process`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Błąd przetwarzania paragonu: ${response.statusText}`);
    }

    return response.json();
  },

  // Asynchroniczne przetwarzanie paragonu (Celery)
  async processReceiptAsync(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${apiClient['baseURL']}/api/v3/receipts/process`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Błąd uruchomienia przetwarzania: ${response.statusText}`);
    }

    return response.json();
  },

  // Sprawdzanie statusu zadania
  async getTaskStatus(taskId: string): Promise<any> {
    const url = `${apiClient['baseURL']}/api/v3/receipts/status/${taskId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Błąd sprawdzania statusu: ${response.statusText}`);
    }

    return response.json();
  },

  // Zapisywanie danych paragonu do bazy
  async saveReceiptData(receiptData: any): Promise<any> {
    const url = `${apiClient['baseURL']}/api/v2/receipts/save`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(receiptData),
    });

    if (!response.ok) {
      throw new Error(`Błąd zapisywania danych: ${response.statusText}`);
    }

    return response.json();
  },

  // Pobieranie historii paragonów
  async getReceiptHistory(limit: number = 50): Promise<any> {
    // Mockowane dane historii paragonów
    const mockHistory = {
      receipts: [
        {
          id: 1,
          store_name: "Biedronka",
          trip_date: "2024-01-15",
          total_amount: 156.78,
          products_count: 12,
          status: "processed"
        },
        {
          id: 2,
          store_name: "Lidl",
          trip_date: "2024-01-14",
          total_amount: 89.45,
          products_count: 8,
          status: "processed"
        },
        {
          id: 3,
          store_name: "Carrefour",
          trip_date: "2024-01-13",
          total_amount: 234.12,
          products_count: 15,
          status: "processed"
        }
      ],
      total: 3,
      page: 1,
      per_page: limit
    };
    
    return mockHistory;
  },

  // Analiza wydatków (mockowane dane - endpoint nie istnieje)
  async analyzeExpenses(timeRange: string = 'month'): Promise<any> {
    // Mockowane dane analityki wydatków
    const mockData = {
      total_expenses: 2847.50,
      average_daily: 94.92,
      top_categories: [
        { name: "Jedzenie", amount: 1234.00, percentage: 43 },
        { name: "Transport", amount: 567.00, percentage: 20 },
        { name: "Rachunki", amount: 456.00, percentage: 16 },
        { name: "Zakupy", amount: 345.00, percentage: 12 },
        { name: "Rozrywka", amount: 245.50, percentage: 9 }
      ],
      trends: {
        food_increase: 15,
        transport_savings: -8,
        new_category: "Elektronika",
        new_category_amount: 89.00
      },
      time_range: timeRange,
      last_updated: new Date().toISOString()
    };
    
    return mockData;
  }
};

export const weatherAPI = {
  getWeather: async (locations: string = 'Zabki,PL'): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/api/v2/weather/?locations=${encodeURIComponent(locations)}`);
  },

  getWeatherForLocation: async (location: string, country: string = 'PL'): Promise<ApiResponse<any>> => {
    const locations = `${location},${country}`;
    return apiClient.get<any>(`/api/v2/weather/?locations=${encodeURIComponent(locations)}`);
  }
};

export async function getAnalytics(): Promise<any> {
  try {
    const response = await fetch(`${apiClient['baseURL']}/api/analytics/expenses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    // Fallback to mock data if API fails
    return {
      summary: {
        total_expenses: 1250.50,
        trip_count: 8,
        average_per_trip: 156.31,
        total_products: 45
      },
      category_breakdown: [
        { category: "Żywność", amount: 450.20, percentage: 36.0 },
        { category: "Napoje", amount: 180.30, percentage: 14.4 },
        { category: "Chemia gospodarcza", amount: 320.00, percentage: 25.6 },
        { category: "Inne", amount: 300.00, percentage: 24.0 }
      ],
      insights: [
        "Główna kategoria wydatków: Żywność (450.20 zł)",
        "Średnia wartość zakupów: 156.31 zł"
      ]
    };
  }
} 