# WebSocket API Reference - FoodSave AI

## 📋 Spis treści

1. [WebSocketProvider](#websocketprovider)
2. [useWebSocketContext](#usewebsocketcontext)
3. [WebSocketPool](#websocketpool)
4. [useOfflineSync](#useofflinesync)
5. [Monitoring Components](#monitoring-components)
6. [Types & Interfaces](#types--interfaces)
7. [Error Handling](#error-handling)
8. [Configuration](#configuration)

---

## 🏗️ WebSocketProvider

### Props

```typescript
interface WebSocketProviderProps {
  url?: string;                    // WebSocket URL
  autoReconnect?: boolean;         // Auto reconnect on disconnect
  reconnectInterval?: number;      // Reconnect delay (ms)
  maxReconnectAttempts?: number;   // Max reconnect attempts
  heartbeatInterval?: number;      // Heartbeat interval (ms)
  heartbeatTimeout?: number;       // Heartbeat timeout (ms)
  children: React.ReactNode;       // React children
}
```

### Usage

```tsx
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';

function App() {
  return (
    <WebSocketProvider
      url="ws://localhost:8001/ws/dashboard"
      autoReconnect={true}
      reconnectInterval={5000}
      maxReconnectAttempts={5}
      heartbeatInterval={30000}
      heartbeatTimeout={10000}
    >
      <YourApp />
    </WebSocketProvider>
  );
}
```

### Default Values

```typescript
const defaultProps = {
  url: 'ws://localhost:8001/ws/dashboard',
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  heartbeatTimeout: 10000
};
```

---

## 🎣 useWebSocketContext

### Return Type

```typescript
interface WebSocketContextType {
  // Connection state
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastConnected: number | null;
  
  // Data
  agents: AgentStatus[];
  systemMetrics: SystemMetrics;
  events: WebSocketEvent[];
  
  // Methods
  sendMessage: (message: WebSocketMessage) => Promise<void>;
  requestAgentStatus: () => void;
  requestSystemMetrics: () => void;
  subscribeToAgent: (agentName: string) => void;
  unsubscribeFromAgent: (agentName: string) => void;
  reconnect: () => void;
  disconnect: () => void;
}
```

### Usage

```tsx
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

function MyComponent() {
  const {
    isConnected,
    error,
    agents,
    systemMetrics,
    sendMessage,
    requestAgentStatus,
    subscribeToAgent
  } = useWebSocketContext();

  useEffect(() => {
    if (isConnected) {
      requestAgentStatus();
      subscribeToAgent('receipt-processor');
    }
  }, [isConnected]);

  const handleSendMessage = async () => {
    try {
      await sendMessage({
        type: 'process_receipt',
        data: { imageUrl: 'path/to/image.jpg' },
        priority: 5
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {error && <p>Error: {error}</p>}
      <p>Agents: {agents.length}</p>
      <p>CPU Usage: {systemMetrics.cpuUsage}%</p>
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
}
```

### Methods

#### sendMessage

```typescript
sendMessage(message: WebSocketMessage): Promise<void>
```

Sends a message to the WebSocket server.

```tsx
// Basic message
await sendMessage({
  type: 'test',
  data: 'Hello World'
});

// Message with priority
await sendMessage({
  type: 'urgent',
  data: { action: 'emergency' },
  priority: 10
});

// Message with callback
await sendMessage({
  type: 'process_receipt',
  data: { imageUrl: 'path/to/image.jpg' },
  callback: (response) => {
    console.log('Processing complete:', response);
  }
});
```

#### requestAgentStatus

```typescript
requestAgentStatus(): void
```

Requests current status of all agents.

```tsx
const handleRefreshAgents = () => {
  requestAgentStatus();
};
```

#### requestSystemMetrics

```typescript
requestSystemMetrics(): void
```

Requests current system metrics.

```tsx
const handleRefreshMetrics = () => {
  requestSystemMetrics();
};
```

#### subscribeToAgent

```typescript
subscribeToAgent(agentName: string): void
```

Subscribes to updates from a specific agent.

```tsx
useEffect(() => {
  if (isConnected) {
    subscribeToAgent('receipt-processor');
    subscribeToAgent('chat-agent');
  }
}, [isConnected]);
```

#### unsubscribeFromAgent

```typescript
unsubscribeFromAgent(agentName: string): void
```

Unsubscribes from updates from a specific agent.

```tsx
useEffect(() => {
  return () => {
    unsubscribeFromAgent('receipt-processor');
  };
}, []);
```

---

## 🏊 WebSocketPool

### Configuration

```typescript
interface PoolConfig {
  maxConnections: number;         // Maximum connections
  minConnections: number;         // Minimum connections
  connectionTimeout: number;      // Connection timeout (ms)
  healthCheckInterval: number;    // Health check interval (ms)
  loadBalancingStrategy: 'round-robin' | 'least-used' | 'health-based';
  urls: string[];                // WebSocket URLs
}
```

### WebSocketPoolProvider Props

```typescript
interface WebSocketPoolProviderProps {
  config: PoolConfig;
  enabled: boolean;
  children: React.ReactNode;
}
```

### Usage

```tsx
import { WebSocketPoolProvider } from '@/components/providers/WebSocketPoolProvider';

function App() {
  return (
    <WebSocketPoolProvider
      config={{
        maxConnections: 5,
        minConnections: 2,
        connectionTimeout: 10000,
        healthCheckInterval: 30000,
        loadBalancingStrategy: 'health-based',
        urls: [
          'ws://localhost:8001/ws/dashboard',
          'ws://localhost:8002/ws/dashboard'
        ]
      }}
      enabled={true}
    >
      <YourApp />
    </WebSocketPoolProvider>
  );
}
```

### useWebSocketPool Hook

```typescript
interface WebSocketPoolReturn {
  pool: WebSocketPool;
  metrics: PoolMetrics;
  sendMessage: (message: any, priority?: number) => Promise<void>;
  broadcastMessage: (message: any) => Promise<void>;
  getConnectionCount: () => number;
  getHealthyConnectionCount: () => number;
  addConnection: (url: string) => Promise<void>;
  removeConnection: (url: string) => void;
}
```

```tsx
import { useWebSocketPool } from '@/components/providers/WebSocketPoolProvider';

function MyComponent() {
  const {
    pool,
    metrics,
    sendMessage,
    broadcastMessage,
    getConnectionCount
  } = useWebSocketPool();

  const handleHighPriorityMessage = async () => {
    await sendMessage({ type: 'urgent' }, 10);
  };

  const handleBroadcast = async () => {
    await broadcastMessage({ type: 'notification' });
  };

  return (
    <div>
      <p>Total Connections: {getConnectionCount()}</p>
      <p>Healthy Connections: {metrics.healthyConnections}</p>
      <button onClick={handleHighPriorityMessage}>Send Urgent</button>
      <button onClick={handleBroadcast}>Broadcast</button>
    </div>
  );
}
```

---

## 📱 useOfflineSync

### Return Type

```typescript
interface OfflineSyncReturn {
  // State
  isOnline: boolean;
  offlineQueue: OfflineMessage[];
  isSyncing: boolean;
  lastSyncTime: number | null;
  
  // Methods
  cacheOfflineMessage: (message: any) => Promise<void>;
  syncOfflineMessages: () => Promise<void>;
  clearOfflineQueue: () => Promise<void>;
  sendMessageWithOfflineFallback: (message: any, sendFn: Function) => Promise<void>;
}
```

### Usage

```tsx
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

function MyComponent() {
  const { sendMessage } = useWebSocketContext();
  const {
    isOnline,
    offlineQueue,
    isSyncing,
    sendMessageWithOfflineFallback,
    syncOfflineMessages,
    clearOfflineQueue
  } = useOfflineSync();

  const handleSendMessage = async (message) => {
    await sendMessageWithOfflineFallback(message, sendMessage);
  };

  const handleSync = async () => {
    if (isOnline) {
      await syncOfflineMessages();
    }
  };

  return (
    <div>
      <p>Network: {isOnline ? '🟢 Online' : '🔴 Offline'}</p>
      <p>Queue Size: {offlineQueue.length}</p>
      <p>Syncing: {isSyncing ? 'Yes' : 'No'}</p>
      
      <button onClick={() => handleSendMessage({ type: 'test' })}>
        Send with Offline Fallback
      </button>
      
      <button onClick={handleSync} disabled={!isOnline || isSyncing}>
        Sync Now
      </button>
      
      <button onClick={clearOfflineQueue}>
        Clear Queue
      </button>
    </div>
  );
}
```

### Methods

#### sendMessageWithOfflineFallback

```typescript
sendMessageWithOfflineFallback(message: any, sendFn: Function): Promise<void>
```

Sends a message with offline fallback. If offline, message is cached.

```tsx
const handleSendMessage = async (message) => {
  await sendMessageWithOfflineFallback(message, sendMessage);
};
```

#### syncOfflineMessages

```typescript
syncOfflineMessages(): Promise<void>
```

Synchronizes all cached offline messages.

```tsx
const handleSync = async () => {
  if (isOnline) {
    await syncOfflineMessages();
  }
};
```

#### clearOfflineQueue

```typescript
clearOfflineQueue(): Promise<void>
```

Clears all cached offline messages.

```tsx
const handleClear = async () => {
  await clearOfflineQueue();
};
```

---

## 📊 Monitoring Components

### WebSocketMetrics

```tsx
import { WebSocketMetrics } from '@/components/monitoring/WebSocketMetrics';

function AnalyticsPage() {
  return (
    <div>
      <h1>WebSocket Monitoring</h1>
      <WebSocketMetrics />
    </div>
  );
}
```

#### Props

```typescript
interface WebSocketMetricsProps {
  showPrometheusExport?: boolean;  // Show Prometheus export button
  refreshInterval?: number;        // Auto refresh interval (ms)
  maxEvents?: number;              // Max events to display
}
```

### PoolMetrics

```tsx
import { PoolMetrics } from '@/components/monitoring/PoolMetrics';

function AnalyticsPage() {
  return (
    <div>
      <h1>Connection Pool Monitoring</h1>
      <PoolMetrics />
    </div>
  );
}
```

#### Props

```typescript
interface PoolMetricsProps {
  showDetails?: boolean;           // Show detailed metrics
  refreshInterval?: number;        // Auto refresh interval (ms)
}
```

### OfflineStatus

```tsx
import { OfflineStatus } from '@/components/monitoring/OfflineStatus';

function AnalyticsPage() {
  return (
    <div>
      <h1>Offline Status</h1>
      <OfflineStatus />
    </div>
  );
}
```

#### Props

```typescript
interface OfflineStatusProps {
  showQueueDetails?: boolean;      // Show queue details
  showSyncButton?: boolean;        // Show sync button
  refreshInterval?: number;        // Auto refresh interval (ms)
}
```

---

## 📝 Types & Interfaces

### WebSocketMessage

```typescript
interface WebSocketMessage {
  type: string;                    // Message type
  data?: any;                      // Message data
  priority?: number;               // Message priority (1-10)
  callback?: (response: any) => void; // Response callback
  timestamp?: number;              // Message timestamp
  id?: string;                     // Message ID
}
```

### AgentStatus

```typescript
interface AgentStatus {
  name: string;                    // Agent name
  status: 'online' | 'offline' | 'busy' | 'error';
  lastActivity: string;            // ISO timestamp
  responseTime?: number;           // Response time (ms)
  error?: string;                  // Error message
  metrics?: AgentMetrics;          // Agent metrics
}
```

### SystemMetrics

```typescript
interface SystemMetrics {
  cpuUsage: number;                // CPU usage percentage
  memoryUsage: number;             // Memory usage percentage
  activeConnections: number;       // Active connections
  messageRate: number;             // Messages per second
  errorRate: number;               // Error rate percentage
  uptime: number;                  // System uptime (seconds)
}
```

### WebSocketEvent

```typescript
interface WebSocketEvent {
  type: 'connect' | 'disconnect' | 'message' | 'error' | 'reconnect';
  timestamp: number;               // Event timestamp
  data?: any;                      // Event data
  error?: string;                  // Error message
}
```

### OfflineMessage

```typescript
interface OfflineMessage {
  id: string;                      // Message ID
  message: any;                    // Original message
  timestamp: number;               // Cache timestamp
  attempts: number;                // Sync attempts
  lastAttempt?: number;            // Last sync attempt
}
```

### PoolMetrics

```typescript
interface PoolMetrics {
  totalConnections: number;        // Total connections
  healthyConnections: number;      // Healthy connections
  failedConnections: number;       // Failed connections
  averageResponseTime: number;     // Average response time
  messageRate: number;             // Messages per second
  errorRate: number;               // Error rate percentage
  loadBalancingStrategy: string;   // Current strategy
}
```

---

## ❌ Error Handling

### Error Types

```typescript
enum WebSocketErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  HEARTBEAT_TIMEOUT = 'HEARTBEAT_TIMEOUT',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  POOL_EXHAUSTED = 'POOL_EXHAUSTED'
}
```

### Error Handling Example

```tsx
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

function MyComponent() {
  const { error, sendMessage } = useWebSocketContext();

  const handleSendMessage = async (message) => {
    try {
      await sendMessage(message);
    } catch (error) {
      switch (error.type) {
        case 'CONNECTION_FAILED':
          console.error('Connection failed, retrying...');
          break;
        case 'HEARTBEAT_TIMEOUT':
          console.error('Heartbeat timeout, reconnecting...');
          break;
        case 'INVALID_MESSAGE':
          console.error('Invalid message format:', error.message);
          break;
        default:
          console.error('Unknown error:', error);
      }
    }
  };

  if (error) {
    return (
      <div className="error">
        <p>WebSocket Error: {error}</p>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => handleSendMessage({ type: 'test' })}>
        Send Message
      </button>
    </div>
  );
}
```

### Error Boundary

```tsx
import { WebSocketErrorBoundary } from '@/components/WebSocketErrorBoundary';

function App() {
  return (
    <WebSocketErrorBoundary
      fallback={<div>WebSocket Error - Please refresh</div>}
      onError={(error) => {
        console.error('WebSocket Error:', error);
        // Send to error tracking service
      }}
    >
      <YourApp />
    </WebSocketErrorBoundary>
  );
}
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8001/ws/dashboard
NEXT_PUBLIC_WEBSOCKET_DEBUG=true
NEXT_PUBLIC_WEBSOCKET_HEARTBEAT_INTERVAL=30000
NEXT_PUBLIC_WEBSOCKET_RECONNECT_ATTEMPTS=5
NEXT_PUBLIC_WEBSOCKET_RECONNECT_INTERVAL=5000
NEXT_PUBLIC_WEBSOCKET_HEARTBEAT_TIMEOUT=10000

# Pool Configuration
NEXT_PUBLIC_WEBSOCKET_POOL_ENABLED=true
NEXT_PUBLIC_WEBSOCKET_POOL_MAX_CONNECTIONS=5
NEXT_PUBLIC_WEBSOCKET_POOL_MIN_CONNECTIONS=2
NEXT_PUBLIC_WEBSOCKET_POOL_CONNECTION_TIMEOUT=10000
NEXT_PUBLIC_WEBSOCKET_POOL_HEALTH_CHECK_INTERVAL=30000

# Offline Configuration
NEXT_PUBLIC_OFFLINE_QUEUE_MAX_SIZE=100
NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL=60000
NEXT_PUBLIC_OFFLINE_MAX_SYNC_ATTEMPTS=3
```

### Runtime Configuration

```typescript
// lib/websocket-config.ts
export const WebSocketConfig = {
  url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8001/ws/dashboard',
  debug: process.env.NEXT_PUBLIC_WEBSOCKET_DEBUG === 'true',
  heartbeat: {
    interval: parseInt(process.env.NEXT_PUBLIC_WEBSOCKET_HEARTBEAT_INTERVAL || '30000'),
    timeout: parseInt(process.env.NEXT_PUBLIC_WEBSOCKET_HEARTBEAT_TIMEOUT || '10000')
  },
  reconnect: {
    attempts: parseInt(process.env.NEXT_PUBLIC_WEBSOCKET_RECONNECT_ATTEMPTS || '5'),
    interval: parseInt(process.env.NEXT_PUBLIC_WEBSOCKET_RECONNECT_INTERVAL || '5000')
  },
  pool: {
    enabled: process.env.NEXT_PUBLIC_WEBSOCKET_POOL_ENABLED === 'true',
    maxConnections: parseInt(process.env.NEXT_PUBLIC_WEBSOCKET_POOL_MAX_CONNECTIONS || '5'),
    minConnections: parseInt(process.env.NEXT_PUBLIC_WEBSOCKET_POOL_MIN_CONNECTIONS || '2'),
    connectionTimeout: parseInt(process.env.NEXT_PUBLIC_WEBSOCKET_POOL_CONNECTION_TIMEOUT || '10000'),
    healthCheckInterval: parseInt(process.env.NEXT_PUBLIC_WEBSOCKET_POOL_HEALTH_CHECK_INTERVAL || '30000')
  },
  offline: {
    maxQueueSize: parseInt(process.env.NEXT_PUBLIC_OFFLINE_QUEUE_MAX_SIZE || '100'),
    syncInterval: parseInt(process.env.NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL || '60000'),
    maxSyncAttempts: parseInt(process.env.NEXT_PUBLIC_OFFLINE_MAX_SYNC_ATTEMPTS || '3')
  }
};
```

---

## 🔧 Advanced Usage

### Custom Message Validation

```typescript
import { z } from 'zod';

const MessageSchema = z.object({
  type: z.string(),
  data: z.any().optional(),
  priority: z.number().min(1).max(10).optional(),
  timestamp: z.number().optional()
});

const validateMessage = (message: any) => {
  return MessageSchema.parse(message);
};

// Usage
const handleSendMessage = async (message) => {
  try {
    const validatedMessage = validateMessage(message);
    await sendMessage(validatedMessage);
  } catch (error) {
    console.error('Invalid message:', error);
  }
};
```

### Custom Error Handler

```typescript
const useCustomWebSocketErrorHandler = () => {
  const { error, reconnect } = useWebSocketContext();
  
  useEffect(() => {
    if (error) {
      // Custom error handling logic
      if (error.includes('timeout')) {
        // Handle timeout
        setTimeout(reconnect, 1000);
      } else if (error.includes('connection refused')) {
        // Handle connection refused
        console.error('Backend not available');
      }
    }
  }, [error, reconnect]);
  
  return { error };
};
```

### Performance Monitoring

```typescript
const useWebSocketPerformance = () => {
  const { events, agents } = useWebSocketContext();
  
  const performanceMetrics = useMemo(() => {
    const messageCount = events.length;
    const avgResponseTime = agents.reduce((sum, agent) => 
      sum + (agent.responseTime || 0), 0) / Math.max(agents.length, 1);
    
    return {
      messageCount,
      avgResponseTime,
      activeAgents: agents.filter(a => a.status === 'online').length
    };
  }, [events, agents]);
  
  return performanceMetrics;
};
```

---

*API Reference - FoodSave AI WebSocket*
*Ostatnia aktualizacja: 2025-01-27*
*Wersja: 1.0.0* 