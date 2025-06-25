import axios from 'axios';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ConciseRequest {
  query: string;
  response_style?: 'concise' | 'standard' | 'detailed';
  use_rag?: boolean;
  max_tokens?: number;
  temperature?: number;
  target_length?: number;
}

export interface ConciseResponse {
  text: string;
  response_style: string;
  concise_score: number;
  can_expand: boolean;
  processing_time?: number;
  chunks_processed?: number;
  response_stats?: {
    char_count: number;
    word_count: number;
    sentence_count: number;
    avg_words_per_sentence: number;
  };
  metadata?: Record<string, any>;
}

export interface ExpandRequest {
  concise_response: string;
  original_query: string;
}

export interface ExpandResponse {
  expanded_text: string;
  original_concise: string;
  expansion_successful: boolean;
  original_length: number;
  expanded_length: number;
}

export interface ConcisenessAnalysis {
  text_length: number;
  concise_score: number;
  is_concise: boolean;
  stats: {
    char_count: number;
    word_count: number;
    sentence_count: number;
    concise_score: number;
    is_concise: boolean;
    avg_words_per_sentence: number;
    avg_chars_per_word: number;
  };
  recommendations: string[];
}

export interface ResponseConfig {
  response_style: string;
  max_tokens: number;
  num_predict: number;
  temperature: number;
  target_char_length: number;
  expand_threshold: number;
  concise_mode: boolean;
  ollama_options: Record<string, any>;
  system_prompt_modifier: string;
}

export interface AgentStatus {
  agent_name: string;
  description: string;
  current_config: {
    response_style: string;
    concise_mode: boolean;
    target_char_length: number;
    max_tokens: number;
    temperature: number;
  };
  status: string;
}

export const conciseApi = {
  /**
   * Generate a concise response
   */
  generateResponse: async (request: ConciseRequest): Promise<ConciseResponse> => {
    const response = await apiClient.post('/api/v2/concise/generate', request);
    return response.data;
  },

  /**
   * Expand a concise response
   */
  expandResponse: async (request: ExpandRequest): Promise<ExpandResponse> => {
    const response = await apiClient.post('/api/v2/concise/expand', request);
    return response.data;
  },

  /**
   * Analyze text for conciseness
   */
  analyzeConciseness: async (text: string): Promise<ConcisenessAnalysis> => {
    const response = await apiClient.get('/api/v2/concise/analyze', {
      params: { text }
    });
    return response.data;
  },

  /**
   * Get configuration for a response style
   */
  getConfig: async (style: 'concise' | 'standard' | 'detailed'): Promise<ResponseConfig> => {
    const response = await apiClient.get(`/api/v2/concise/config/${style}`);
    return response.data;
  },

  /**
   * Get agent status
   */
  getAgentStatus: async (): Promise<AgentStatus> => {
    const response = await apiClient.get('/api/v2/concise/agent/status');
    return response.data;
  },
}; 