// ✅ REQUIRED: Zustand store for chat state management
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ChatMessage, FoodItem, ReceiptData, WeatherData, SearchParams } from '../types';
import type { ChatStore } from '../types/chat';
import { chatAPI, foodAPI, receiptAPI, weatherAPI } from '../services/api';

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
  
  // API Actions
  sendMessage: (content: string) => Promise<void>;
  loadChatHistory: () => Promise<void>;
  loadFoodItems: () => Promise<void>;
  loadWeatherData: (location?: string) => Promise<void>;
  loadReceipts: () => Promise<void>;
}

export const useChatStore = create<ChatStore & ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  suggestedActions: [],
  recentQueries: [],
  currentFoodItems: [],
  recentReceipts: [],
  weatherData: null,

  addMessage: (messageData) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      content: messageData.content,
      type: messageData.type || 'user',
      timestamp: new Date(),
      metadata: messageData.metadata,
    };
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      ),
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

  addSuggestedAction: (action) => {
    set((state) => ({
      suggestedActions: [...state.suggestedActions, action],
    }));
  },

  clearSuggestedActions: () => {
    set({ suggestedActions: [] });
  },

  addRecentQuery: (query) => {
    set((state) => ({
      recentQueries: [query, ...state.recentQueries.slice(0, 9)], // Keep last 10
    }));
  },

  updateFoodItems: (items) => {
    set({ currentFoodItems: items });
  },

  updateReceipts: (receipts) => {
    set({ recentReceipts: receipts });
  },

  updateWeather: (weather) => {
    set({ weatherData: weather });
  },

  sendMessage: async (content: string) => {
    if (!content.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date(),
    };
    
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Add to recent queries
      get().addRecentQuery(content);
      
      // Send message to backend
      const response = await chatAPI.sendMessage(content);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.data || response.message || 'Przepraszam, wystąpił błąd.',
        type: 'assistant',
        timestamp: new Date(),
      };
      
      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
      }));

      // Load context data based on message content
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('jedzenie') || lowerContent.includes('spiżarnia') || lowerContent.includes('produkty')) {
        await get().loadFoodItems();
      }
      if (lowerContent.includes('pogoda') || lowerContent.includes('weather')) {
        await get().loadWeatherData();
      }
      if (lowerContent.includes('paragon') || lowerContent.includes('zakupy')) {
        await get().loadReceipts();
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Błąd komunikacji z serwerem';
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `❌ ${errorMessage}`,
        type: 'assistant',
        timestamp: new Date(),
      };
      
      set((state) => ({
        messages: [...state.messages, errorMsg],
        isLoading: false,
        error: errorMessage,
      }));
    }
  },

  loadChatHistory: async () => {
    try {
      set({ isLoading: true });
      const response = await chatAPI.getHistory(50);
      if (response.data) {
        const messages: ChatMessage[] = response.data.map((msg: any, index: number) => ({
          id: msg.id || `history-${index}`,
          content: msg.content || msg.message,
          type: msg.type || msg.role || 'assistant',
          timestamp: new Date(msg.timestamp || Date.now()),
          metadata: msg.metadata,
        }));
        set({ messages, isLoading: false });
      }
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      set({ isLoading: false, error: 'Błąd ładowania historii czatu' });
    }
  },

  loadFoodItems: async () => {
    try {
      const response = await foodAPI.getFoodItems();
      if (response.data?.items) {
        set({ currentFoodItems: response.data.items });
      }
    } catch (error: any) {
      console.error('Error loading food items:', error);
    }
  },

  loadWeatherData: async (location?: string) => {
    try {
      const response = await weatherAPI.getCurrentWeather(location);
      if (response.data) {
        set({ weatherData: response.data });
      }
    } catch (error: any) {
      console.error('Error loading weather data:', error);
    }
  },

  loadReceipts: async () => {
    try {
      const response = await receiptAPI.getReceipts({ query: '', filters: {} });
      if (response.data?.items) {
        set({ recentReceipts: response.data.items });
      }
    } catch (error: any) {
      console.error('Error loading receipts:', error);
    }
  },
})); 