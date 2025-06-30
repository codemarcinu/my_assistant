import { create } from 'zustand';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  agentType?: string;
  isStreaming?: boolean;
  attachments?: File[];
  responseTime?: number;
  confidence?: number;
  sources?: Array<{
    id: string;
    title: string;
    similarity: number;
  }>;
  usedRAG?: boolean;
  usedInternet?: boolean;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  currentAgent: string | null;
  sessionId: string;
  addMessage: (message: Message) => void;
  setTyping: (typing: boolean) => void;
  setCurrentAgent: (agentId: string | null) => void;
  clearMessages: () => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setSessionId: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  currentAgent: null,
  sessionId: 'default',

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setTyping: (typing: boolean) => {
    set({ isTyping: typing });
  },

  setCurrentAgent: (agentId: string | null) => {
    set({ currentAgent: agentId });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  updateMessage: (id: string, updates: Partial<Message>) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  setSessionId: (sessionId: string) => {
    set({ sessionId });
  },
})); 