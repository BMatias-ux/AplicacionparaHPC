import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// Se importa antes de dibujar la app para no perder el evento de instalación (ver el archivo).
import './lib/instalacion';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registro del service worker (lo que hace que la app sea "instalable" y abra sin conexión).
// Sólo en producción: en desarrollo el cache haría que no veas tus cambios al guardar.
// import.meta.env.PROD lo define Vite: es true en "npm run build" y false en "npm run dev".
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      // Si falla, la app sigue funcionando igual; sólo no queda disponible sin conexión.
      console.warn('No se pudo registrar el service worker:', error);
    });
  });
}
