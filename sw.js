importScripts('js/version.js');

const CACHE_NAME = `amar-taka-v${APP_VERSION}`;
const DATA_CACHE_NAME = `amar-taka-data-v${APP_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',

    // CSS files
    './css/styles.css',
    './css/bk.css',
    './css/onboarding.css',

    // JavaScript files
    './js/version.js',
    './js/app.js',
    './js/db.js',
    './js/home.js',
    './js/transactions.js',
    './js/analysis.js',
    './js/settings.js',
    './js/budget.js',
    './js/categories.js',
    './js/categoryform.js',
    './js/goals.js',
    './js/profiles.js',
    './js/applock.js',
    './js/demomode.js',
    './js/onboarding.js',
    './js/export.js',
    './js/lang.js',
    './js/utils.js',
    './js/notifications.js',
    './js/navigation.js',
    './js/modal-scroll-lock.js',

    // Images
    './image/icon.png',
    './image/favicon.png',

    // Pages
    './pages/onboarding.html',

];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
            .then(() => {
                // Notify all clients that a new version is active
                return self.clients.matchAll();
            })
            .then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'NEW_VERSION_ACTIVATED',
                        version: CACHE_NAME
                    });
                });
            })
    );
});

// Fetch event - serve from network first for app files, cache for assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Handle API/data requests with network-first strategy
    if (request.url.includes('/api/') || request.method !== 'GET') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone the response before caching
                    const responseClone = response.clone();

                    caches.open(DATA_CACHE_NAME)
                        .then((cache) => {
                            cache.put(request, responseClone);
                        });

                    return response;
                })
                .catch(() => {
                    // If network fails, try to serve from cache
                    return caches.match(request);
                })
        );
        return;
    }

    // Network-first strategy for HTML, CSS, and JS files to ensure fresh content
    const isAppFile = request.url.match(/\.(html|css|js)$/i) ||
        request.url.endsWith('/') ||
        request.url.includes('index.html');

    if (isAppFile) {
        event.respondWith(
            fetch(request, { cache: 'no-cache' })
                .then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return caches.match(request).then(cached => cached || response);
                    }

                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(request, responseClone);
                        });

                    return response;
                })
                .catch(() => {
                    // If network fails, serve from cache
                    return caches.match(request).then(cached => {
                        if (cached) return cached;
                        // Fallback to index.html for navigation requests
                        if (request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
                })
        );
        return;
    }

    // Cache-first strategy for images and other static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetchAndCache(request);
            })
            .catch((error) => {
                // Return offline fallback page if available
                if (request.destination === 'document') {
                    return caches.match('./index.html');
                }
            })
    );
});

// Helper function to fetch and cache
function fetchAndCache(request) {
    return fetch(request)
        .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type === 'error') {
                return response;
            }

            // Clone the response
            const responseClone = response.clone();

            // Cache the fetched response
            caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(request, responseClone);
                });

            return response;
        });
}

// Handle messages from the client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                return self.clients.matchAll();
            }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'CACHE_CLEARED',
                        message: 'All caches have been cleared'
                    });
                });
            })
        );
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            type: 'VERSION',
            version: CACHE_NAME
        });
    }
});

// Background sync for offline transactions (if needed in future)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-transactions') {
        event.waitUntil(
            // Add your sync logic here
            Promise.resolve()
        );
    }
});

// Push notification support (optional for future features)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New notification from Amar Taka',
        icon: '/image/icon.png',
        badge: '/image/icon.png',
        vibrate: [200, 100, 200],
        tag: 'amar-taka-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('Amar Taka', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If app is already open, focus it
                for (let client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise, open a new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

console.log('[Service Worker] Active');
