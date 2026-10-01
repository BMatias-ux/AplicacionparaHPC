// src/lib/instalacion.ts
// Captura el aviso de instalación del navegador para poder mostrar NUESTRO botón "Instalar".
//
// Cómo funciona en cada plataforma:
// - Android (Chrome, Edge, Samsung Internet) y computadora (Chrome, Edge): cuando el sitio
//   cumple los requisitos de PWA (manifest + service worker + HTTPS), el navegador dispara el
//   evento `beforeinstallprompt`. Lo guardamos y, cuando la persona toca "Instalar", llamamos
//   a `prompt()`, que abre la ventana oficial de instalación.
// - iPhone/iPad (Safari): Apple NO dispara ese evento. La única forma es que la persona toque
//   Compartir → "Agregar a inicio". Por eso ahí mostramos instrucciones en lugar del botón.
//
// Este archivo se importa en main.tsx ANTES de dibujar la app: el evento puede llegar apenas
// carga la página, antes de que React monte los componentes, y si no lo escuchamos se pierde.

/** El evento no está en los tipos estándar de TypeScript; lo declaramos con lo que usamos. */
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let eventoGuardado: EventoInstalacion | null = null;
const suscriptores = new Set<() => void>();
const avisar = () => suscriptores.forEach((fn) => fn());

window.addEventListener('beforeinstallprompt', (e) => {
  // preventDefault evita que Chrome muestre su barrita automática: mostramos la nuestra.
  e.preventDefault();
  eventoGuardado = e as EventoInstalacion;
  avisar();
});

window.addEventListener('appinstalled', () => {
  eventoGuardado = null;
  avisar();
});

/** Para que los componentes se enteren cuando cambia el estado (patrón suscribirse/desuscribirse). */
export function suscribirInstalacion(fn: () => void) {
  suscriptores.add(fn);
  return () => {
    suscriptores.delete(fn);
  };
}

/** true si el navegador permite abrir la ventana de instalación ahora. */
export const puedeInstalar = () => eventoGuardado !== null;

/** Abre la ventana oficial de instalación. Devuelve true si la persona aceptó. */
export async function instalar(): Promise<boolean> {
  if (!eventoGuardado) return false;
  const evento = eventoGuardado;
  eventoGuardado = null; // el evento se puede usar una sola vez
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  avisar();
  return outcome === 'accepted';
}

/** true si ya se está usando como app instalada (abierta desde el ícono). */
export function yaInstalada(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari de iPhone usa esta propiedad propia en lugar del media query.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone/iPad. Los iPad nuevos se presentan como "Macintosh", por eso miramos también la pantalla táctil. */
export function esIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}
