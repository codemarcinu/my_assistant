// API client for communicating with the backend

interface ChatRequest {
  message: string;
  session_id: string;
  usePerplexity: boolean;
  useBielik: boolean;
  agent_states: Record<string, boolean>;
  context_docs?: Array<{
    id: string;
    title: string;
    content: string;
    source: string;
    similarity: number;
  }>;
}

interface ChatResponse {
  text?: string;
  success?: boolean;
  session_id?: string;
  data?: {
    reply?: string;
    agent_type?: string;
    history_length?: number;
    query?: string;
    used_rag?: boolean;
    used_internet?: boolean;
    rag_confidence?: number;
    use_perplexity?: boolean;
    use_bielik?: boolean;
    response_time?: number;
  };
  status?: string;
  timestamp?: string;
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
  data?: Record<string, unknown>;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface ReceiptData {
  items: ReceiptItem[];
  total: number;
  store: string;
  date: string;
  receipt_id: string;
}

interface TaskStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: Record<string, unknown>;
  error?: string;
}

interface AnalyticsData {
  total_expenses: number;
  category_breakdown: Record<string, number>;
  monthly_trend: Array<{ month: string; amount: number }>;
  top_stores: Array<{ store: string; amount: number }>;
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
          } catch {
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
        agent_type: lastChunk?.data?.agent_type as string,
        history_length: lastChunk?.data?.history_length as number,
      } as T,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  }

  async post<T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postStreaming<T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
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
    return apiClient.postStreaming<ChatResponse>('/api/chat/memory_chat', request as unknown as Record<string, unknown>);
  },

  getHistory: async (sessionId: string = 'default'): Promise<ApiResponse<Record<string, unknown>>> => {
    return apiClient.get<Record<string, unknown>>(`/api/chat/memory_chat?session_id=${sessionId}`);
  },

  clearHistory: async (sessionId: string = 'default'): Promise<ApiResponse<Record<string, unknown>>> => {
    return apiClient.post<Record<string, unknown>>(`/api/chat/memory_chat/clear?session_id=${sessionId}`, {});
  }
};

export const agentsAPI = {
  executeTask: async (task: string, sessionId?: string): Promise<ApiResponse<Record<string, unknown>>> => {
    return apiClient.post<Record<string, unknown>>('/api/agents/execute', {
      task,
      session_id: sessionId,
      usePerplexity: false,
      useBielik: true,
      agent_states: {}
    });
  },

  getAgents: async (): Promise<ApiResponse<Record<string, unknown>[]>> => {
    return apiClient.get<Record<string, unknown>[]>('/api/agents/agents');
  }
};

export const receiptAPI = {
  async processReceipt(file: File): Promise<ApiResponse<ReceiptData>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${apiClient['baseURL']}/api/receipts/process`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Receipt processing failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },

  async processReceiptAsync(file: File): Promise<ApiResponse<TaskStatus>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${apiClient['baseURL']}/api/receipts/process_async`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Async receipt processing failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  },

  async getTaskStatus(taskId: string): Promise<ApiResponse<TaskStatus>> {
    return apiClient.get<TaskStatus>(`/api/receipts/status/${taskId}`);
  },

  async saveReceiptData(receiptData: ReceiptData): Promise<ApiResponse<Record<string, unknown>>> {
    return apiClient.post<Record<string, unknown>>('/api/receipts/save', receiptData as unknown as Record<string, unknown>);
  },

  async getReceiptHistory(limit: number = 50): Promise<ApiResponse<ReceiptData[]>> {
    return apiClient.get<ReceiptData[]>(`/api/receipts/history?limit=${limit}`);
  }
};

export const analyticsAPI = {
  async analyzeExpenses(timeRange: string = 'month'): Promise<ApiResponse<AnalyticsData>> {
    return apiClient.get<AnalyticsData>(`/api/analytics/expenses?range=${timeRange}`);
  }
};

export async function getAnalytics(): Promise<AnalyticsData> {
  try {
    const response = await analyticsAPI.analyzeExpenses();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    throw error;
  }
}

export const weatherAPI = {
  getWeather: async (locations: string = 'Zabki,PL'): Promise<ApiResponse<Record<string, unknown>>> => {
    return apiClient.get<Record<string, unknown>>(`/api/v2/weather/?locations=${encodeURIComponent(locations)}`);
  },

  getWeatherForLocation: async (location: string, country: string = 'PL'): Promise<ApiResponse<Record<string, unknown>>> => {
    const locations = `${location},${country}`;
    return apiClient.get<Record<string, unknown>>(`/api/v2/weather/?locations=${encodeURIComponent(locations)}`);
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

 