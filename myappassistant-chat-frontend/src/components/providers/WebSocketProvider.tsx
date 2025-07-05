"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useWebSocketStore } from '@/stores/websocketStore';
import { AgentStatus, SystemMetrics, WebSocketEvent, WebSocketMessageSchema, AgentStatusSchema, SystemMetricsSchema } from '@/hooks/useWebSocket';

interface WebSocketContextType {
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
  agents: AgentStatus[];
  systemMetrics: SystemMetrics | null;
  events: WebSocketEvent[];
  sendMessage: (message: any) => void;
  requestAgentStatus: () => void;
  requestSystemMetrics: () => void;
  subscribeToAgent: (agentName: string) => void;
  unsubscribeFromAgent: (agentName: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url,
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
  heartbeatInterval = 30000,
  heartbeatTimeout = 10000,
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef<boolean>(true);
  const lastPongRef = useRef<number>(Date.now());

  // Zustand store
  const {
    isConnected,
    error,
    reconnectAttempts,
    agents,
    systemMetrics,
    events,
    setConnected,
    setError,
    setReconnectAttempts,
    updateAgents,
    updateSystemMetrics,
    addEvent,
  } = useWebSocketStore();
  
  const store = useWebSocketStore();

  // Detect Tauri (native) vs browser
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  const defaultUrl = isTauri
    ? 'ws://127.0.0.1:8001/ws/dashboard'
    : 'ws://localhost:8001/ws/dashboard';
  const wsUrl = url || defaultUrl;

  const validateMessage = (data: unknown): WebSocketEvent | null => {
    const result = WebSocketMessageSchema.safeParse(data);
    if (!result.success) {
      console.error('[WebSocketProvider] Invalid message format:', result.error);
      return null;
    }
    return result.data;
  };

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }
        
        heartbeatTimeoutRef.current = setTimeout(() => {
          const timeSinceLastPong = Date.now() - lastPongRef.current;
          if (timeSinceLastPong > heartbeatTimeout) {
            console.warn('[WebSocketProvider] Heartbeat timeout - reconnecting');
            if (wsRef.current) {
              wsRef.current.close(1000, 'Heartbeat timeout');
            }
          }
        }, heartbeatTimeout);
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, heartbeatTimeout]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!shouldReconnectRef.current) {
      console.log('[WebSocketProvider] Reconnect disabled, skipping connection attempt');
      return;
    }

    try {
      console.log('[WebSocketProvider] Connecting to', wsUrl, 'isTauri:', isTauri);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocketProvider] Connected successfully');
        setConnected(true);
        setError(null);
        setReconnectAttempts(0);
        lastPongRef.current = Date.now();
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(event.data);
        } catch (parseError) {
          console.error('[WebSocketProvider] Error parsing message:', parseError);
          return;
        }
        
        const data = validateMessage(parsed);
        if (!data) return;
        
        // Handle pong response for heartbeat
        if (data.type === 'pong') {
          lastPongRef.current = Date.now();
          if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
            heartbeatTimeoutRef.current = null;
          }
          return;
        }
        
        switch (data.type) {
          case 'agent_status': {
            const agentParse = AgentStatusSchema.safeParse(data.data);
            if (!agentParse.success) {
              console.error('[WebSocketProvider] Invalid agent_status payload:', data.data);
              return;
            }
            const updatedAgents = [...agents];
            const existingIndex = updatedAgents.findIndex(agent => agent.name === agentParse.data.name);
            if (existingIndex >= 0) {
              updatedAgents[existingIndex] = { ...updatedAgents[existingIndex], ...agentParse.data };
            } else {
              updatedAgents.push(agentParse.data);
            }
            updateAgents(updatedAgents);
            break;
          }
          case 'system_metrics': {
            const metricsParse = SystemMetricsSchema.safeParse(data.data);
            if (!metricsParse.success) {
              console.error('[WebSocketProvider] Invalid system_metrics payload:', data.data);
              return;
            }
            updateSystemMetrics(metricsParse.data);
            break;
          }
          case 'error': {
            const msg = typeof (data.data as any)?.message === 'string' ? (data.data as any).message : 'Unknown error';
            setError(msg);
            break;
          }
          case 'notification':
            addEvent(data);
            break;
          default:
            console.warn('[WebSocketProvider] Unknown event type:', data.type);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocketProvider] Disconnected:', event.code, event.reason);
        setConnected(false);
        stopHeartbeat();
        
        if (event.code === 1001) {
          console.log('[WebSocketProvider] Connection closed due to "going away" - this is normal for page unloads');
        }
        
        if (autoReconnect && shouldReconnectRef.current && event.code !== 1000) {
          if (reconnectAttempts < maxReconnectAttempts) {
            console.log(`[WebSocketProvider] Attempting reconnect ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
                         const timeout = setTimeout(() => {
               setReconnectAttempts(reconnectAttempts + 1);
               connect();
             }, reconnectInterval);
            
            reconnectTimeoutRef.current = timeout;
          } else {
            console.error('[WebSocketProvider] Max reconnect attempts reached');
            setError('Max reconnect attempts reached');
          }
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocketProvider] Connection error:', event);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('[WebSocketProvider] Error creating connection:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [wsUrl, isTauri, autoReconnect, reconnectInterval, maxReconnectAttempts, reconnectAttempts, startHeartbeat, stopHeartbeat, setConnected, setError, setReconnectAttempts, updateAgents, updateSystemMetrics, addEvent]);

  const disconnect = useCallback(() => {
    console.log('[WebSocketProvider] Disconnecting...');
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setConnected(false);
  }, [stopHeartbeat, setConnected]);

  const sendMessage = useCallback((message: any) => {
    const result = WebSocketMessageSchema.safeParse(message);
    if (!result.success) {
      console.error('[WebSocketProvider] Attempted to send invalid message:', result.error);
      throw new Error('Invalid WebSocket message format');
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocketProvider] Cannot send message - connection not open');
      throw new Error('WebSocket is not connected');
    }
  }, []);

  const requestAgentStatus = useCallback(() => {
    sendMessage({ type: 'request_agent_status' });
  }, [sendMessage]);

  const requestSystemMetrics = useCallback(() => {
    sendMessage({ type: 'request_system_metrics' });
  }, [sendMessage]);

  const subscribeToAgent = useCallback((agentName: string) => {
    sendMessage({ type: 'subscribe_agent', agent: agentName });
  }, [sendMessage]);

  const unsubscribeFromAgent = useCallback((agentName: string) => {
    sendMessage({ type: 'unsubscribe_agent', agent: agentName });
  }, [sendMessage]);

  // Connect on mount
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    
    return () => {
      console.log('[WebSocketProvider] Component unmounting - cleaning up');
      shouldReconnectRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      stopHeartbeat();
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [connect, stopHeartbeat]);

  const contextValue: WebSocketContextType = {
    isConnected,
    error,
    reconnectAttempts,
    agents,
    systemMetrics,
    events,
    sendMessage,
    requestAgentStatus,
    requestSystemMetrics,
    subscribeToAgent,
    unsubscribeFromAgent,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}; 