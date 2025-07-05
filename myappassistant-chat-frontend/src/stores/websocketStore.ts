import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AgentStatus, SystemMetrics, WebSocketEvent, UseWebSocketOptions } from '@/hooks/useWebSocket';

export interface WebSocketState {
  // Connection state
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
  
  // Data state
  agents: AgentStatus[];
  systemMetrics: SystemMetrics | null;
  events: WebSocketEvent[];
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  
  // Data actions
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setReconnectAttempts: (attempts: number) => void;
  updateAgents: (agents: AgentStatus[]) => void;
  updateSystemMetrics: (metrics: SystemMetrics | null) => void;
  addEvent: (event: WebSocketEvent) => void;
  clearEvents: () => void;
  
  // Request methods
  requestAgentStatus: () => void;
  requestSystemMetrics: () => void;
  subscribeToAgent: (agentName: string) => void;
  unsubscribeFromAgent: (agentName: string) => void;
}

export const useWebSocketStore = create<WebSocketState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      error: null,
      reconnectAttempts: 0,
      agents: [],
      systemMetrics: null,
      events: [],
      
      // Connection management
      connect: () => {
        // This will be implemented by the WebSocket manager
        console.log('[WebSocketStore] Connect requested');
      },
      
      disconnect: () => {
        set({ isConnected: false, error: null });
        console.log('[WebSocketStore] Disconnect requested');
      },
      
      sendMessage: (message: any) => {
        // This will be implemented by the WebSocket manager
        console.log('[WebSocketStore] Send message requested:', message);
      },
      
      // State setters
      setConnected: (connected: boolean) => {
        set({ isConnected: connected });
        if (connected) {
          set({ error: null, reconnectAttempts: 0 });
        }
      },
      
      setError: (error: string | null) => {
        set({ error });
      },
      
      setReconnectAttempts: (attempts: number) => {
        set({ reconnectAttempts: attempts });
      },
      
      updateAgents: (agents: AgentStatus[]) => {
        set({ agents });
      },
      
      updateSystemMetrics: (metrics: SystemMetrics | null) => {
        set({ systemMetrics: metrics });
      },
      
      addEvent: (event: WebSocketEvent) => {
        set((state) => ({
          events: [...state.events.slice(-9), event] // Keep last 10 events
        }));
      },
      
      clearEvents: () => {
        set({ events: [] });
      },
      
      // Request methods
      requestAgentStatus: () => {
        get().sendMessage({ type: 'request_agent_status' });
      },
      
      requestSystemMetrics: () => {
        get().sendMessage({ type: 'request_system_metrics' });
      },
      
      subscribeToAgent: (agentName: string) => {
        get().sendMessage({ type: 'subscribe_agent', agent: agentName });
      },
      
      unsubscribeFromAgent: (agentName: string) => {
        get().sendMessage({ type: 'unsubscribe_agent', agent: agentName });
      },
    }),
    {
      name: 'websocket-store',
      partialize: (state) => ({
        // Only persist non-sensitive data
        agents: state.agents,
        systemMetrics: state.systemMetrics,
        events: state.events,
      }),
    }
  )
); 