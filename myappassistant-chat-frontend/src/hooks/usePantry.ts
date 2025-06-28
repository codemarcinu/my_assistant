import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foodAPI } from '../services/api';
import type { FoodItem, SearchParams, PaginatedResponse } from '../types';

// Query keys
export const pantryKeys = {
  all: ['pantry'] as const,
  items: () => [...pantryKeys.all, 'items'] as const,
  item: (id: string) => [...pantryKeys.all, 'items', id] as const,
  expiring: (days: number) => [...pantryKeys.all, 'expiring', days] as const,
};

export const usePantryItems = (params?: SearchParams) => {
  return useQuery({
    queryKey: pantryKeys.items(),
    queryFn: () => foodAPI.getFoodItems(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePantryItem = (id: string) => {
  return useQuery({
    queryKey: pantryKeys.item(id),
    queryFn: () => foodAPI.getFoodItem(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useExpiringItems = (days: number = 7) => {
  return useQuery({
    queryKey: pantryKeys.expiring(days),
    queryFn: () => foodAPI.getExpiringItems(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateFoodItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (item: Omit<FoodItem, 'id' | 'addedDate'>) => foodAPI.createFoodItem(item),
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: pantryKeys.items() });
      
      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(pantryKeys.items());
      
      // Optimistically update to the new value
      const optimisticItem: FoodItem = {
        ...newItem,
        id: `optimistic-${Date.now()}`,
        addedDate: new Date(),
      };
      
      queryClient.setQueryData(pantryKeys.items(), (old: any) => {
        const items = old?.data?.items || [];
        return {
          ...old,
          data: {
            ...old.data,
            items: [...items, optimisticItem],
            total: old.data.total + 1,
          },
        };
      });
      
      return { previousItems };
    },
    onError: (err, newItem, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousItems) {
        queryClient.setQueryData(pantryKeys.items(), context.previousItems);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: pantryKeys.items() });
      queryClient.invalidateQueries({ queryKey: pantryKeys.expiring(7) });
    },
  });
};

export const useUpdateFoodItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FoodItem> }) => 
      foodAPI.updateFoodItem(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: pantryKeys.item(id) });
      await queryClient.cancelQueries({ queryKey: pantryKeys.items() });
      
      // Snapshot the previous values
      const previousItem = queryClient.getQueryData(pantryKeys.item(id));
      const previousItems = queryClient.getQueryData(pantryKeys.items());
      
      // Optimistically update the item
      queryClient.setQueryData(pantryKeys.item(id), (old: any) => {
        return old ? { ...old, data: { ...old.data, ...updates } } : old;
      });
      
      // Optimistically update the items list
      queryClient.setQueryData(pantryKeys.items(), (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.map((item: FoodItem) => 
              item.id === id ? { ...item, ...updates } : item
            ),
          },
        };
      });
      
      return { previousItem, previousItems };
    },
    onError: (err, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousItem) {
        queryClient.setQueryData(pantryKeys.item(id), context.previousItem);
      }
      if (context?.previousItems) {
        queryClient.setQueryData(pantryKeys.items(), context.previousItems);
      }
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: pantryKeys.item(id) });
      queryClient.invalidateQueries({ queryKey: pantryKeys.items() });
      queryClient.invalidateQueries({ queryKey: pantryKeys.expiring(7) });
    },
  });
};

export const useDeleteFoodItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => foodAPI.deleteFoodItem(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: pantryKeys.items() });
      
      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(pantryKeys.items());
      
      // Optimistically update to the new value
      queryClient.setQueryData(pantryKeys.items(), (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((item: FoodItem) => item.id !== id),
            total: old.data.total - 1,
          },
        };
      });
      
      // Remove the item from cache
      queryClient.removeQueries({ queryKey: pantryKeys.item(id) });
      
      return { previousItems };
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousItems) {
        queryClient.setQueryData(pantryKeys.items(), context.previousItems);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: pantryKeys.items() });
      queryClient.invalidateQueries({ queryKey: pantryKeys.expiring(7) });
    },
  });
}; 