// ✅ REQUIRED: Zustand store for chat state management
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ChatMessage, FoodItem, ReceiptData, WeatherData } from '../types';

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

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        messages: [],
        isLoading: false,
        error: null,
        suggestedActions: [],
        recentQueries: [],
        currentFoodItems: [],
        recentReceipts: [],
        weatherData: null,

        // Actions
        addMessage: (message: ChatMessage) =>
          set((state) => ({
            messages: [...state.messages, message],
          })),

        updateMessage: (id: string, updates: Partial<ChatMessage>) =>
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id ? { ...msg, ...updates } : msg
            ),
          })),

        clearMessages: () =>
          set({
            messages: [],
          }),

        setLoading: (loading: boolean) =>
          set({
            isLoading: loading,
          }),

        setError: (error: string | null) =>
          set({
            error,
          }),

        addSuggestedAction: (action: string) =>
          set((state) => ({
            suggestedActions: [...state.suggestedActions, action],
          })),

        clearSuggestedActions: () =>
          set({
            suggestedActions: [],
          }),

        addRecentQuery: (query: string) =>
          set((state) => ({
            recentQueries: [
              query,
              ...state.recentQueries.filter((q) => q !== query),
            ].slice(0, 10), // Keep only last 10 queries
          })),

        updateFoodItems: (items: FoodItem[]) =>
          set({
            currentFoodItems: items,
          }),

        updateReceipts: (receipts: ReceiptData[]) =>
          set({
            recentReceipts: receipts,
          }),

        updateWeather: (weather: WeatherData) =>
          set({
            weatherData: weather,
          }),
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          messages: state.messages.slice(-50), // Keep only last 50 messages
          recentQueries: state.recentQueries,
          suggestedActions: state.suggestedActions,
        }),
      }
    ),
    {
      name: 'chat-store',
    }
  )
); 