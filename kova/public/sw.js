const CACHE_NAME = 'kova-v1'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache essential files
      return cache.addAll([
        '/',
        '/projects',
        '/offline' // Add fallback offline page later
      ])
    })
  )
})

self.addEventListener('fetch', event => {
  // Network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone())
          })
        }
        return response
      })
      .catch(() => {
        // Return cached version if offline
        return caches.match(event.request)
          .then(response => response || caches.match('/offline'))
      })
  )
})
