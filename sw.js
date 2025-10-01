// Service Worker for Sapo Tracker Enhanced
// Version 1.0

const CACHE_NAME = 'sapo-tracker-v1.0';
const BASE_PATH = '/sapo-finanze/';

// Files to cache for offline functionality
const STATIC_FILES = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'js/app.js',
    // External CDN resources (cached separately)
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('🔧 SW: Installing Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 SW: Caching static files...');
                return cache.addAll(STATIC_FILES.filter(url => !url.startsWith('http')));
            })
            .then(() => {
                console.log('✅ SW: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ SW: Error caching static files:', error);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 SW: Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ SW: Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached files with fallback strategy
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http protocols
    if (!request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('📱 SW: Serving from cache:', url.pathname);
                    return cachedResponse;
                }
                
                // Otherwise fetch from network
                return fetch(request)
                    .then((response) => {
                        // Cache successful responses for static assets
                        if (response.ok && shouldCache(request)) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });
                        }
                        
                        return response;
                    })
                    .catch((error) => {
                        console.log('🔄 SW: Network fetch failed, trying cache...', error);
                        
                        // Return offline fallback for HTML pages
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match(BASE_PATH + 'index.html');
                        }
                        
                        // Return a basic error response for other resources
                        return new Response('Offline - risorsa non disponibile', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Determine if a request should be cached
function shouldCache(request) {
    const url = request.url;
    
    // Cache our app files
    if (url.includes(BASE_PATH)) {
        return true;
    }
    
    // Cache CDN resources
    if (url.includes('cdn.tailwindcss.com') || 
        url.includes('cdn.jsdelivr.net') || 
        url.includes('cdnjs.cloudflare.com') ||
        url.includes('fonts.googleapis.com') ||
        url.includes('fonts.gstatic.com')) {
        return true;
    }
    
    return false;
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                console.log('📨 SW: Skip waiting requested');
                self.skipWaiting();
                break;
                
            case 'CACHE_URLS':
                console.log('📨 SW: Cache URLs requested');
                if (event.data.payload) {
                    caches.open(CACHE_NAME)
                        .then(cache => cache.addAll(event.data.payload))
                        .then(() => {
                            event.ports[0].postMessage({ success: true });
                        })
                        .catch(error => {
                            event.ports[0].postMessage({ success: false, error: error.message });
                        });
                }
                break;
                
            case 'GET_VERSION':
                event.ports[0].postMessage({ version: CACHE_NAME });
                break;
                
            default:
                console.log('📨 SW: Unknown message type:', event.data.type);
        }
    }
});

// Background sync for offline data (if supported)
if ('sync' in self.registration) {
    self.addEventListener('sync', (event) => {
        console.log('🔄 SW: Background sync triggered:', event.tag);
        
        if (event.tag === 'background-sync-transactions') {
            event.waitUntil(syncTransactions());
        }
    });
}

// Sync transactions when back online
async function syncTransactions() {
    try {
        console.log('🔄 SW: Syncing transactions...');
        // This would normally sync with a server
        // For our localStorage-based app, we just log the action
        console.log('✅ SW: Transaction sync completed (localStorage mode)');
    } catch (error) {
        console.error('❌ SW: Transaction sync failed:', error);
        throw error;
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('📬 SW: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Aggiornamento Sapo Tracker',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐸</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐸</text></svg>',
        tag: 'sapo-tracker-notification',
        requireInteraction: false,
        actions: [
            {
                action: 'open',
                title: 'Apri App',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('🐸 Sapo Tracker', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('📬 SW: Notification clicked');
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Check if app is already open
                    for (const client of clientList) {
                        if (client.url.includes(BASE_PATH) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Open new window if not already open
                    if (clients.openWindow) {
                        return clients.openWindow(BASE_PATH);
                    }
                })
        );
    }
});

console.log('🐸 Sapo Tracker Service Worker loaded successfully!');