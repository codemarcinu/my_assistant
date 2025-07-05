"use client";

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { WebSocketPool, PoolConfig, PoolMetrics } from '@/lib/websocket-pool';
import { useWebSocketContext } from './WebSocketProvider';

interface WebSocketPoolContextType {
  pool: WebSocketPool | null;
  metrics: PoolMetrics;
  sendMessage: (message: any, priority?: number) => Promise<void>;
  broadcastMessage: (message: any) => Promise<void>;
  getConnectionCount: () => number;
  getHealthyConnectionCount: () => number;
}

const WebSocketPoolContext = createContext<WebSocketPoolContextType | null>(null);

export const useWebSocketPool = () => {
  const context = useContext(WebSocketPoolContext);
  if (!context) {
    throw new Error('useWebSocketPool must be used within a WebSocketPoolProvider');
  }
  return context;
};

interface WebSocketPoolProviderProps {
  children: React.ReactNode;
  config?: Partial<PoolConfig>;
  enabled?: boolean;
}

export const WebSocketPoolProvider: React.FC<WebSocketPoolProviderProps> = ({
  children,
  config = {},
  enabled = true,
}) => {
  const poolRef = useRef<WebSocketPool | null>(null);
  const [metrics, setMetrics] = React.useState<PoolMetrics>({
    totalConnections: 0,
    activeConnections: 0,
    healthyConnections: 0,
    averageResponseTime: 0,
    totalMessages: 0,
    errors: 0,
  });

  const { isConnected } = useWebSocketContext();

  // Initialize pool when enabled and WebSocket is connected
  useEffect(() => {
    if (!enabled || !isConnected) {
      return;
    }

    const initializePool = async () => {
      try {
        const defaultConfig: PoolConfig = {
          maxConnections: 3,
          minConnections: 1,
          connectionTimeout: 10000,
          healthCheckInterval: 30000,
          loadBalancingStrategy: 'health-based',
          urls: ['ws://localhost:8001/ws/dashboard'],
          ...config,
        };

        poolRef.current = new WebSocketPool(defaultConfig);
        await poolRef.current.initialize();

        // Start metrics update interval
        const metricsInterval = setInterval(() => {
          if (poolRef.current) {
            setMetrics(poolRef.current.getMetrics());
          }
        }, 5000);

        return () => {
          clearInterval(metricsInterval);
          if (poolRef.current) {
            poolRef.current.shutdown();
          }
        };
      } catch (error) {
        console.error('Failed to initialize WebSocket pool:', error);
      }
    };

    const cleanup = initializePool();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [enabled, isConnected, config]);

  const sendMessage = async (message: any, priority: number = 0): Promise<void> => {
    if (!poolRef.current) {
      throw new Error('WebSocket pool not initialized');
    }
    await poolRef.current.sendMessage(message, priority);
  };

  const broadcastMessage = async (message: any): Promise<void> => {
    if (!poolRef.current) {
      throw new Error('WebSocket pool not initialized');
    }
    await poolRef.current.broadcastMessage(message);
  };

  const getConnectionCount = (): number => {
    return poolRef.current?.getConnectionCount() || 0;
  };

  const getHealthyConnectionCount = (): number => {
    return poolRef.current?.getHealthyConnectionCount() || 0;
  };

  const contextValue: WebSocketPoolContextType = {
    pool: poolRef.current,
    metrics,
    sendMessage,
    broadcastMessage,
    getConnectionCount,
    getHealthyConnectionCount,
  };

  return (
    <WebSocketPoolContext.Provider value={contextValue}>
      {children}
    </WebSocketPoolContext.Provider>
  );
}; 