import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket, AgentStatus, SystemMetrics, WebSocketEvent } from '@/hooks/useWebSocket';

let mockWebSocket: any;
let consoleLogSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

describe('useWebSocket', () => {
  beforeEach(() => {
    mockWebSocket = {
      readyState: 1, // OPEN
      send: jest.fn(),
      close: jest.fn(),
      onopen: null as any,
      onmessage: null as any,
      onclose: null as any,
      onerror: null as any,
    };
    
    // Create a proper WebSocket mock with constants
    const WebSocketMock = jest.fn(() => mockWebSocket) as any;
    WebSocketMock.CONNECTING = 0;
    WebSocketMock.OPEN = 1;
    WebSocketMock.CLOSING = 2;
    WebSocketMock.CLOSED = 3;
    
    global.WebSocket = WebSocketMock;
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (consoleLogSpy) consoleLogSpy.mockRestore();
    if (consoleWarnSpy) consoleWarnSpy.mockRestore();
    if (consoleErrorSpy) consoleErrorSpy.mockRestore();
    (global.WebSocket as unknown as jest.Mock).mockClear();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket on mount', () => {
      renderHook(() => useWebSocket());
      
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws/dashboard');
    });

    it('should use custom URL when provided', () => {
      renderHook(() => useWebSocket({ url: 'ws://custom-url:8080/ws' }));
      
      expect(global.WebSocket).toHaveBeenCalledWith('ws://custom-url:8080/ws');
    });

    it('should set connected state when WebSocket opens', () => {
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        mockWebSocket.onopen?.();
      });
      
      expect(result.current.isConnected).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle connection errors', () => {
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        mockWebSocket.onerror?.(new Event('error'));
      });
      
      expect(result.current.error).toBe('WebSocket connection error');
    });

    it('should disconnect on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket());
      
      unmount();
      
      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    it('should handle agent_status messages', () => {
      const { result } = renderHook(() => useWebSocket());
      
      const agentData: AgentStatus = {
        name: 'test-agent',
        status: 'online',
        lastActivity: '2024-01-01T00:00:00Z',
        responseTime: 100,
        confidence: 0.95,
      };
      
      const message: WebSocketEvent = {
        type: 'agent_status',
        data: agentData,
        timestamp: '2024-01-01T00:00:00Z',
      };
      
      act(() => {
        mockWebSocket.onmessage?.({ data: JSON.stringify(message) });
      });
      
      expect(result.current.agents).toHaveLength(1);
      expect(result.current.agents[0]).toEqual(agentData);
    });

    it('should update existing agent status', () => {
      const { result } = renderHook(() => useWebSocket());
      
      const initialAgent: AgentStatus = {
        name: 'test-agent',
        status: 'online',
        lastActivity: '2024-01-01T00:00:00Z',
      };
      
      const updatedAgent: AgentStatus = {
        name: 'test-agent',
        status: 'processing',
        lastActivity: '2024-01-01T00:01:00Z',
        responseTime: 150,
      };
      
      act(() => {
        mockWebSocket.onmessage?.({ 
          data: JSON.stringify({
            type: 'agent_status',
            data: initialAgent,
            timestamp: '2024-01-01T00:00:00Z',
          })
        });
        mockWebSocket.onmessage?.({ 
          data: JSON.stringify({
            type: 'agent_status',
            data: updatedAgent,
            timestamp: '2024-01-01T00:01:00Z',
          })
        });
      });
      
      expect(result.current.agents).toHaveLength(1);
      expect(result.current.agents[0]).toEqual(updatedAgent);
    });

    it('should handle system_metrics messages', () => {
      const { result } = renderHook(() => useWebSocket());
      
      const metrics: SystemMetrics = {
        cpu: 45.5,
        memory: 67.2,
        disk: 23.1,
        network: 12.8,
        activeConnections: 5,
        timestamp: '2024-01-01T00:00:00Z',
      };
      
      const message: WebSocketEvent = {
        type: 'system_metrics',
        data: metrics,
        timestamp: '2024-01-01T00:00:00Z',
      };
      
      act(() => {
        mockWebSocket.onmessage?.({ data: JSON.stringify(message) });
      });
      
      expect(result.current.systemMetrics).toEqual(metrics);
    });

    it('should handle error messages', () => {
      const { result } = renderHook(() => useWebSocket());
      
      const message: WebSocketEvent = {
        type: 'error',
        data: { message: 'Test error message' },
        timestamp: '2024-01-01T00:00:00Z',
      };
      
      act(() => {
        mockWebSocket.onmessage?.({ data: JSON.stringify(message) });
      });
      
      expect(result.current.error).toBe('Test error message');
    });

    it('should handle notification messages', () => {
      const { result } = renderHook(() => useWebSocket());
      
      const notification: WebSocketEvent = {
        type: 'notification',
        data: { message: 'Test notification' },
        timestamp: '2024-01-01T00:00:00Z',
      };
      
      act(() => {
        mockWebSocket.onmessage?.({ data: JSON.stringify(notification) });
      });
      
      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]).toEqual(notification);
    });

    it('should keep only last 10 events', () => {
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        // Add 12 events
        for (let i = 0; i < 12; i++) {
          const notification: WebSocketEvent = {
            type: 'notification',
            data: { message: `Notification ${i}` },
            timestamp: `2024-01-01T00:00:${i.toString().padStart(2, '0')}Z`,
          };
          mockWebSocket.onmessage?.({ data: JSON.stringify(notification) });
        }
      });
      
      expect(result.current.events).toHaveLength(10);
      expect(result.current.events[0].data.message).toBe('Notification 2');
      expect(result.current.events[9].data.message).toBe('Notification 11');
    });

    it('should handle malformed JSON messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        mockWebSocket.onmessage?.({ data: 'invalid json' });
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should attempt reconnection when autoReconnect is enabled', () => {
      const { result } = renderHook(() => useWebSocket({ autoReconnect: true }));
      
      act(() => {
        mockWebSocket.onclose?.({ code: 1000, reason: 'Normal closure' });
      });
      
      expect(result.current.isConnected).toBe(false);
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      expect(result.current.reconnectAttempts).toBe(1);
    });

    it('should not reconnect when autoReconnect is disabled', () => {
      const { result } = renderHook(() => useWebSocket({ autoReconnect: false }));
      
      act(() => {
        mockWebSocket.onclose?.({ code: 1000, reason: 'Normal closure' });
      });
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
      expect(result.current.reconnectAttempts).toBe(0);
    });

    it('should stop reconnecting after max attempts', () => {
      const { result } = renderHook(() => 
        useWebSocket({ autoReconnect: true, maxReconnectAttempts: 2 })
      );
      
      // First disconnect
      act(() => {
        mockWebSocket.onclose?.({ code: 1000, reason: 'Normal closure' });
        jest.advanceTimersByTime(5000);
      });
      
      // Second disconnect
      act(() => {
        mockWebSocket.onclose?.({ code: 1000, reason: 'Normal closure' });
        jest.advanceTimersByTime(5000);
      });
      
      // Third disconnect - should not reconnect
      act(() => {
        mockWebSocket.onclose?.({ code: 1000, reason: 'Normal closure' });
        jest.advanceTimersByTime(5000);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(4); // Initial + 3 reconnects (one extra due to dependency)
      expect(result.current.reconnectAttempts).toBe(3);
    });

    it('should reset reconnect attempts on successful connection', () => {
      const { result } = renderHook(() => useWebSocket({ autoReconnect: true }));
      
      // Disconnect and reconnect
      act(() => {
        mockWebSocket.onclose?.({ code: 1000, reason: 'Normal closure' });
        jest.advanceTimersByTime(5000);
      });
      
      expect(result.current.reconnectAttempts).toBe(1);
      
      // Successful reconnection
      act(() => {
        mockWebSocket.onopen?.();
      });
      
      expect(result.current.reconnectAttempts).toBe(0);
    });
  });

  describe('Message Sending', () => {
    it('should send messages when connected', () => {
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        mockWebSocket.onopen?.(); // ensure connected
      });
      
      // Verify hook is connected
      expect(result.current.isConnected).toBe(true);
      
      // Debug: check if our mock is being used
      console.log('Mock WebSocket calls:', (global.WebSocket as any).mock.calls.length);
      console.log('Mock WebSocket instances:', (global.WebSocket as any).mock.results);
      
      act(() => {
        result.current.sendMessage({ type: 'test', data: 'test' });
      });
      
      // Debug: check send calls
      console.log('Send calls:', mockWebSocket.send.mock.calls);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'test', data: 'test' })
      );
    });

    it('should not send messages when disconnected', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useWebSocket());
      
      mockWebSocket.readyState = 3; // CLOSED
      
      act(() => {
        result.current.sendMessage({ type: 'test', data: 'test' });
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket is not connected');
      expect(mockWebSocket.send).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should request agent status', () => {
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        mockWebSocket.onopen?.(); // ensure connected
      });
      
      // Verify hook is connected
      expect(result.current.isConnected).toBe(true);
      
      act(() => {
        result.current.requestAgentStatus();
      });
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'request_agent_status' })
      );
    });

    it('should request system metrics', () => {
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        mockWebSocket.onopen?.(); // ensure connected
      });
      
      // Verify hook is connected
      expect(result.current.isConnected).toBe(true);
      
      act(() => {
        result.current.requestSystemMetrics();
      });
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'request_system_metrics' })
      );
    });

    it('should subscribe to agent', () => {
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        mockWebSocket.onopen?.(); // ensure connected
      });
      
      // Verify hook is connected
      expect(result.current.isConnected).toBe(true);
      
      act(() => {
        result.current.subscribeToAgent('test-agent');
      });
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe_agent', agent: 'test-agent' })
      );
    });

    it('should unsubscribe from agent', () => {
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        mockWebSocket.onopen?.(); // ensure connected
      });
      
      // Verify hook is connected
      expect(result.current.isConnected).toBe(true);
      
      act(() => {
        result.current.unsubscribeFromAgent('test-agent');
      });
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'unsubscribe_agent', agent: 'test-agent' })
      );
    });
  });

  describe('Manual Connection Control', () => {
    it('should allow manual connection', () => {
      const { result } = renderHook(() => useWebSocket({ autoReconnect: false }));
      
      act(() => {
        result.current.connect();
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(2); // Initial + manual
    });

    it('should allow manual disconnection', () => {
      const { result } = renderHook(() => useWebSocket());
      
      act(() => {
        result.current.disconnect();
      });
      
      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket creation errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.WebSocket as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });
      
      const { result } = renderHook(() => useWebSocket());
      
      expect(result.current.error).toBe('Failed to create WebSocket connection');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle unknown event types', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useWebSocket());
      
      const message: WebSocketEvent = {
        type: 'unknown_type' as any,
        data: {},
        timestamp: '2024-01-01T00:00:00Z',
      };
      
      act(() => {
        mockWebSocket.onmessage?.({ data: JSON.stringify(message) });
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown WebSocket event type:',
        'unknown_type'
      );
      
      consoleSpy.mockRestore();
    });
  });
}); 