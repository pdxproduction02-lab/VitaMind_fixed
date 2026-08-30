const CACHE="vitamind-v2";
const ASSETS=["/","/index.html","/styles.css","/app.js","/manifest.webmanifest"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET" || new URL(e.request.url).pathname.startsWith("/api/")) return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>cs[0]?cs[0].focus():clients.openWindow("/")))});
