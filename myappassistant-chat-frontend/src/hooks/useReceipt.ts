import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { receiptAPI } from '../services/api';
import type { ReceiptData } from '../types';
import { ReceiptStatus } from '../types';

// Query keys
export const receiptKeys = {
  all: ['receipts'] as const,
  list: () => [...receiptKeys.all, 'list'] as const,
  detail: (id: string) => [...receiptKeys.all, 'detail', id] as const,
};

export const useReceipts = () => {
  return useQuery({
    queryKey: receiptKeys.list(),
    queryFn: () => receiptAPI.getReceipts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useReceipt = (id: string) => {
  return useQuery({
    queryKey: receiptKeys.detail(id),
    queryFn: () => receiptAPI.getReceipt(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUploadReceipt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => receiptAPI.uploadReceipt(file),
    onMutate: async (file) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: receiptKeys.list() });
      
      // Snapshot the previous value
      const previousReceipts = queryClient.getQueryData(receiptKeys.list());
      
      // Optimistically update to the new value
      const optimisticReceipt: ReceiptData = {
        id: `optimistic-${Date.now()}`,
        items: [],
        total: 0,
        store: 'Przetwarzanie...',
        date: new Date(),
        imageUrl: URL.createObjectURL(file),
        status: ReceiptStatus.PROCESSING,
      };
      
      queryClient.setQueryData(receiptKeys.list(), (old: any) => {
        const receipts = old?.data || [];
        return {
          ...old,
          data: [optimisticReceipt, ...receipts],
        };
      });
      
      return { previousReceipts };
    },
    onError: (err, file, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousReceipts) {
        queryClient.setQueryData(receiptKeys.list(), context.previousReceipts);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: receiptKeys.list() });
    },
  });
};

export const useProcessReceipt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => receiptAPI.processReceipt(file),
    onSuccess: (data) => {
      // Update the receipt in the list with processed data
      queryClient.setQueryData(receiptKeys.list(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((receipt: ReceiptData) => 
            receipt.id === data.data.id ? data.data : receipt
          ),
        };
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: receiptKeys.list() });
    },
  });
}; 