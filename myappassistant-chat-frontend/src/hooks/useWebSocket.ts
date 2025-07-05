import { useEffect, useRef, useState, useCallback } from 'react';
import { z } from 'zod';

// --- ZOD SCHEMAS ---
export const WebSocketMessageSchema = z.object({
  type: z.string(),
  data: z.unknown(),
  timestamp: z.union([z.string(), z.number()]),
});

export const AgentStatusSchema = z.object({
  name: z.string(),
  status: z.enum(['online', 'offline', 'error', 'processing']),
  lastActivity: z.string(),
  responseTime: z.number().optional(),
  errorCount: z.number().optional(),
  confidence: z.number().optional(),
});

export const SystemMetricsSchema = z.object({
  cpu: z.number(),
  memory: z.number(),
  disk: z.number(),
  network: z.number(),
  activeConnections: z.number(),
  timestamp: z.string(),
});

export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type SystemMetrics = z.infer<typeof SystemMetricsSchema>;
export type WebSocketEvent = z.infer<typeof WebSocketMessageSchema>;

export interface UseWebSocketOptions {
  url?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  // Detect Tauri (native) vs browser
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  const defaultUrl = isTauri
    ? 'ws://127.0.0.1:8001/ws/dashboard'
    : 'ws://localhost:8001/ws/dashboard';
  const {
    url = defaultUrl,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000, // 30 seconds
    heartbeatTimeout = 10000, // 10 seconds
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef<boolean>(true);
  const lastPongRef = useRef<number>(Date.now());

  // Heartbeat mechanism
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Send ping
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        
        // Set timeout for pong response
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }
        
        heartbeatTimeoutRef.current = setTimeout(() => {
          const timeSinceLastPong = Date.now() - lastPongRef.current;
          if (timeSinceLastPong > heartbeatTimeout) {
            console.warn('[WebSocket] Heartbeat timeout - reconnecting');
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

  const validateMessage = (data: unknown): WebSocketEvent | null => {
    const result = WebSocketMessageSchema.safeParse(data);
    if (!result.success) {
      console.error('[WebSocket] Invalid message format:', result.error);
      return null;
    }
    return result.data;
  };

  const connect = useCallback(() => {
    if (!shouldReconnectRef.current) {
      console.log('[WebSocket] Reconnect disabled, skipping connection attempt');
      return;
    }

    try {
      console.log('[WebSocket] Connecting to', url, 'isTauri:', isTauri);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        setIsConnected(true);
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
          console.error('[WebSocket] Error parsing message:', parseError);
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
              console.error('[WebSocket] Invalid agent_status payload:', data.data);
              return;
            }
            setAgents(prevAgents => {
              const updatedAgents = [...prevAgents];
              const existingIndex = updatedAgents.findIndex(agent => agent.name === agentParse.data.name);
              if (existingIndex >= 0) {
                updatedAgents[existingIndex] = { ...updatedAgents[existingIndex], ...agentParse.data };
              } else {
                updatedAgents.push(agentParse.data);
              }
              return updatedAgents;
            });
            break;
          }
          case 'system_metrics': {
            const metricsParse = SystemMetricsSchema.safeParse(data.data);
            if (!metricsParse.success) {
              console.error('[WebSocket] Invalid system_metrics payload:', data.data);
              return;
            }
            setSystemMetrics(metricsParse.data);
            break;
          }
          case 'error': {
            const msg = typeof (data.data as any)?.message === 'string' ? (data.data as any).message : 'Unknown error';
            setError(msg);
            break;
          }
          case 'notification':
            setEvents(prev => [...prev.slice(-9), data]);
            break;
          default:
            console.warn('[WebSocket] Unknown event type:', data.type);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        stopHeartbeat();
        
        // Handle specific close codes
        if (event.code === 1001) {
          console.log('[WebSocket] Connection closed due to "going away" - this is normal for page unloads');
        }
        
        // Only attempt reconnect if not manually closed and autoReconnect is enabled
        if (autoReconnect && shouldReconnectRef.current && event.code !== 1000) {
          if (reconnectAttempts < maxReconnectAttempts) {
            console.log(`[WebSocket] Attempting reconnect ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
            const timeout = setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              connect();
            }, reconnectInterval);
            
            reconnectTimeoutRef.current = timeout;
          } else {
            console.error('[WebSocket] Max reconnect attempts reached');
            setError('Max reconnect attempts reached');
          }
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Connection error:', event);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('[WebSocket] Error creating connection:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [url, autoReconnect, reconnectInterval, maxReconnectAttempts, reconnectAttempts, startHeartbeat, stopHeartbeat]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnecting...');
    shouldReconnectRef.current = false;
    
    // Clear all timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    // Close WebSocket with proper code
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, [stopHeartbeat]);

  const sendMessage = useCallback((message: any) => {
    // Walidacja outgoing message
    const result = WebSocketMessageSchema.safeParse(message);
    if (!result.success) {
      console.error('[WebSocket] Attempted to send invalid message:', result.error);
      throw new Error('Invalid WebSocket message format');
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message - connection not open');
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

  // Main connection effect with proper cleanup
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    
    // Cleanup function - this is the critical fix for the 1001 error
    return () => {
      console.log('[WebSocket] Component unmounting - cleaning up');
      shouldReconnectRef.current = false;
      
      // Clear all timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      stopHeartbeat();
      
      // Close WebSocket with proper code
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [connect, stopHeartbeat]);

  return {
    isConnected,
    agents,
    systemMetrics,
    events,
    error,
    reconnectAttempts,
    sendMessage,
    requestAgentStatus,
    requestSystemMetrics,
    subscribeToAgent,
    unsubscribeFromAgent,
    connect,
    disconnect,
  };
} 