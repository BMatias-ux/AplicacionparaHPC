// src/navegacion.ts
// Las secciones de la app. La sección activa vive en el "hash" de la URL (#servicios, #contacto...).
// Ventajas: el botón "atrás" del celular funciona, y se puede compartir un enlace directo
// a una sección (ej. portal.habilidadesparaelcambio.com.ar/#formacion) sin configurar rutas en Vercel.

import { Home, HeartHandshake, GraduationCap, Wind, Phone, type LucideIcon } from 'lucide-react';

export type Seccion = 'inicio' | 'servicios' | 'formacion' | 'recursos' | 'contacto';

export const SECCIONES: { id: Seccion; etiqueta: string; icono: LucideIcon }[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: Home },
  { id: 'servicios', etiqueta: 'Tratamientos', icono: HeartHandshake },
  { id: 'formacion', etiqueta: 'Profesionales', icono: GraduationCap },
  { id: 'recursos', etiqueta: 'Recursos', icono: Wind },
  { id: 'contacto', etiqueta: 'Contacto', icono: Phone },
];

/** Lee la sección del hash. Si no existe o es inválida, vuelve a "inicio". */
export function seccionDesdeHash(hash: string): Seccion {
  const id = hash.replace('#', '');
  return SECCIONES.some((s) => s.id === id) ? (id as Seccion) : 'inicio';
}
