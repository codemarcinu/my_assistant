// ✅ REQUIRED: Zustand store for chat state management
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ChatMessage, FoodItem, ReceiptData, WeatherData } from '../types';
import { ChatStore, Message } from '../types/chat';
import { sendChatMessage } from '../services/api';

interface ChatState {
  // Chat messages
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Quick actions and suggestions
  suggestedActions: string[];
  recentQueries: string[];
  
  // Context data
  currentFoodItems: FoodItem[];
  recentReceipts: ReceiptData[];
  weatherData: WeatherData | null;
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addSuggestedAction: (action: string) => void;
  clearSuggestedActions: () => void;
  addRecentQuery: (query: string) => void;
  updateFoodItems: (items: FoodItem[]) => void;
  updateReceipts: (receipts: ReceiptData[]) => void;
  updateWeather: (weather: WeatherData) => void;
}

export const useChatStore = create<ChatStore & { sendMessage: (content: string) => Promise<void> }>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (messageData) => {
    const message: Message = {
      id: Date.now().toString(),
      ...messageData,
    };
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  sendMessage: async (content: string) => {
    if (!content.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));
    try {
      const response = await sendChatMessage({ content, role: 'user' });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
      };
      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Chat error' });
    }
  },
})); 