// Service Worker for Level Up - Medieval Habit Tracker
const CACHE_NAME = 'level-up-v1.0.0'
const STATIC_CACHE = 'level-up-static-v1.0.0'
const DYNAMIC_CACHE = 'level-up-dynamic-v1.0.0'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/quests',
  '/kingdom',
  '/character',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('[SW] Static files cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static files:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url)
          return cachedResponse
        }

        console.log('[SW] Fetching from network:', request.url)
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response for caching
            const responseToCache = response.clone()

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache)
              })

            return response
          })
          .catch((error) => {
            console.error('[SW] Network fetch failed:', error)
            
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/offline.html')
            }
            
            throw error
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
async function getPendingCompletions() {
  // This would integrate with your existing offline queue system
  return []
}

async function removePendingCompletion(id) {
  // This would integrate with your existing offline queue system
  return true
}
