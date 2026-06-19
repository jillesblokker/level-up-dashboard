// Service Worker for Level Up - Medieval Habit Tracker
// v1.2.2 - Force cache invalidation to load new chunks
const CACHE_NAME = 'level-up-v1.2.2'
const STATIC_CACHE = 'level-up-static-v1.2.2'
const DYNAMIC_CACHE = 'level-up-dynamic-v1.2.2'

// Only cache static assets - NOT app routes (they are SSR/authenticated and will always fail)
const STATIC_FILES = [
  '/manifest.webmanifest',
  '/icons/thrivehaven_fav.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache only truly static assets, then immediately take control
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          STATIC_FILES.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache static file: ${url}`, err)
              return null
            })
          )
        )
      })
      .then(() => {
        // Take control immediately - don't wait for old SW to die
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  // console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              // console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // console.log('[SW] Service worker activated and ready')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip external requests except for fonts/images from trusted sources
  if (url.origin !== location.origin) {
    if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
      // Font caching logic could go here
    }
    return
  }

  // Completely bypass page navigations and Next.js data/RSC requests
  // Let the browser handle pages natively to allow Clerk redirects to work correctly
  if (request.mode === 'navigate' || url.searchParams.has('_rsc') || request.headers.get('rsc') === '1') {
    return;
  }

  // Completely bypass ALL API requests - let the browser handle them natively
  // This ensures cookies and auth headers are handled correctly by Clerk
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Strategy: Cache First for Images and Audio, Network First for everything else
  const isMedia = url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|mp3|wav|ogg)$/)

  if (isMedia) {
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
        .catch(() => {
           return new Response('Network error and no cache available', { status: 503, statusText: 'Service Unavailable' });
        })
      })
    )
  } else {
    // Network first for pages and other assets
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response
          const responseToCache = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })
          return response
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          
          // Return a fallback response instead of undefined
          return new Response(
            JSON.stringify({ error: 'Network failure or CORS block', offline: true }), 
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    )
  }
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

// Helper function to sync quest completions
async function syncQuestCompletions() {
  try {
    // Get pending quest completions from IndexedDB
    const pendingCompletions = await getPendingCompletions()

    for (const completion of pendingCompletions) {
      try {
        const response = await fetch('/api/quests/smart-completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${completion.token}`
          },
          body: JSON.stringify({
            questId: completion.questId,
            completed: completion.completed
          })
        })

        if (response.ok) {
          // Remove from pending completions
          await removePendingCompletion(completion.id)
          console.log('[SW] Synced quest completion:', completion.questId)
        }
      } catch (error) {
        console.error('[SW] Failed to sync quest completion:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
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
