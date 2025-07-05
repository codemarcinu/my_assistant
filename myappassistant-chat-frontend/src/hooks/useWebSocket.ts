import { useEffect, useRef, useState, useCallback } from 'react';

export interface AgentStatus {
  name: string;
  status: 'online' | 'offline' | 'error' | 'processing';
  lastActivity: string;
  responseTime?: number;
  errorCount?: number;
  confidence?: number;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeConnections: number;
  timestamp: string;
}

export interface WebSocketEvent {
  type: 'agent_status' | 'system_metrics' | 'error' | 'notification';
  data: any;
  timestamp: string;
}

export interface UseWebSocketOptions {
  url?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
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
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      console.log('[WebSocket] Connecting to', url, 'isTauri:', isTauri);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          
          switch (data.type) {
            case 'agent_status':
              setAgents(prevAgents => {
                const updatedAgents = [...prevAgents];
                const existingIndex = updatedAgents.findIndex(agent => agent.name === data.data.name);
                
                if (existingIndex >= 0) {
                  updatedAgents[existingIndex] = { ...updatedAgents[existingIndex], ...data.data };
                } else {
                  updatedAgents.push(data.data);
                }
                
                return updatedAgents;
              });
              break;
              
            case 'system_metrics':
              setSystemMetrics(data.data);
              break;
              
            case 'error':
              setError(data.data.message);
              break;
              
            case 'notification':
              // Add to events list
              setEvents(prev => [...prev.slice(-9), data]); // Keep last 10 events
              break;
              
            default:
              console.warn('Unknown WebSocket event type:', data.type);
          }
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason, event);
        setIsConnected(false);
        
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          const timeout = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
          
          reconnectTimeoutRef.current = timeout;
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [url, autoReconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
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

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

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