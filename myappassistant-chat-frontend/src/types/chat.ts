import type { ChatMessage } from './index';

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatStore extends ChatState {
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
} 