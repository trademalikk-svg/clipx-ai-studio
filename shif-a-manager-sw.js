"use strict";
const CACHE="shif-a-owner-manager-v1";
const SHELL=[
 "./web-manager.html",
 "./scripts/shif-a-auth.js",
 "./scripts/shif-a-tools.js",
 "./scripts/shif-a-web-manager.js"
];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("shif-a-owner-manager-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET")return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.includes("/functions/")||url.pathname.includes("/rest/v1/")||url.pathname.includes("/auth/v1/")||url.pathname.includes("/storage/v1/"))return;
 if(SHELL.some(path=>new URL(path,self.location.href).pathname===url.pathname)){
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
   return response;
  })));
 }
});