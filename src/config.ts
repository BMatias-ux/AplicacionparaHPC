// src/config.ts
// Datos de contacto en UN solo lugar. Si cambia el número o el correo, se toca sólo acá.

/** Número de WhatsApp del equipo (el mismo que usa el bot). Formato wa.me: sin "+", sin espacios. */
export const WHATSAPP_NUMERO = '5493875233693';

/** El mismo número, para mostrarlo a las personas. */
export const WHATSAPP_VISIBLE = '+54 9 387 523-3693';

export const EMAIL_CONSULTAS = 'consultas@habilidadesparaelcambio.com.ar';

/**
 * Responsable de la base de datos (Ley 25.326, art. 6: hay que informar identidad y domicilio).
 * ⚠️ PENDIENTE: completar `domicilio` con el domicilio legal de la Fundación. Mientras esté
 * vacío, el aviso de privacidad no muestra la línea del domicilio.
 */
export const RESPONSABLE_DATOS = {
  nombre: 'Fundación Habilidades para el Cambio',
  domicilio: '',
} as const;

export const HORARIO_ATENCION = 'Lunes a viernes de 9 a 18 hs';

/** Sitios de la red. */
export const SITIOS = {
  institucional: 'https://habilidadesparaelcambio.com.ar',
  fundacion: 'https://habilidadesparaelcambio.org',
  cursos: 'https://cursosdepsicologia.com.ar',
  cajaEureka: 'https://cajaeureka.com.ar',
  talleresGratis: 'https://www.habilidadesparaelcambio.com.ar/talleres-gratis',
  formaciones: 'https://habilidadesparaelcambio.com.ar/formaciones-anuales-agosto-2026/',
  membresia: 'https://habilidadesparaelcambio.com.ar/membresia-habilidades-para-el-cambio/',
  sumateProfesional: 'https://habilidadesparaelcambio.org/sumate-como-profesional',
} as const;
