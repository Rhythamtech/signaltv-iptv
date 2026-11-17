'use strict';
var CACHE = 'signal-shell-v11';
var SHELL = ['./index.html', './style.css', './playlist.js', './channels.js', './app.js', './pwa.js', './manifest.webmanifest', './icons/icon-tv-192.png', './icons/icon-tv-512.png', './icons/icon-tv-maskable.png', './icons/apple-touch-icon.png', './icons/favicon.png'];
var BASE = new URL('./', self.location.href);
function needsLegacyMigration(keys) {
  return keys.some(function (key) { return /^signal-shell-v[1-7]$/.test(key); }) && !keys.some(function (key) { return /^signal-shell-v8$/.test(key); });
}
self.addEventListener('install', function (event) {
  // Early releases had no update button. Migrate those once; modern updates remain opt-in.
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(SHELL.map(function (path) { return new Request(new URL(path, BASE).href, {cache:'reload'}); }));
  }).then(function () { return caches.keys(); }).then(function (keys) { if (needsLegacyMigration(keys)) return self.skipWaiting(); }));
});
self.addEventListener('message', function (event) { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  var migrate = false;
  event.waitUntil(caches.keys().then(function (keys) {
    migrate = needsLegacyMigration(keys);
    return Promise.all(keys.filter(function (key) { return key.indexOf('signal-shell-') === 0 && key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    if (!migrate) return;
    return self.clients.matchAll({type:'window'}).then(function (clients) {
      return Promise.all(clients.filter(function (client) { var url=new URL(client.url); return url.origin===BASE.origin && url.pathname.startsWith(BASE.pathname); }).map(function (client) { return client.navigate(client.url); }));
    });
  }));
});
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  var navigation = event.request.mode === 'navigate';
  var file = navigation ? new URL('./index.html', BASE).href : SHELL.map(function (path) { return new URL(path, BASE).href; }).find(function (path) { return new URL(path).pathname === url.pathname; });
  // A strict app-shell allowlist excludes all playlists, media segments, keys and external requests.
  if (!file) return;
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(file).then(function (hit) { return hit || fetch(event.request); });
  }));
});
