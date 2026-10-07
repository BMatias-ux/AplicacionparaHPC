// public/sw.js — Service worker del portal.
//
// Qué hace: guarda una copia de la app para que abra aunque no haya conexión.
// Estrategia "primero la red": siempre intenta traer la versión nueva; si no hay internet,
// usa la copia guardada. Así nadie queda viendo una versión vieja después de un deploy.
//
// Cuando cambies algo importante de este archivo, subí la versión de CACHE para que el
// navegador descarte la copia anterior.

const CACHE = 'hpc-portal-v8'; // v8: corrección del perfil propio de cuentas del equipo

self.addEventListener('install', () => {
  // Activar la versión nueva sin esperar a que se cierren todas las pestañas.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Borrar caches de versiones anteriores.
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Sólo pedidos GET de nuestro propio dominio. WhatsApp, Google Fonts y demás pasan de largo.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copia));
        return respuesta;
      })
      .catch(async () => {
        const guardada = await caches.match(request);
        if (guardada) return guardada;
        // Si pidió una página y no está guardada, devolver la portada (la app resuelve el resto).
        if (request.mode === 'navigate') {
          const portada = await caches.match('/');
          if (portada) return portada;
        }
        return Response.error();
      }),
  );
});
