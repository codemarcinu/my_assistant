# WebSocket Troubleshooting Guide - FoodSave AI

## 📋 Spis treści

1. [Connection Issues](#connection-issues)
2. [Message Problems](#message-problems)
3. [Performance Issues](#performance-issues)
4. [Offline Problems](#offline-problems)
5. [Pool Issues](#pool-issues)
6. [Debug Tools](#debug-tools)
7. [Common Error Codes](#common-error-codes)
8. [Performance Optimization](#performance-optimization)

---

## 🔌 Connection Issues

### Problem: WebSocket Connection Fails (1006)

**Symptoms:**
- Connection refused error
- WebSocket fails to connect
- Browser console shows "WebSocket connection failed"

**Causes:**
1. Backend server not running
2. Wrong WebSocket URL
3. Firewall blocking connection
4. CORS issues
5. Network connectivity problems

**Solutions:**

#### 1. Check Backend Server

```bash
# Check if backend is running
curl http://localhost:8001/health

# Check if port is open
netstat -tulpn | grep 8001

# Check backend logs
tail -f logs/backend/backend.log
```

#### 2. Verify WebSocket URL

```typescript
// Check current WebSocket URL
console.log('WebSocket URL:', process.env.NEXT_PUBLIC_WEBSOCKET_URL);

// Verify URL format
const wsUrl = isTauri 
  ? 'ws://127.0.0.1:8001/ws/dashboard'
  : 'ws://localhost:8001/ws/dashboard';

console.log('Expected URL:', wsUrl);
```

#### 3. Test WebSocket Connection

```bash
# Using wscat (install: npm install -g wscat)
wscat -c ws://localhost:8001/ws/dashboard

# Using curl
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:8001/ws/dashboard
```

#### 4. Check Firewall

```bash
# Check if port is blocked
sudo ufw status
sudo iptables -L

# Allow port if needed
sudo ufw allow 8001
```

### Problem: Connection Timeout

**Symptoms:**
- Connection hangs during establishment
- Timeout after 10-30 seconds
- No error message, just no connection

**Solutions:**

```typescript
// Increase connection timeout
<WebSocketProvider
  connectionTimeout={30000}  // 30 seconds
  reconnectInterval={10000}  // 10 seconds
/>
```

```bash
# Check network latency
ping localhost
traceroute localhost

# Check server load
top
htop
```

### Problem: CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- Connection fails in browser but works in wscat
- "Access-Control-Allow-Origin" errors

**Solutions:**

```python
# Backend CORS configuration (FastAPI)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📨 Message Problems

### Problem: Messages Not Sending

**Symptoms:**
- `sendMessage` doesn't work
- No error but no message received
- Connection appears fine

**Solutions:**

#### 1. Check Message Format

```typescript
// Validate message format
const message = {
  type: 'test',
  data: 'Hello World',
  timestamp: Date.now()
};

// Check if message is valid
const result = WebSocketMessageSchema.safeParse(message);
if (!result.success) {
  console.error('Invalid message:', result.error);
}
```

#### 2. Check Connection State

```typescript
const { isConnected, sendMessage } = useWebSocketContext();

const handleSend = async () => {
  if (!isConnected) {
    console.error('Not connected to WebSocket');
    return;
  }
  
  try {
    await sendMessage({ type: 'test' });
  } catch (error) {
    console.error('Send failed:', error);
  }
};
```

#### 3. Debug Message Sending

```typescript
// Add debug logging
const debugSendMessage = async (message) => {
  console.log('[WebSocket] Sending message:', message);
  
  try {
    await sendMessage(message);
    console.log('[WebSocket] Message sent successfully');
  } catch (error) {
    console.error('[WebSocket] Send failed:', error);
  }
};
```

### Problem: Messages Not Received

**Symptoms:**
- Messages sent but not received
- No response from server
- Connection appears fine

**Solutions:**

#### 1. Check Server Logs

```bash
# Check backend logs
tail -f logs/backend/backend.log | grep -i websocket

# Check for message processing errors
grep -i "message" logs/backend/backend.log
```

#### 2. Verify Message Handler

```python
# Backend message handler (FastAPI)
@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received: {data}")  # Debug log
            
            # Process message
            response = process_message(data)
            
            # Send response
            await websocket.send_text(json.dumps(response))
    except WebSocketDisconnect:
        print("Client disconnected")
```

#### 3. Test Message Flow

```typescript
// Test message round-trip
const testMessage = async () => {
  const message = { type: 'echo', data: 'test' };
  
  console.log('Sending:', message);
  await sendMessage(message);
  
  // Wait for response
  setTimeout(() => {
    console.log('Events:', events);
  }, 1000);
};
```

---

## ⚡ Performance Issues

### Problem: High Latency

**Symptoms:**
- Slow message response
- High response times
- UI feels sluggish

**Solutions:**

#### 1. Optimize Message Size

```typescript
// Compress large messages
const compressMessage = (message) => {
  if (JSON.stringify(message).length > 1000) {
    return {
      ...message,
      data: JSON.stringify(message.data).substring(0, 1000) + '...'
    };
  }
  return message;
};
```

#### 2. Batch Messages

```typescript
// Batch multiple messages
const batchMessages = (messages) => {
  return {
    type: 'batch',
    data: messages,
    timestamp: Date.now()
  };
};
```

#### 3. Use Connection Pooling

```typescript
// Enable connection pooling
<WebSocketPoolProvider
  config={{
    maxConnections: 5,
    minConnections: 2,
    loadBalancingStrategy: 'health-based'
  }}
  enabled={true}
>
  <YourApp />
</WebSocketPoolProvider>
```

### Problem: Memory Leaks

**Symptoms:**
- Memory usage increases over time
- Browser becomes slow
- Connection events accumulate

**Solutions:**

#### 1. Cleanup Event Listeners

```typescript
useEffect(() => {
  const handleMessage = (event) => {
    // Handle message
  };
  
  // Add listener
  window.addEventListener('websocket-message', handleMessage);
  
  // Cleanup
  return () => {
    window.removeEventListener('websocket-message', handleMessage);
  };
}, []);
```

#### 2. Limit Event History

```typescript
// Limit events array size
const maxEvents = 100;

const addEvent = (event) => {
  setEvents(prev => {
    const newEvents = [...prev, event];
    return newEvents.slice(-maxEvents);
  });
};
```

#### 3. Clear Unused Data

```typescript
// Clear old data periodically
useEffect(() => {
  const interval = setInterval(() => {
    setEvents(prev => prev.filter(event => 
      Date.now() - event.timestamp < 300000 // 5 minutes
    ));
  }, 60000); // Every minute
  
  return () => clearInterval(interval);
}, []);
```

---

## 📱 Offline Problems

### Problem: Offline Queue Not Working

**Symptoms:**
- Messages lost when offline
- No offline caching
- Service Worker not registered

**Solutions:**

#### 1. Check Service Worker

```javascript
// Check Service Worker support
if ('serviceWorker' in navigator) {
  console.log('Service Worker supported');
  
  // Check registration
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Active registrations:', registrations);
  });
} else {
  console.log('Service Worker not supported');
}
```

#### 2. Verify Offline Queue

```typescript
// Check offline queue
const checkOfflineQueue = async () => {
  try {
    const cache = await caches.open('foodsave-ai-v1');
    const response = await cache.match('websocket-offline-queue');
    
    if (response) {
      const queue = await response.json();
      console.log('Offline queue:', queue);
      return queue;
    } else {
      console.log('No offline queue found');
      return [];
    }
  } catch (error) {
    console.error('Error checking offline queue:', error);
    return [];
  }
};
```

#### 3. Test Offline Functionality

```typescript
// Test offline message caching
const testOfflineMessage = async () => {
  const { sendMessageWithOfflineFallback } = useOfflineSync();
  
  // Simulate offline
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false
  });
  
  // Send message (should be cached)
  await sendMessageWithOfflineFallback(
    { type: 'test' },
    sendMessage
  );
  
  // Check queue
  const queue = await checkOfflineQueue();
  console.log('Queue after offline message:', queue);
};
```

### Problem: Sync Not Working

**Symptoms:**
- Offline messages not syncing
- Queue stuck
- Sync button not working

**Solutions:**

#### 1. Check Network Status

```typescript
// Monitor network status
useEffect(() => {
  const handleOnline = () => {
    console.log('Network: Online');
    syncOfflineMessages();
  };
  
  const handleOffline = () => {
    console.log('Network: Offline');
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

#### 2. Debug Sync Process

```typescript
// Debug sync with logging
const debugSync = async () => {
  console.log('Starting sync...');
  
  try {
    const queue = await checkOfflineQueue();
    console.log('Queue to sync:', queue);
    
    for (const message of queue) {
      console.log('Syncing message:', message);
      await sendMessage(message.message);
      console.log('Message synced successfully');
    }
    
    console.log('Sync completed');
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

---

## 🏊 Pool Issues

### Problem: Pool Exhausted

**Symptoms:**
- "Pool exhausted" errors
- No available connections
- High connection count

**Solutions:**

#### 1. Check Pool Configuration

```typescript
// Verify pool settings
const poolConfig = {
  maxConnections: 5,
  minConnections: 2,
  connectionTimeout: 10000,
  healthCheckInterval: 30000
};

console.log('Pool config:', poolConfig);
```

#### 2. Monitor Pool Health

```typescript
// Check pool metrics
const { metrics } = useWebSocketPool();

console.log('Pool metrics:', {
  totalConnections: metrics.totalConnections,
  healthyConnections: metrics.healthyConnections,
  failedConnections: metrics.failedConnections
});
```

#### 3. Increase Pool Size

```typescript
// Increase max connections
<WebSocketPoolProvider
  config={{
    maxConnections: 10,  // Increase from 5
    minConnections: 3,   // Increase from 2
    connectionTimeout: 15000  // Increase timeout
  }}
  enabled={true}
>
  <YourApp />
</WebSocketPoolProvider>
```

### Problem: Load Balancing Issues

**Symptoms:**
- Uneven connection distribution
- Some connections overloaded
- Poor performance

**Solutions:**

#### 1. Change Load Balancing Strategy

```typescript
// Try different strategies
const strategies = ['round-robin', 'least-used', 'health-based'];

<WebSocketPoolProvider
  config={{
    loadBalancingStrategy: 'health-based',  // Best for most cases
    healthCheckInterval: 15000  // More frequent health checks
  }}
  enabled={true}
>
  <YourApp />
</WebSocketPoolProvider>
```

#### 2. Monitor Connection Health

```typescript
// Check individual connection health
const checkConnectionHealth = async () => {
  const { pool } = useWebSocketPool();
  
  for (const connection of pool.connections) {
    const health = await connection.checkHealth();
    console.log(`Connection ${connection.url}: ${health.status}`);
  }
};
```

---

## 🔍 Debug Tools

### 1. WebSocket Inspector

```javascript
// Browser console debug
localStorage.setItem('websocket-debug', 'true');

// Check WebSocket status
console.log('WebSocket Debug:', {
  isConnected: window.__WEBSOCKET_DEBUG__?.isConnected,
  error: window.__WEBSOCKET_DEBUG__?.error,
  reconnectAttempts: window.__WEBSOCKET_DEBUG__?.reconnectAttempts,
  agents: window.__WEBSOCKET_DEBUG__?.agents?.length,
  offlineQueue: window.__WEBSOCKET_DEBUG__?.offlineQueue?.length
});
```

### 2. Network Tab

```javascript
// Monitor WebSocket in Network tab
// 1. Open DevTools
// 2. Go to Network tab
// 3. Filter by "WS" (WebSocket)
// 4. Look for connection and messages
```

### 3. Custom Debug Panel

```tsx
// Add debug panel to your app
import { WebSocketDebugPanel } from '@/components/debug/WebSocketDebugPanel';

function App() {
  return (
    <div>
      <YourApp />
      {process.env.NODE_ENV === 'development' && <WebSocketDebugPanel />}
    </div>
  );
}
```

### 4. Logging

```typescript
// Enable detailed logging
const DEBUG_WEBSOCKET = process.env.NODE_ENV === 'development';

if (DEBUG_WEBSOCKET) {
  console.log('[WebSocket] Debug mode enabled');
  
  // Log all WebSocket events
  window.addEventListener('websocket-event', (event) => {
    console.log('[WebSocket] Event:', event.detail);
  });
}
```

---

## ❌ Common Error Codes

### WebSocket Error Codes

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 1000 | Normal Closure | Normal closure | Normal behavior |
| 1001 | Going Away | Server shutting down | Wait for server restart |
| 1002 | Protocol Error | Invalid protocol | Check WebSocket URL |
| 1003 | Unsupported Data | Unsupported data type | Check message format |
| 1006 | Abnormal Closure | Connection lost | Check network/server |
| 1009 | Message Too Big | Message exceeds limit | Reduce message size |
| 1011 | Internal Error | Server error | Check server logs |
| 1015 | TLS Handshake | TLS handshake failed | Check SSL certificate |

### HTTP Error Codes

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 400 | Bad Request | Invalid request | Check request format |
| 401 | Unauthorized | Authentication required | Add auth headers |
| 403 | Forbidden | Access denied | Check permissions |
| 404 | Not Found | Endpoint not found | Check WebSocket URL |
| 500 | Internal Server Error | Server error | Check server logs |
| 502 | Bad Gateway | Gateway error | Check proxy/load balancer |
| 503 | Service Unavailable | Service unavailable | Wait for service restart |

---

## ⚡ Performance Optimization

### 1. Connection Optimization

```typescript
// Optimize connection settings
<WebSocketProvider
  heartbeatInterval={60000}  // 60s heartbeat
  heartbeatTimeout={20000}   // 20s timeout
  reconnectInterval={3000}   // 3s reconnect
  maxReconnectAttempts={3}   // Limit attempts
>
  <YourApp />
</WebSocketProvider>
```

### 2. Message Optimization

```typescript
// Optimize message handling
const optimizedSendMessage = useMemo(
  () => debounce(sendMessage, 100),  // Debounce frequent messages
  [sendMessage]
);

// Batch messages
const batchMessages = (messages) => {
  if (messages.length > 10) {
    return messages.reduce((batches, msg, index) => {
      const batchIndex = Math.floor(index / 10);
      if (!batches[batchIndex]) batches[batchIndex] = [];
      batches[batchIndex].push(msg);
      return batches;
    }, []);
  }
  return [messages];
};
```

### 3. Memory Optimization

```typescript
// Limit data storage
const maxEvents = 50;
const maxAgents = 20;

// Clean old data
useEffect(() => {
  const cleanup = setInterval(() => {
    setEvents(prev => prev.slice(-maxEvents));
    setAgents(prev => prev.slice(0, maxAgents));
  }, 30000); // Every 30 seconds
  
  return () => clearInterval(cleanup);
}, []);
```

### 4. Network Optimization

```typescript
// Use compression for large messages
const compressMessage = (message) => {
  if (JSON.stringify(message).length > 1024) {
    // Use compression library like pako
    return pako.deflate(JSON.stringify(message));
  }
  return message;
};

// Implement message queuing
const messageQueue = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || messageQueue.length === 0) return;
  
  isProcessing = true;
  
  while (messageQueue.length > 0) {
    const message = messageQueue.shift();
    await sendMessage(message);
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
  }
  
  isProcessing = false;
};
```

---

## 🚨 Emergency Procedures

### 1. Force Reconnect

```typescript
// Force WebSocket reconnect
const forceReconnect = () => {
  const { reconnect } = useWebSocketContext();
  
  // Clear all state
  localStorage.removeItem('websocket-state');
  
  // Force reconnect
  reconnect();
  
  // Reload page if needed
  setTimeout(() => {
    window.location.reload();
  }, 5000);
};
```

### 2. Clear All Data

```typescript
// Clear all WebSocket data
const clearAllData = async () => {
  // Clear localStorage
  localStorage.removeItem('websocket-state');
  localStorage.removeItem('offline-queue');
  
  // Clear cache
  const cache = await caches.open('foodsave-ai-v1');
  await cache.delete('websocket-offline-queue');
  
  // Reload page
  window.location.reload();
};
```

### 3. Fallback Mode

```typescript
// Enable fallback mode
const enableFallbackMode = () => {
  // Disable WebSocket
  localStorage.setItem('websocket-disabled', 'true');
  
  // Use HTTP polling instead
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      // Handle data
    } catch (error) {
      console.error('Polling failed:', error);
    }
  }, 5000);
  
  return () => clearInterval(pollInterval);
};
```

---

*Troubleshooting Guide - FoodSave AI WebSocket*
*Ostatnia aktualizacja: 2025-01-27*
*Wersja: 1.0.0* 