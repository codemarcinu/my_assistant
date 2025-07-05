# Developer Experience Guide - FoodSave AI WebSocket

## 🛠️ Quick Start

### 1. Setup Development Environment

```bash
# Clone repository
git clone https://github.com/codemarcinu/my_assistant.git
cd my_assistant/myappassistant-chat-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Start backend (in separate terminal)
cd ../src
python -m uvicorn backend.main:app --reload --port 8001
```

### 2. WebSocket Development

```tsx
// Basic WebSocket usage
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

function MyComponent() {
  const { isConnected, sendMessage } = useWebSocketContext();
  
  const handleTest = () => {
    sendMessage({ type: 'test', data: 'Hello WebSocket!' });
  };
  
  return (
    <div>
      <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      <button onClick={handleTest}>Test WebSocket</button>
    </div>
  );
}
```

---

## 🔍 Debug Tools

### 1. Browser DevTools

```javascript
// Włącz debug mode w console
localStorage.setItem('websocket-debug', 'true');

// Sprawdź WebSocket status
console.log('WebSocket Debug:', {
  isConnected: window.__WEBSOCKET_DEBUG__?.isConnected,
  error: window.__WEBSOCKET_DEBUG__?.error,
  reconnectAttempts: window.__WEBSOCKET_DEBUG__?.reconnectAttempts,
  agents: window.__WEBSOCKET_DEBUG__?.agents?.length,
  offlineQueue: window.__WEBSOCKET_DEBUG__?.offlineQueue?.length
});

// Monitor WebSocket events
window.__WEBSOCKET_DEBUG__?.addEventListener('message', (event) => {
  console.log('WebSocket Message:', event.data);
});
```

### 2. React DevTools

```tsx
// Dodaj debug props do komponentów
function DebugWebSocket() {
  const wsContext = useWebSocketContext();
  
  // Debug info w React DevTools
  React.useDebugValue({
    isConnected: wsContext.isConnected,
    error: wsContext.error,
    agentsCount: wsContext.agents.length,
    eventsCount: wsContext.events.length
  });
  
  return <div>Debug: {JSON.stringify(wsContext, null, 2)}</div>;
}
```

### 3. Custom Debug Panel

```tsx
// components/debug/WebSocketDebugPanel.tsx
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export const WebSocketDebugPanel = () => {
  const ws = useWebSocketContext();
  const offline = useOfflineSync();
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">WebSocket Debug</h3>
      <div className="space-y-1">
        <div>Status: {ws.isConnected ? '🟢' : '🔴'}</div>
        <div>Error: {ws.error || 'None'}</div>
        <div>Reconnect: {ws.reconnectAttempts}</div>
        <div>Agents: {ws.agents.length}</div>
        <div>Events: {ws.events.length}</div>
        <div>Offline: {offline.isOnline ? '🟢' : '🔴'}</div>
        <div>Queue: {offline.offlineQueue.length}</div>
      </div>
    </div>
  );
};
```

---

## 🧪 Testing Workflow

### 1. Unit Testing

```typescript
// tests/unit/websocket.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

const wrapper = ({ children }) => (
  <WebSocketProvider url="ws://localhost:8001/ws/dashboard">
    {children}
  </WebSocketProvider>
);

test('should connect to WebSocket', async () => {
  const { result } = renderHook(() => useWebSocketContext(), { wrapper });
  
  await waitFor(() => {
    expect(result.current.isConnected).toBe(true);
  });
});

test('should handle message sending', async () => {
  const { result } = renderHook(() => useWebSocketContext(), { wrapper });
  
  const mockSend = jest.fn();
  result.current.sendMessage = mockSend;
  
  await result.current.sendMessage({ type: 'test' });
  
  expect(mockSend).toHaveBeenCalledWith({ type: 'test' });
});
```

### 2. Integration Testing

```typescript
// tests/integration/websocket-integration.test.ts
import { render, screen, fireEvent } from '@testing-library/react';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';
import { MyComponent } from '@/components/MyComponent';

test('should display connection status', () => {
  render(
    <WebSocketProvider>
      <MyComponent />
    </WebSocketProvider>
  );
  
  expect(screen.getByText(/Status:/)).toBeInTheDocument();
});

test('should send message on button click', async () => {
  const mockSendMessage = jest.fn();
  
  render(
    <WebSocketProvider>
      <MyComponent onSendMessage={mockSendMessage} />
    </WebSocketProvider>
  );
  
  fireEvent.click(screen.getByText('Send Message'));
  
  expect(mockSendMessage).toHaveBeenCalled();
});
```

### 3. E2E Testing

```typescript
// tests/e2e/websocket-e2e.test.ts
import { test, expect } from '@playwright/test';

test('WebSocket connection flow', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Wait for WebSocket connection
  await page.waitForFunction(() => {
    return window.__WEBSOCKET_DEBUG__?.isConnected === true;
  });
  
  // Test message sending
  await page.click('[data-testid="send-message-btn"]');
  
  // Verify message was sent
  await expect(page.locator('[data-testid="message-status"]')).toContainText('Sent');
});

test('Offline functionality', async ({ page }) => {
  await page.goto('/analytics');
  
  // Simulate offline
  await page.route('**/*', route => route.abort());
  
  // Check offline status
  await expect(page.locator('[data-testid="offline-status"]')).toContainText('Offline');
  
  // Test offline queue
  await page.click('[data-testid="cache-message-btn"]');
  await expect(page.locator('[data-testid="queue-size"]')).toContainText('1');
});
```

---

## 🔧 Development Tools

### 1. WebSocket Mock Server

```typescript
// scripts/mock-websocket-server.ts
import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8001 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'agent_status',
    data: {
      name: 'test-agent',
      status: 'online',
      lastActivity: new Date().toISOString()
    },
    timestamp: Date.now()
  }));
  
  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    console.log('Received:', data);
    
    // Echo back for testing
    ws.send(JSON.stringify({
      type: 'echo',
      data: data,
      timestamp: Date.now()
    }));
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('Mock WebSocket server running on ws://localhost:8001');
```

### 2. Development Scripts

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "dev:websocket": "concurrently \"npm run dev\" \"node scripts/mock-websocket-server.ts\"",
    "test:websocket": "jest --testPathPattern=websocket",
    "test:e2e:websocket": "playwright test --grep websocket",
    "debug:websocket": "NODE_ENV=development DEBUG=websocket:* npm run dev"
  }
}
```

### 3. Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8001/ws/dashboard
NEXT_PUBLIC_WEBSOCKET_DEBUG=true
NEXT_PUBLIC_WEBSOCKET_HEARTBEAT_INTERVAL=30000
NEXT_PUBLIC_WEBSOCKET_RECONNECT_ATTEMPTS=5
```

---

## 📊 Monitoring & Analytics

### 1. Development Metrics

```tsx
// components/debug/DevelopmentMetrics.tsx
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

export const DevelopmentMetrics = () => {
  const ws = useWebSocketContext();
  
  const metrics = {
    connectionUptime: Date.now() - (ws.lastConnected || Date.now()),
    messageCount: ws.events.length,
    errorCount: ws.error ? 1 : 0,
    agentCount: ws.agents.length,
    averageResponseTime: ws.agents.reduce((sum, agent) => 
      sum + (agent.responseTime || 0), 0) / Math.max(ws.agents.length, 1)
  };
  
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h3>Development Metrics</h3>
      <pre>{JSON.stringify(metrics, null, 2)}</pre>
    </div>
  );
};
```

### 2. Performance Profiling

```typescript
// utils/websocket-profiler.ts
export class WebSocketProfiler {
  private metrics = {
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    responseTimes: [] as number[]
  };
  
  startTimer() {
    return Date.now();
  }
  
  endTimer(startTime: number) {
    const responseTime = Date.now() - startTime;
    this.metrics.responseTimes.push(responseTime);
    return responseTime;
  }
  
  recordMessage(type: 'sent' | 'received') {
    if (type === 'sent') this.metrics.messagesSent++;
    else this.metrics.messagesReceived++;
  }
  
  recordError() {
    this.metrics.errors++;
  }
  
  getReport() {
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;
      
    return {
      ...this.metrics,
      averageResponseTime: avgResponseTime,
      errorRate: this.metrics.messagesSent > 0 
        ? (this.metrics.errors / this.metrics.messagesSent) * 100 
        : 0
    };
  }
}
```

---

## 🚀 Production Deployment

### 1. Environment Setup

```bash
# Production environment variables
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.foodsave.ai/ws/dashboard
NEXT_PUBLIC_WEBSOCKET_DEBUG=false
NEXT_PUBLIC_WEBSOCKET_HEARTBEAT_INTERVAL=30000
NEXT_PUBLIC_WEBSOCKET_RECONNECT_ATTEMPTS=3
NEXT_PUBLIC_WEBSOCKET_POOL_ENABLED=true
NEXT_PUBLIC_WEBSOCKET_POOL_MAX_CONNECTIONS=5
```

### 2. Build Configuration

```typescript
// next.config.js
module.exports = {
  env: {
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
    NEXT_PUBLIC_WEBSOCKET_DEBUG: process.env.NODE_ENV === 'development',
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache'
          }
        ]
      }
    ];
  }
};
```

### 3. Service Worker Registration

```typescript
// app/layout.tsx
useEffect(() => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.error('SW registration failed:', error);
      });
  }
}, []);
```

---

## 🔍 Troubleshooting Guide

### Common Issues

#### 1. WebSocket Connection Fails

```bash
# Check if backend is running
curl http://localhost:8001/health

# Check WebSocket endpoint
wscat -c ws://localhost:8001/ws/dashboard

# Check browser console for errors
```

#### 2. Service Worker Not Registering

```javascript
// Check Service Worker support
if ('serviceWorker' in navigator) {
  console.log('Service Worker supported');
} else {
  console.log('Service Worker not supported');
}

// Check registration
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active registrations:', registrations);
});
```

#### 3. Offline Queue Not Working

```javascript
// Check offline queue
const checkOfflineQueue = async () => {
  const cache = await caches.open('foodsave-ai-v1');
  const response = await cache.match('websocket-offline-queue');
  const queue = response ? await response.json() : [];
  console.log('Offline queue:', queue);
};
```

### Debug Commands

```bash
# Start development with debug
npm run debug:websocket

# Run WebSocket tests only
npm run test:websocket

# Run E2E WebSocket tests
npm run test:e2e:websocket

# Check WebSocket server
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
  http://localhost:8001/ws/dashboard
```

---

## 📚 Resources

### Documentation
- [WebSocket Enterprise Guide](./WEBSOCKET_ENTERPRISE_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Tools
- [WebSocket Inspector](https://chrome.google.com/webstore/detail/websocket-inspector/dfgpoelnkjhgejejmehknoppikhlpkmj)
- [Postman WebSocket Testing](https://learning.postman.com/docs/sending-requests/websocket/websocket/)
- [wscat](https://github.com/websockets/wscat) - Command line WebSocket client

### Testing
- [Jest WebSocket Mock](https://github.com/romgain/jest-websocket-mock)
- [Playwright WebSocket Testing](https://playwright.dev/docs/network#websocket)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

*Developer Experience Guide - FoodSave AI WebSocket*
*Ostatnia aktualizacja: 2025-01-27* 