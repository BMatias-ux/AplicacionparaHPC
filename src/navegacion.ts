// src/navegacion.ts
// Las secciones de la app. La sección activa vive en el "hash" de la URL (#servicios, #contacto...).
// Ventajas: el botón "atrás" del celular funciona, y se puede compartir un enlace directo
// a una sección (ej. portal.habilidadesparaelcambio.com.ar/#equipo) sin configurar rutas en Vercel.
//
// `movil: false` = la sección no ocupa lugar en la barra inferior del celular (sólo entran 5
// cómodas en 390 px). Sigue en la barra lateral de la computadora y se llega desde Inicio.

import { Home, HeartHandshake, Users, GraduationCap, Wind, Phone, type LucideIcon } from 'lucide-react';

export type Seccion = 'inicio' | 'servicios' | 'equipo' | 'formacion' | 'recursos' | 'contacto';

export const SECCIONES: { id: Seccion; etiqueta: string; icono: LucideIcon; movil: boolean }[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: Home, movil: true },
  { id: 'servicios', etiqueta: 'Tratamientos', icono: HeartHandshake, movil: true },
  { id: 'equipo', etiqueta: 'Equipo', icono: Users, movil: true },
  { id: 'formacion', etiqueta: 'Formación', icono: GraduationCap, movil: true },
  { id: 'recursos', etiqueta: 'Recursos', icono: Wind, movil: false },
  { id: 'contacto', etiqueta: 'Contacto', icono: Phone, movil: true },
];

/** Lee la sección del hash. Si no existe o es inválida, vuelve a "inicio". */
export function seccionDesdeHash(hash: string): Seccion {
  const id = hash.replace('#', '');
  return SECCIONES.some((s) => s.id === id) ? (id as Seccion) : 'inicio';
}
