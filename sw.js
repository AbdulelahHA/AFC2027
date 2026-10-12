/* Service worker: shows goal alerts and opens the app when one is tapped. No caching here (yet). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: e.data?.text() || 'AFC Asian Cup 2027' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'AFC Asian Cup 2027', {
    body: d.body || '', tag: d.tag, renotify: !!d.tag,
    icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png',
    data: { url: new URL(d.url || './', self.registration.scope).href }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || self.registration.scope;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = wins.find(w => w.url.startsWith(self.registration.scope));
    if(open){ await open.focus(); return open.navigate(url).catch(() => {}); }
    return self.clients.openWindow(url);
  })());
});
