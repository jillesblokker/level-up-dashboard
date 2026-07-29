// Service Worker for Level Up - Medieval Habit Tracker
// v2.1.0-force-purge - Direct-pass SW for API, JS bundles, and App Pages; Cache-First for static media assets ONLY
const CACHE_VERSION = 'v2.1.0-force-purge'
const STATIC_CACHE = `level-up-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `level-up-dynamic-${CACHE_VERSION}`

// Only cache static media assets - NEVER app routes or JS scripts
const STATIC_FILES = [
  '/manifest.webmanifest',
  '/icons/thrivehaven_fav_optimized.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// ─── Install: skip waiting immediately ───────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES).catch(() => {});
    }).then(() => self.skipWaiting())
  );
})

// ─── Activate: PURGE ALL OLD CACHES so browsers instantly receive new code ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Purging stale cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
})

// Fetch event - serve from cache ONLY for media images/audio; bypass network 100% for JS, pages, and API
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip external requests
  if (url.origin !== location.origin) return

  // NEVER intercept API routes, page navigations, JS files, CSS, or Next.js RSC data
  // Let the browser handle script loading natively so code updates apply instantly
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    request.mode === 'navigate' ||
    url.searchParams.has('_rsc') ||
    request.headers.get('rsc') === '1' ||
    request.headers.get('accept')?.includes('text/html') ||
    !url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|mp3|wav|ogg|ico|webmanifest)$/)
  ) {
    return;
  }

  // Strategy: Cache First ONLY for Images and Audio
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse
        const responseToCache = networkResponse.clone()
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache)
        })
        return networkResponse
      })
    })
  )
})

// Background sync for quest completions
self.addEventListener('sync', (event) => {
  if (event.tag === 'quest-sync') {
    console.log('[SW] Background sync: quest completions')
    event.waitUntil(syncQuestCompletions())
  }
})

// Push notifications for quest reminders
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  const options = {
    body: event.data ? event.data.text() : 'Time to complete your quests!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Level Up - Quest Reminder', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/quests')
    )
  }
})

// Helper function to sync quest completions (Disabled to prevent stale IndexedDB state overwrites)
async function syncQuestCompletions() {
  try {
    const db = await openDatabase();
    if (db) {
      const transaction = db.transaction('pendingQuests', 'readwrite');
      const store = transaction.objectStore('pendingQuests');
      store.clear();
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Helper functions for IndexedDB operations
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LevelUpOfflineDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingQuests')) {
        db.createObjectStore('pendingQuests', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function getPendingCompletions() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pendingQuests', 'readonly');
      const store = transaction.objectStore('pendingQuests');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[SW] Failed to open DB:', error);
    return [];
  }
}

async function removePendingCompletion(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pendingQuests', 'readwrite');
      const store = transaction.objectStore('pendingQuests');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[SW] Failed to delete from DB:', error);
    return false;
  }
}
