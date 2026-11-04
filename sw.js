/* App shell. Video pages stay on the network so a new approval shows up quickly. */
var CACHE = "minitele-shell-3";
var PRECACHE = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.webmanifest",
  "./css/kid.css",
  "./css/admin.css",
  "./js/i18n.js",
  "./js/dpad.js",
  "./js/kid.js",
  "./js/admin.js",
  "./js/github.js",
  "./data/videos.json",
  "./data/channels.json",
  "./data/config.json",
  "./data/feeds.json",
  "./icons/favicon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-180.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function networkFirst(request) {
  return fetch(request).then(function (response) {
    if (response && response.ok) {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) {
        cache.put(request, copy);
      });
    }
    return response;
  }).catch(function () {
    return caches.match(request);
  });
}

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(request, copy);
        });
      }
      return response;
    });
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  var fresh = /\/data\/.+\.json$/.test(url.pathname) || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  event.respondWith(fresh ? networkFirst(request) : cacheFirst(request));
});
