// OnStream Service Worker for PWA functionality
const CACHE_NAME = 'onstream-v1.0.0';
const STATIC_CACHE = 'onstream-static-v1.0.0';
const DYNAMIC_CACHE = 'onstream-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Dynamic assets patterns to cache
const CACHE_PATTERNS = [
  /^https:\/\/api\.themoviedb\.org\/.*$/,
  /^https:\/\/image\.tmdb\.org\/.*$/,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:js|css|html)$/
];

// Assets to never cache
const NEVER_CACHE_PATTERNS = [
  /^https:\/\/vidsrc\.to\/.*$/,
  /^https:\/\/.*\.2embed\..*$/,
  /^https:\/\/.*embed.*$/,
  /\/api\/auth\//,
  /\/api\/.*\/stream$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('OnStream SW: Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('OnStream SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
      })
      .catch((error) => {
        console.error('OnStream SW: Failed to cache static assets:', error);
      })
  );
  
  // Force activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('OnStream SW: Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('OnStream SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Never cache streaming URLs or auth endpoints
  if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    return;
  }
  
  // Handle different request types
  if (request.url.startsWith(self.location.origin)) {
    // Same-origin requests - cache first for static assets, network first for API
    if (request.url.includes('/api/')) {
      event.respondWith(networkFirstStrategy(request));
    } else {
      event.respondWith(cacheFirstStrategy(request));
    }
  } else if (CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    // External assets (images, API responses) - cache first
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('OnStream SW: Cache-first strategy failed:', error);
    
    // Return fallback for navigation requests
    if (request.destination === 'document') {
      const cachedFallback = await caches.match('/');
      return cachedFallback || new Response('OnStream is offline', { status: 503 });
    }
    
    // Return error response for other requests
    return new Response('Network error', { status: 503 });
  }
}

// Network-first strategy for API requests
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful API responses (except auth and streaming)
    if (networkResponse.status === 200 && 
        !request.url.includes('/auth/') && 
        !request.url.includes('/stream')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('OnStream SW: Network request failed:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Offline - please check your connection',
      error: 'OFFLINE' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('OnStream SW: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Sync any pending user actions when back online
    console.log('OnStream SW: Handling background sync');
    
    // Clear old dynamic cache entries
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();
    
    // Remove cached entries older than 24 hours
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const responseTime = new Date(dateHeader).getTime();
          if (now - responseTime > twentyFourHours) {
            await cache.delete(request);
          }
        }
      }
    }
  } catch (error) {
    console.error('OnStream SW: Background sync failed:', error);
  }
}

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New content available on OnStream',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'onstream-notification',
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Open OnStream'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'OnStream', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Handle app installation
self.addEventListener('appinstalled', (event) => {
  console.log('OnStream PWA: App installed successfully');
});

console.log('OnStream Service Worker loaded successfully');