import { useState, useEffect, useCallback } from 'react';

interface OfflineMessage {
  id: string;
  message: any;
  timestamp: number;
}

interface OfflineSyncState {
  isOnline: boolean;
  offlineQueue: OfflineMessage[];
  isSyncing: boolean;
  lastSyncTime: number | null;
}

export const useOfflineSync = () => {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: navigator.onLine,
    offlineQueue: [],
    isSyncing: false,
    lastSyncTime: null,
  });

  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Initialize Service Worker
  useEffect(() => {
    const initServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setSwRegistration(registration);
          console.log('[OfflineSync] Service Worker registered');
        } catch (error) {
          console.error('[OfflineSync] Service Worker registration failed:', error);
        }
      }
    };

    initServiceWorker();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      syncOfflineMessages();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for Service Worker messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'SYNC_OFFLINE_MESSAGES':
          handleOfflineMessagesSync(data);
          break;
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Cache message for offline
  const cacheOfflineMessage = useCallback(async (message: any) => {
    if (!swRegistration) return;

    try {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        console.log('[OfflineSync] Message cached for offline');
      };

      swRegistration.active?.postMessage({
        type: 'CACHE_OFFLINE_MESSAGE',
        data: message
      }, [messageChannel.port2]);

      // Update local queue
      setState(prev => ({
        ...prev,
        offlineQueue: [...prev.offlineQueue, {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          message,
          timestamp: Date.now()
        }]
      }));
    } catch (error) {
      console.error('[OfflineSync] Failed to cache offline message:', error);
    }
  }, [swRegistration]);

  // Get offline queue from Service Worker
  const getOfflineQueue = useCallback(async (): Promise<OfflineMessage[]> => {
    if (!swRegistration) return [];

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data || []);
        };

        swRegistration.active?.postMessage({
          type: 'GET_OFFLINE_QUEUE'
        }, [messageChannel.port2]);
      });
    } catch (error) {
      console.error('[OfflineSync] Failed to get offline queue:', error);
      return [];
    }
  }, [swRegistration]);

  // Clear offline queue
  const clearOfflineQueue = useCallback(async () => {
    if (!swRegistration) return;

    try {
      swRegistration.active?.postMessage({
        type: 'CLEAR_OFFLINE_QUEUE'
      });

      setState(prev => ({
        ...prev,
        offlineQueue: []
      }));
    } catch (error) {
      console.error('[OfflineSync] Failed to clear offline queue:', error);
    }
  }, [swRegistration]);

  // Register background sync
  const registerBackgroundSync = useCallback(async () => {
    if (!swRegistration) return;

    try {
      swRegistration.active?.postMessage({
        type: 'REGISTER_BACKGROUND_SYNC'
      });
    } catch (error) {
      console.error('[OfflineSync] Failed to register background sync:', error);
    }
  }, [swRegistration]);

  // Sync offline messages
  const syncOfflineMessages = useCallback(async () => {
    if (!state.isOnline || state.isSyncing) return;

    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      const queue = await getOfflineQueue();
      
      if (queue.length === 0) {
        setState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: Date.now()
        }));
        return;
      }

      console.log('[OfflineSync] Syncing', queue.length, 'offline messages');

      // Process each message
      for (const offlineMessage of queue) {
        try {
          // Here you would typically send the message to your WebSocket
          // For now, we'll just log it
          console.log('[OfflineSync] Processing offline message:', offlineMessage.message);
          
          // Simulate sending to WebSocket
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('[OfflineSync] Failed to process offline message:', error);
        }
      }

      // Clear the queue after successful sync
      await clearOfflineQueue();

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
        offlineQueue: []
      }));

      console.log('[OfflineSync] Offline messages synced successfully');

    } catch (error) {
      console.error('[OfflineSync] Failed to sync offline messages:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [state.isOnline, state.isSyncing, getOfflineQueue, clearOfflineQueue]);

  // Handle offline messages sync from Service Worker
  const handleOfflineMessagesSync = useCallback((messages: OfflineMessage[]) => {
    console.log('[OfflineSync] Received offline messages from Service Worker:', messages);
    setState(prev => ({ ...prev, offlineQueue: messages }));
  }, []);

  // Send message with offline fallback
  const sendMessageWithOfflineFallback = useCallback(async (
    message: any, 
    sendFunction: (msg: any) => Promise<void>
  ) => {
    if (state.isOnline) {
      try {
        await sendFunction(message);
      } catch (error) {
        console.warn('[OfflineSync] Failed to send message online, caching for offline:', error);
        await cacheOfflineMessage(message);
      }
    } else {
      console.log('[OfflineSync] Offline, caching message:', message);
      await cacheOfflineMessage(message);
    }
  }, [state.isOnline, cacheOfflineMessage]);

  return {
    ...state,
    cacheOfflineMessage,
    getOfflineQueue,
    clearOfflineQueue,
    registerBackgroundSync,
    syncOfflineMessages,
    sendMessageWithOfflineFallback,
  };
}; 