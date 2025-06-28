import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '../services/api';
import type { ChatMessage, ApiResponse } from '../types';

// Query keys
export const chatKeys = {
  all: ['chat'] as const,
  history: () => [...chatKeys.all, 'history'] as const,
  memory: () => [...chatKeys.all, 'memory'] as const,
  suggestions: () => [...chatKeys.all, 'suggestions'] as const,
};

export const useChatHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: chatKeys.history(),
    queryFn: () => chatAPI.getHistory(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: string) => {
      const response = await chatAPI.sendMessage(message);
      return response;
    },
    onMutate: async (message) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.history() });
      
      // Snapshot the previous value
      const previousHistory = queryClient.getQueryData(chatKeys.history());
      
      // Optimistically update to the new value
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        content: message,
        type: 'user',
        timestamp: new Date(),
        metadata: { 
          responseType: 'info',
          isConcise: false 
        },
      };
      
      queryClient.setQueryData(chatKeys.history(), (old: any) => {
        const messages = old?.data || [];
        return {
          ...old,
          data: [...messages, optimisticMessage],
        };
      });
      
      // Return a context object with the snapshotted value
      return { previousHistory };
    },
    onError: (err, message, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousHistory) {
        queryClient.setQueryData(chatKeys.history(), context.previousHistory);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: chatKeys.history() });
    },
  });
};

export const useClearChatHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => chatAPI.clearHistory(),
    onSuccess: () => {
      // Optimistically clear the chat history
      queryClient.setQueryData(chatKeys.history(), { data: [] });
    },
  });
};

export const useMemoryStats = () => {
  return useQuery({
    queryKey: chatKeys.memory(),
    queryFn: () => chatAPI.getMemoryStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOptimizeMemory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId?: string) => chatAPI.optimizeMemory(sessionId),
    onSuccess: () => {
      // Invalidate memory-related queries
      queryClient.invalidateQueries({ queryKey: chatKeys.memory() });
      queryClient.invalidateQueries({ queryKey: chatKeys.history() });
    },
  });
};

export const useSuggestedActions = () => {
  return useQuery({
    queryKey: chatKeys.suggestions(),
    queryFn: () => chatAPI.getSuggestedActions({}),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}; 