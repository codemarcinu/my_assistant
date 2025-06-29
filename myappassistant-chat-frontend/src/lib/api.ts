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

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
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
    return apiClient.post<ChatResponse>('/api/chat/memory_chat', request);
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
      throw new Error(`Błąd zapisu danych: ${response.statusText}`);
    }

    return response.json();
  },
}; 