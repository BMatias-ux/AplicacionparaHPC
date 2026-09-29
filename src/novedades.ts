// src/novedades.ts
// Avisos y novedades del portal: el canal para contar lo nuevo del ecosistema HPC
// (un curso en cursosdepsicologia.com.ar, una formación, que el asistente de WhatsApp
// ya está activo, etc.). Se muestran arriba de todo en Inicio.
//
// Para agregar una novedad: sumá un objeto a la lista. Para sacarla: `activa: false`
// (queda guardada por si se reutiliza). También se puede programar con `desde`/`hasta`
// (fechas AAAA-MM-DD, hora de Argentina): fuera de ese rango no se muestra sola.
//
// Los enlaces externos llevan parámetros UTM (utm_source=portal-hpc...). No son un
// "referido": sólo le permiten a la plataforma de destino (Google Analytics, Meta)
// saber que la visita vino del portal, así se puede medir qué avisos funcionan.

export interface Novedad {
  id: string; // único y estable: se usa para recordar si la persona la cerró
  etiqueta: string; // la "pastilla" dorada de arriba (ej. "Nuevo curso")
  titulo: string;
  texto: string;
  cta: string; // texto del botón
  url: string;
  externo: boolean; // true = abre en otra pestaña (otro sitio del ecosistema)
  campania?: string; // nombre para utm_campaign (sólo enlaces externos)
  activa: boolean;
  desde?: string; // AAAA-MM-DD inclusive
  hasta?: string; // AAAA-MM-DD inclusive
}

export const NOVEDADES: Novedad[] = [
  {
    id: 'curso-criar-con-limites',
    etiqueta: 'Nuevo curso · Para familias',
    titulo: 'Criar con límites',
    texto:
      'Ocho clases, ocho herramientas para acompañar la crianza sin gritos: berrinches, pantallas, emociones y hábitos. Con la Lic. Virginia Almeida.',
    cta: 'Ver el curso',
    url: 'https://cursosdepsicologia.com.ar/course/criar-con-limites/',
    externo: true,
    campania: 'criar-con-limites',
    activa: true,
  },
  {
    // Activar el día del corte a 360dialog, cuando el asistente atienda en el número del equipo.
    id: 'asistente-whatsapp',
    etiqueta: 'Novedad',
    titulo: 'Te respondemos al instante por WhatsApp',
    texto:
      'Nuestro asistente virtual te da la información que buscás en el momento y, si preferís, te pasa con una persona del equipo.',
    cta: 'Escribinos',
    url: '#contacto',
    externo: false,
    activa: false,
  },
];

/** Agrega los parámetros UTM a un enlace externo, sin pisar los que ya tenga. */
export function conUtm(url: string, campania?: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'portal-hpc');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'banner');
    if (campania && !u.searchParams.has('utm_campaign')) u.searchParams.set('utm_campaign', campania);
    return u.toString();
  } catch {
    return url; // si no es una URL completa (ej. "#contacto"), se deja igual
  }
}

/** Fecha de hoy en Argentina, formato AAAA-MM-DD, para comparar con desde/hasta. */
function hoyEnArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}

/** Las novedades que corresponde mostrar hoy. */
export function novedadesVigentes(lista: Novedad[] = NOVEDADES): Novedad[] {
  const hoy = hoyEnArgentina();
  return lista.filter((n) => n.activa && (!n.desde || n.desde <= hoy) && (!n.hasta || hoy <= n.hasta));
}
