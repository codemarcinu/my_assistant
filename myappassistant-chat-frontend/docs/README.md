# FoodSave AI - WebSocket Documentation

## 📚 Dokumentacja WebSocket

Kompletna dokumentacja systemu WebSocket dla aplikacji FoodSave AI, obejmująca architekturę enterprise-grade, monitoring, offline support i troubleshooting.

---

## 📖 Przewodniki

### 🏗️ [WebSocket Enterprise Guide](./WEBSOCKET_ENTERPRISE_GUIDE.md)
Kompletny przewodnik enterprise-grade WebSocket z:
- Architekturą i komponentami
- Konfiguracją podstawową i zaawansowaną
- Przykładami użycia
- Monitoringiem i metrykami
- Offline support
- Best practices i security

### 🛠️ [Developer Experience Guide](./DEVELOPER_EXPERIENCE.md)
Przewodnik dla developerów zawierający:
- Quick start i setup
- Debug tools i monitoring
- Testing workflow (unit, integration, E2E)
- Development tools i mock servers
- Performance profiling
- Production deployment

### 📚 [API Reference](./API_REFERENCE.md)
Kompletna dokumentacja API z:
- Wszystkimi interfejsami TypeScript
- Przykładami użycia
- Opisami metod i komponentów
- Error handling
- Konfiguracją

### 🔧 [Troubleshooting Guide](./TROUBLESHOOTING.md)
Przewodnik rozwiązywania problemów z:
- Typowymi problemami i rozwiązaniami
- Debug tools
- Error codes
- Performance optimization
- Emergency procedures

---

## 🚀 Szybki Start

### 1. Podstawowa konfiguracja

```tsx
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';

function App() {
  return (
    <WebSocketProvider
      url="ws://localhost:8001/ws/dashboard"
      autoReconnect={true}
      heartbeatInterval={30000}
    >
      <YourApp />
    </WebSocketProvider>
  );
}
```

### 2. Użycie w komponencie

```tsx
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

function MyComponent() {
  const { isConnected, sendMessage, agents } = useWebSocketContext();

  const handleSendMessage = async () => {
    await sendMessage({
      type: 'process_receipt',
      data: { imageUrl: 'path/to/image.jpg' }
    });
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Agents: {agents.length}</p>
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
}
```

### 3. Offline Support

```tsx
import { useOfflineSync } from '@/hooks/useOfflineSync';

function MyComponent() {
  const { sendMessageWithOfflineFallback, isOnline } = useOfflineSync();

  const handleSend = async (message) => {
    await sendMessageWithOfflineFallback(message, sendMessage);
  };

  return (
    <div>
      <p>Network: {isOnline ? 'Online' : 'Offline'}</p>
      <button onClick={() => handleSend({ type: 'test' })}>
        Send with Offline Fallback
      </button>
    </div>
  );
}
```

---

## 🔧 Konfiguracja

### Environment Variables

```bash
# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8001/ws/dashboard
NEXT_PUBLIC_WEBSOCKET_DEBUG=true
NEXT_PUBLIC_WEBSOCKET_HEARTBEAT_INTERVAL=30000
NEXT_PUBLIC_WEBSOCKET_RECONNECT_ATTEMPTS=5

# Pool Configuration
NEXT_PUBLIC_WEBSOCKET_POOL_ENABLED=true
NEXT_PUBLIC_WEBSOCKET_POOL_MAX_CONNECTIONS=5

# Offline Configuration
NEXT_PUBLIC_OFFLINE_QUEUE_MAX_SIZE=100
NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL=60000
```

### Zaawansowana konfiguracja z pooling

```tsx
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';
import { WebSocketPoolProvider } from '@/components/providers/WebSocketPoolProvider';

function App() {
  return (
    <WebSocketProvider>
      <WebSocketPoolProvider
        config={{
          maxConnections: 5,
          minConnections: 2,
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
    </WebSocketProvider>
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

---

## 🧪 Testing

### Unit Tests

```bash
# Run WebSocket tests
npm run test:websocket

# Run specific test file
npm test -- --testPathPattern=websocket
```

### E2E Tests

```bash
# Run WebSocket E2E tests
npm run test:e2e:websocket

# Run with Playwright
npx playwright test --grep websocket
```

### Debug Mode

```bash
# Start with debug logging
npm run debug:websocket

# Enable debug in browser
localStorage.setItem('websocket-debug', 'true');
```

---

## 🔍 Debug Tools

### Browser Console

```javascript
// Check WebSocket status
console.log('WebSocket Debug:', {
  isConnected: window.__WEBSOCKET_DEBUG__?.isConnected,
  error: window.__WEBSOCKET_DEBUG__?.error,
  reconnectAttempts: window.__WEBSOCKET_DEBUG__?.reconnectAttempts,
  agents: window.__WEBSOCKET_DEBUG__?.agents?.length,
  offlineQueue: window.__WEBSOCKET_DEBUG__?.offlineQueue?.length
});
```

### Custom Debug Panel

```tsx
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

---

## 🚨 Troubleshooting

### Typowe problemy

1. **Connection refused (1006)**
   - Sprawdź czy backend jest uruchomiony
   - Sprawdź URL WebSocket
   - Sprawdź firewall

2. **Heartbeat timeout**
   - Zwiększ heartbeat timeout
   - Sprawdź połączenie sieciowe

3. **Offline queue nie synchronizuje**
   - Sprawdź Service Worker
   - Sprawdź network status

### Debug Commands

```bash
# Check backend
curl http://localhost:8001/health

# Test WebSocket
wscat -c ws://localhost:8001/ws/dashboard

# Check logs
tail -f logs/backend/backend.log
```

---

## 📈 Performance

### Optymalizacje

1. **Connection Pooling** - Wykorzystaj pool połączeń dla wysokiego ruchu
2. **Message Batching** - Grupuj wiadomości dla lepszej wydajności
3. **Heartbeat Optimization** - Dostosuj heartbeat do potrzeb
4. **Circuit Breaker** - Zapobiegaj cascading failures
5. **Offline Queue** - Buforuj wiadomości offline

### Metryki do monitorowania

- **Connection Count** - Liczba aktywnych połączeń
- **Message Rate** - Wiadomości na sekundę
- **Error Rate** - Procent błędów
- **Response Time** - Średni czas odpowiedzi
- **Reconnect Rate** - Częstotliwość reconnectów
- **Offline Queue Size** - Rozmiar kolejki offline

---

## 🔒 Security

### Zalecenia

1. **WSS** - Używaj WSS w produkcji
2. **Origin Validation** - Waliduj origin połączeń
3. **Message Validation** - Waliduj wszystkie wiadomości
4. **Rate Limiting** - Implementuj rate limiting
5. **Authentication** - Dodaj autentykację WebSocket

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

## 📚 Resources

### Documentation
- [WebSocket Enterprise Guide](./WEBSOCKET_ENTERPRISE_GUIDE.md)
- [Developer Experience Guide](./DEVELOPER_EXPERIENCE.md)
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

*WebSocket Documentation - FoodSave AI*
*Ostatnia aktualizacja: 2025-01-27*
*Wersja: 1.0.0* 