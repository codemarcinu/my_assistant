# WebSocket Enterprise Guide - FoodSave AI

## 📋 Spis treści

1. [Architektura](#architektura)
2. [Konfiguracja](#konfiguracja)
3. [Użycie](#użycie)
4. [Monitoring](#monitoring)
5. [Offline Support](#offline-support)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)
8. [API Reference](#api-reference)

---

## 🏗️ Architektura

### Komponenty

```
WebSocketProvider (Context)
├── WebSocketPool (Connection Pooling)
├── useWebSocketContext (Hook)
├── useOfflineSync (Offline Queue)
└── Service Worker (Background Sync)
```

### Flow diagram

```
[App] → [WebSocketProvider] → [WebSocketPool] → [Backend]
   ↓           ↓                    ↓
[Offline] → [Service Worker] → [Cache/Queue]
```

---

## ⚙️ Konfiguracja

### Podstawowa konfiguracja

```tsx
// app/layout.tsx
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebSocketProvider
          url="ws://localhost:8001/ws/dashboard"
          autoReconnect={true}
          reconnectInterval={5000}
          maxReconnectAttempts={5}
          heartbeatInterval={30000}
          heartbeatTimeout={10000}
        >
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
```

### Zaawansowana konfiguracja z pooling

```tsx
// app/layout.tsx
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';
import { WebSocketPoolProvider } from '@/components/providers/WebSocketPoolProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebSocketProvider>
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
            {children}
          </WebSocketPoolProvider>
        </WebSocketProvider>
      </body>
    </html>
  );
}
```

---

## 🚀 Użycie

### Podstawowe użycie

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
        data: { imageUrl: 'path/to/image.jpg' }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {error && <p>Error: {error}</p>}
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
}
```

### Użycie z offline support

```tsx
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { useOfflineSync } from '@/hooks/useOfflineSync';

function MyComponent() {
  const { sendMessage } = useWebSocketContext();
  const { sendMessageWithOfflineFallback, isOnline } = useOfflineSync();

  const handleSendMessage = async (message) => {
    await sendMessageWithOfflineFallback(message, sendMessage);
  };

  return (
    <div>
      <p>Network: {isOnline ? 'Online' : 'Offline'}</p>
      <button onClick={() => handleSendMessage({ type: 'test' })}>
        Send with Offline Fallback
      </button>
    </div>
  );
}
```

### Użycie z connection pooling

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
    await sendMessage({ type: 'urgent' }, 10); // High priority
  };

  const handleBroadcast = async () => {
    await broadcastMessage({ type: 'notification' });
  };

  return (
    <div>
      <p>Active Connections: {getConnectionCount()}</p>
      <p>Healthy Connections: {metrics.healthyConnections}</p>
      <button onClick={handleHighPriorityMessage}>Send Urgent</button>
      <button onClick={handleBroadcast}>Broadcast</button>
    </div>
  );
}
```

---

## 📊 Monitoring

### WebSocket Metrics

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

### Pool Metrics

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

### Offline Status

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

### Eksport metryk Prometheus

```tsx
// Automatyczny eksport w WebSocketMetrics
const exportPrometheusMetrics = () => {
  const prometheusMetrics = [
    `# HELP websocket_connections_total Total number of WebSocket connections`,
    `# TYPE websocket_connections_total counter`,
    `websocket_connections_total ${metrics.connectionCount}`,
    // ... więcej metryk
  ].join('\n');

  const blob = new Blob([prometheusMetrics], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'websocket_metrics.prom';
  a.click();
};
```

---

## 📱 Offline Support

### Service Worker

Service Worker automatycznie:
- Cache'uje pliki aplikacji
- Zarządza kolejką wiadomości offline
- Synchronizuje w tle po przywróceniu połączenia
- Wyświetla powiadomienia push

### Offline Queue

```tsx
import { useOfflineSync } from '@/hooks/useOfflineSync';

function OfflineManager() {
  const {
    isOnline,
    offlineQueue,
    isSyncing,
    syncOfflineMessages,
    clearOfflineQueue
  } = useOfflineSync();

  return (
    <div>
      <p>Queue Size: {offlineQueue.length}</p>
      <button onClick={syncOfflineMessages} disabled={!isOnline}>
        Sync Now
      </button>
      <button onClick={clearOfflineQueue}>
        Clear Queue
      </button>
    </div>
  );
}
```

---

## 🔧 Troubleshooting

### Typowe problemy

#### 1. Connection refused (1006)

```typescript
// Sprawdź czy backend jest uruchomiony
// Sprawdź URL WebSocket
const wsUrl = isTauri 
  ? 'ws://127.0.0.1:8001/ws/dashboard'
  : 'ws://localhost:8001/ws/dashboard';
```

#### 2. Heartbeat timeout

```typescript
// Zwiększ timeout lub sprawdź połączenie
<WebSocketProvider
  heartbeatInterval={60000}  // 60s
  heartbeatTimeout={20000}   // 20s
/>
```

#### 3. Circuit breaker aktywny

```typescript
// Reset circuit breaker
const resetCircuitBreaker = () => {
  // Automatyczny reset po 60s
  // Lub ręczny przez reconnect
};
```

#### 4. Offline queue nie synchronizuje

```typescript
// Sprawdź Service Worker
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.getRegistration();
  console.log('SW registered:', !!registration);
}
```

### Debug mode

```typescript
// Włącz debug logging
const DEBUG_WEBSOCKET = true;

if (DEBUG_WEBSOCKET) {
  console.log('[WebSocket] Debug mode enabled');
  // Dodaj więcej logów
}
```

---

## ✅ Best Practices

### 1. Error Handling

```tsx
const handleWebSocketError = (error) => {
  // Log error
  console.error('[WebSocket] Error:', error);
  
  // Show user-friendly message
  setError('Connection lost. Trying to reconnect...');
  
  // Retry with exponential backoff
  setTimeout(() => {
    reconnect();
  }, getBackoffDelay(attempts));
};
```

### 2. Message Validation

```tsx
import { WebSocketMessageSchema } from '@/hooks/useWebSocket';

const sendValidatedMessage = (message) => {
  const result = WebSocketMessageSchema.safeParse(message);
  if (!result.success) {
    throw new Error(`Invalid message: ${result.error.message}`);
  }
  return sendMessage(message);
};
```

### 3. Connection Management

```tsx
// Automatyczne reconnect z circuit breaker
useEffect(() => {
  if (!isConnected && autoReconnect) {
    const timeout = setTimeout(connect, reconnectInterval);
    return () => clearTimeout(timeout);
  }
}, [isConnected, autoReconnect]);
```

### 4. Performance Optimization

```tsx
// Debounce frequent messages
const debouncedSendMessage = useMemo(
  () => debounce(sendMessage, 100),
  [sendMessage]
);

// Batch messages
const batchMessages = (messages) => {
  return messages.reduce((batch, msg) => {
    batch.push(msg);
    if (batch.length >= 10) {
      sendBatch(batch);
      return [];
    }
    return batch;
  }, []);
};
```

### 5. Security

```tsx
// Validate origin
const validateOrigin = (url) => {
  const allowedOrigins = ['localhost', '127.0.0.1'];
  const origin = new URL(url).hostname;
  return allowedOrigins.includes(origin);
};

// Sanitize messages
const sanitizeMessage = (message) => {
  return {
    ...message,
    data: sanitizeData(message.data)
  };
};
```

---

## 📚 API Reference

### WebSocketProvider Props

```typescript
interface WebSocketProviderProps {
  url?: string;                    // WebSocket URL
  autoReconnect?: boolean;         // Auto reconnect on disconnect
  reconnectInterval?: number;      // Reconnect delay (ms)
  maxReconnectAttempts?: number;   // Max reconnect attempts
  heartbeatInterval?: number;      // Heartbeat interval (ms)
  heartbeatTimeout?: number;       // Heartbeat timeout (ms)
}
```

### useWebSocketContext Return

```typescript
interface WebSocketContextType {
  isConnected: boolean;            // Connection status
  error: string | null;           // Current error
  reconnectAttempts: number;      // Reconnect attempts
  agents: AgentStatus[];          // Agent statuses
  systemMetrics: SystemMetrics;   // System metrics
  events: WebSocketEvent[];       // Recent events
  sendMessage: (msg: any) => void; // Send message
  requestAgentStatus: () => void;  // Request agent status
  requestSystemMetrics: () => void; // Request metrics
  subscribeToAgent: (name: string) => void; // Subscribe to agent
  unsubscribeFromAgent: (name: string) => void; // Unsubscribe
}
```

### useOfflineSync Return

```typescript
interface OfflineSyncReturn {
  isOnline: boolean;              // Network status
  offlineQueue: OfflineMessage[]; // Pending messages
  isSyncing: boolean;             // Sync in progress
  lastSyncTime: number | null;    // Last sync timestamp
  cacheOfflineMessage: (msg: any) => Promise<void>;
  syncOfflineMessages: () => Promise<void>;
  clearOfflineQueue: () => Promise<void>;
  sendMessageWithOfflineFallback: (msg: any, sendFn: Function) => Promise<void>;
}
```

### WebSocketPool Config

```typescript
interface PoolConfig {
  maxConnections: number;         // Max connections
  minConnections: number;         // Min connections
  connectionTimeout: number;      // Connection timeout
  healthCheckInterval: number;    // Health check interval
  loadBalancingStrategy: 'round-robin' | 'least-used' | 'health-based';
  urls: string[];                // WebSocket URLs
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
// tests/unit/websocket.test.ts
import { renderHook } from '@testing-library/react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

test('should connect to WebSocket', () => {
  const { result } = renderHook(() => useWebSocketContext());
  
  expect(result.current.isConnected).toBe(false);
  // Test connection logic
});
```

### E2E Tests

```typescript
// tests/e2e/websocket-monitoring.test.ts
import { test, expect } from '@playwright/test';

test('should display WebSocket metrics', async ({ page }) => {
  await page.goto('/analytics');
  await expect(page.locator('[data-testid="websocket-metrics"]')).toBeVisible();
});
```

### Mock WebSocket

```typescript
// tests/mocks/websocket.ts
export class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  send(data: string) {
    // Mock send
  }
  
  close() {
    // Mock close
  }
}
```

---

## 📈 Performance

### Metryki do monitorowania

- **Connection Count**: Liczba aktywnych połączeń
- **Message Rate**: Wiadomości na sekundę
- **Error Rate**: Procent błędów
- **Response Time**: Średni czas odpowiedzi
- **Reconnect Rate**: Częstotliwość reconnectów
- **Offline Queue Size**: Rozmiar kolejki offline

### Optymalizacje

1. **Connection Pooling**: Wykorzystaj pool połączeń dla wysokiego ruchu
2. **Message Batching**: Grupuj wiadomości dla lepszej wydajności
3. **Heartbeat Optimization**: Dostosuj heartbeat do potrzeb
4. **Circuit Breaker**: Zapobiegaj cascading failures
5. **Offline Queue**: Buforuj wiadomości offline

---

## 🔒 Security

### Zalecenia

1. **WSS**: Używaj WSS w produkcji
2. **Origin Validation**: Waliduj origin połączeń
3. **Message Validation**: Waliduj wszystkie wiadomości
4. **Rate Limiting**: Implementuj rate limiting
5. **Authentication**: Dodaj autentykację WebSocket

### Implementacja

```typescript
// Secure WebSocket connection
const secureWebSocket = new WebSocket('wss://api.foodsave.ai/ws', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Client-Version': '1.0.0'
  }
});
```

---

## 📞 Support

### Logi

Wszystkie logi WebSocket są prefiksowane:
- `[WebSocket]` - Podstawowe logi
- `[WebSocketProvider]` - Provider logi
- `[WebSocketPool]` - Pool logi
- `[OfflineSync]` - Offline sync logi
- `[SW]` - Service Worker logi

### Debug

```typescript
// Włącz debug mode
localStorage.setItem('websocket-debug', 'true');

// Sprawdź status
console.log('WebSocket Status:', {
  isConnected,
  error,
  reconnectAttempts,
  agents: agents.length,
  offlineQueue: offlineQueue.length
});
```

---

*Dokumentacja aktualna na: 2025-01-27*
*Wersja: 1.0.0* 