/**
 * Legacy SmartVane — nettlesere som fortsatt har registrert denne URL-en
 * henter scriptet ved SW-oppdatering. Dette erstatter gammel worker med
 * et kort script som tømmer caches, avregistrerer seg og forsvinner.
 */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.registration.unregister()
    })()
  )
})
