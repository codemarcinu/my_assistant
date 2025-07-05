const CACHE_NAME = 'foodsave-ai-v1';
const OFFLINE_QUEUE_KEY = 'websocket-offline-queue';
const SYNC_TAG = 'websocket-sync';

// Files to cache for offline functionality
const CACHE_FILES = [
  '/',
  '/dashboard',
  '/analytics',
  '/settings',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        console.log('[SW] Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle WebSocket requests (they should not be cached)
  if (request.url.includes('/ws/')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('[SW] Serving from cache:', request.url);
          return response;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Background sync for offline WebSocket messages
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncOfflineMessages());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New message from FoodSave AI',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('FoodSave AI', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CACHE_OFFLINE_MESSAGE':
      cacheOfflineMessage(data);
      break;
    case 'GET_OFFLINE_QUEUE':
      getOfflineQueue().then(queue => {
        event.ports[0].postMessage(queue);
      });
      break;
    case 'CLEAR_OFFLINE_QUEUE':
      clearOfflineQueue();
      break;
    case 'REGISTER_BACKGROUND_SYNC':
      registerBackgroundSync();
      break;
  }
});

// Cache offline WebSocket message
async function cacheOfflineMessage(message) {
  try {
    const queue = await getOfflineQueue();
    queue.push({
      message,
      timestamp: Date.now(),
      id: generateMessageId()
    });
    
    // Keep only last 100 messages
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100);
    }
    
    await setOfflineQueue(queue);
    console.log('[SW] Cached offline message:', message);
  } catch (error) {
    console.error('[SW] Failed to cache offline message:', error);
  }
}

// Get offline message queue
async function getOfflineQueue() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(OFFLINE_QUEUE_KEY);
    return response ? await response.json() : [];
  } catch (error) {
    console.error('[SW] Failed to get offline queue:', error);
    return [];
  }
}

// Set offline message queue
async function setOfflineQueue(queue) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(queue));
    await cache.put(OFFLINE_QUEUE_KEY, response);
  } catch (error) {
    console.error('[SW] Failed to set offline queue:', error);
  }
}

// Clear offline message queue
async function clearOfflineQueue() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(OFFLINE_QUEUE_KEY);
    console.log('[SW] Cleared offline queue');
  } catch (error) {
    console.error('[SW] Failed to clear offline queue:', error);
  }
}

// Sync offline messages when connection is restored
async function syncOfflineMessages() {
  try {
    const queue = await getOfflineQueue();
    
    if (queue.length === 0) {
      console.log('[SW] No offline messages to sync');
      return;
    }

    console.log('[SW] Syncing', queue.length, 'offline messages');

    // Send messages to all clients
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_OFFLINE_MESSAGES',
        data: queue
      });
    }

    // Clear the queue after successful sync
    await clearOfflineQueue();
    
  } catch (error) {
    console.error('[SW] Failed to sync offline messages:', error);
  }
}

// Register background sync
async function registerBackgroundSync() {
  try {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(SYNC_TAG);
      console.log('[SW] Background sync registered');
    }
  } catch (error) {
    console.error('[SW] Failed to register background sync:', error);
  }
}

// Generate unique message ID
function generateMessageId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Periodic cleanup of old cached data
setInterval(async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove cache entries older than 7 days
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const date = response.headers.get('date');
        if (date && new Date(date).getTime() < weekAgo) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Failed to cleanup cache:', error);
  }
}, 24 * 60 * 60 * 1000); // Run once per day 