self.addEventListener('install', (event) => {
  // Activate the new worker immediately.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Take control of existing clients without waiting for reload.
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // No custom caching strategy for now.
})
