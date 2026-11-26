// PAUteca · funcionamiento sin conexión.
// Primero la red (para ver siempre los ejercicios más recientes); si no hay conexión, la copia guardada.
// Sube el número de versión cada vez que publiques una actualización.
const V="pauteca-v10";
const CORE=["./","index.html","app.js","sims.js","estilos.css","manifest.webmanifest","datos/catalogo.json","apple-touch-icon.png","icon-192.png","icon-512.png","icon-maskable-192.png","icon-maskable-512.png","favicon-32.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(r=>{
    if(r&&(r.ok||r.type==="opaque")){const c=r.clone();caches.open(V).then(ch=>ch.put(e.request,c))}
    return r;
  }).catch(()=>caches.match(e.request).then(hit=>hit||caches.match("index.html"))));
});
