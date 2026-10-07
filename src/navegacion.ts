// src/navegacion.ts
// Las secciones de la app. La sección activa vive en el "hash" de la URL (#servicios, #contacto...).
// Ventajas: el botón "atrás" del celular funciona, y se puede compartir un enlace directo
// a una sección (ej. portal.habilidadesparaelcambio.com.ar/#equipo) sin configurar rutas en Vercel.
//
// `movil: false` = la sección no ocupa lugar en la barra inferior del celular (sólo entran 5
// cómodas en 390 px). Sigue en la barra lateral de la computadora y se llega desde Inicio.
// `menu: false` = no aparece en ningún menú; se llega por enlace (ej. el aviso de privacidad,
// enlazado desde el pie de página, Contacto y el bot de WhatsApp).

import { Home, HeartHandshake, Users, GraduationCap, Wind, Phone, ShieldCheck, UserRoundPen, CircleUserRound, type LucideIcon } from 'lucide-react';

export type Seccion = 'inicio' | 'servicios' | 'equipo' | 'formacion' | 'recursos' | 'mi-espacio' | 'contacto' | 'privacidad' | 'profesionales';

export const SECCIONES: { id: Seccion; etiqueta: string; icono: LucideIcon; movil: boolean; menu?: boolean }[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: Home, movil: true },
  { id: 'servicios', etiqueta: 'Tratamientos', icono: HeartHandshake, movil: true },
  { id: 'equipo', etiqueta: 'Equipo', icono: Users, movil: true },
  // Formación es para profesionales: en el celular se llega desde Inicio ("Soy profesional") y
  // su lugar en la barra inferior lo ocupa "Mi espacio", que es lo que se promociona a pacientes.
  { id: 'formacion', etiqueta: 'Formación', icono: GraduationCap, movil: false },
  { id: 'recursos', etiqueta: 'Recursos', icono: Wind, movil: false },
  // Cuenta del paciente (desde 07/10/2026): avisos, registro de ánimo, ejercicios y, más adelante, turnos.
  { id: 'mi-espacio', etiqueta: 'Mi espacio', icono: CircleUserRound, movil: true },
  { id: 'contacto', etiqueta: 'Contacto', icono: Phone, movil: true },
  { id: 'privacidad', etiqueta: 'Privacidad', icono: ShieldCheck, movil: false, menu: false },
  // Acceso del equipo profesional (Mi ficha). Sólo en la barra lateral de la computadora;
  // en el celular se llega por el enlace que se comparte (#profesionales) o desde el pie.
  { id: 'profesionales', etiqueta: 'Profesionales', icono: UserRoundPen, movil: false },
];

/** Las secciones que se muestran en los menús (todas menos las de `menu: false`). */
export const SECCIONES_MENU = SECCIONES.filter((s) => s.menu !== false);

/** Lee la sección del hash. Si no existe o es inválida, vuelve a "inicio". */
export function seccionDesdeHash(hash: string): Seccion {
  const id = hash.replace('#', '');
  return SECCIONES.some((s) => s.id === id) ? (id as Seccion) : 'inicio';
}
