self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("tradersxauusd-cache-v1").then((cache) => {
      return cache.addAll(["/", "/index.html", "/offline.html"]);
    })
  );
  console.log("✅ Service Worker: Installed");
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cache) => cache !== "tradersxauusd-cache-v1")
          .map((cache) => caches.delete(cache))
      );
    })
  );
  console.log("♻️ Service Worker: Old caches cleared");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => caches.match("/offline.html"))
      );
    })
  );
});
