// ✅ REQUIRED: Test utilities
import React from 'react';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockMessage = (overrides = {}) => ({
  id: '1',
  content: 'Test message',
  role: 'user' as const,
  timestamp: new Date().toISOString(),
  ...overrides,
});

export const createMockChatState = (overrides = {}) => ({
  messages: [createMockMessage()],
  isLoading: false,
  error: null,
  ...overrides,
});

export const createMockSettings = (overrides = {}) => ({
  theme: 'light' as const,
  language: 'pl' as const,
  notifications: true,
  ...overrides,
});

// Mock API responses
export const mockApiResponses = {
  chat: {
    success: {
      message: 'Test response',
      timestamp: new Date().toISOString(),
    },
    error: {
      error: 'Test error',
      code: 500,
    },
  },
  weather: {
    success: {
      temperature: 20,
      condition: 'sunny',
      location: 'Warsaw',
    },
  },
  pantry: {
    success: {
      items: [
        { id: '1', name: 'Milk', quantity: 2, unit: 'l' },
        { id: '2', name: 'Bread', quantity: 1, unit: 'piece' },
      ],
    },
  },
}; 