// public/sw.js — Service Worker PWA
// Cache les assets statiques pour le mode hors ligne

const CACHE_NAME = "ecolink-v1"
const STATIC_ASSETS = [
  "/",
  "/recherche",
  "/a-propos",
  "/manifest.json",
]

// Installation : mise en cache des assets statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activation : supprime les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch : stratégie network-first, fallback cache
self.addEventListener("fetch", (event) => {
  // Ne pas intercepter les appels API
  if (event.request.url.includes("/api/")) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse si c'est une requête GET
        if (event.request.method === "GET") {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
