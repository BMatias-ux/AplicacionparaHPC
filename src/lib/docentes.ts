// src/lib/docentes.ts
// Tipos y ayudas del módulo Docentes (migración 20261020000011_docentes.sql).
// Lo usan el panel de administración (PanelDocentes), la vista de cada docente (MisClases)
// y la encuesta pública (Encuesta).

export type EstadoDocente = 'activo' | 'observacion' | 'baja';
export type Turno = 'manana' | 'tarde' | 'unico';
export type EstadoClase = 'programada' | 'confirmada' | 'dictada' | 'cancelada_aviso' | 'cancelada_sin_aviso' | 'suspendida_hpc';

export interface Formacion {
  id: string;
  nombre: string;
  programa: string;
  cohorte: string;
  activa: boolean;
  orden: number;
}

export interface Docente {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  temas: string | null;
  cv_url: string | null;
  estado: EstadoDocente;
  baja_propuesta: boolean;
  motivo_baja: string | null;
  fecha_baja: string | null;
  notas: string | null;
}

/** Fila de la vista docentes_resumen. */
export interface ResumenDocente {
  id: string;
  clases_proximas: number;
  clases_dictadas: number;
  sin_confirmar_14_dias: number;
  cancelaciones: number;
  respuestas_encuesta: number;
  promedio_docente: number | null;
  promedio_general: number | null;
}

export interface Clase {
  id: string;
  formacion_id: string;
  mes: string; // 'AAAA-MM-01'
  fecha: string | null;
  turno: Turno;
  docente_id: string | null;
  co_docente_id: string | null;
  temas: string | null;
  estado: EstadoClase;
  confirmada_at: string | null;
  material_url: string | null;
  notas: string | null;
  codigo_encuesta: string;
}

export interface Incidencia {
  id: number;
  docente_id: string;
  clase_id: string | null;
  tipo: string;
  fecha: string;
  detalle: string | null;
}

/** Fila de mis_clases() (lo que ve cada docente). */
export interface MiClase {
  id: string;
  formacion: string;
  programa: string;
  mes: string;
  fecha: string | null;
  turno: Turno;
  temas: string | null;
  estado: EstadoClase;
  confirmada_at: string | null;
  material_url: string | null;
  co_docente: string | null;
  codigo_encuesta: string;
}

/** Fila de encuesta_clase() / encuesta_clases_recientes(). */
export interface ClaseEncuesta {
  codigo: string;
  formacion: string;
  programa: string;
  fecha: string | null;
  mes: string;
  turno: Turno;
  docentes: string;
}

export const TURNOS: Record<Turno, string> = {
  manana: 'Mañana',
  tarde: 'Tarde',
  unico: 'Encuentro',
};

/** "turno mañana" / "turno tarde"; vacío para los encuentros de un solo bloque. */
export function textoTurno(t: Turno): string {
  return t === 'unico' ? 'encuentro' : `turno ${TURNOS[t].toLowerCase()}`;
}

export const HORARIO_TURNO: Record<Turno, string> = {
  manana: '9 a 12 hs',
  tarde: '13 a 16 hs',
  unico: '',
};

export const ESTADOS_CLASE: Record<EstadoClase, { texto: string; clase: string }> = {
  programada: { texto: 'Sin confirmar', clase: 'bg-amber-50 text-amber-800' },
  confirmada: { texto: 'Confirmada', clase: 'bg-hpc-claro text-hpc' },
  dictada: { texto: 'Dictada', clase: 'bg-green-50 text-green-800' },
  cancelada_aviso: { texto: 'Cancelada (avisó)', clase: 'bg-red-50 text-red-800' },
  cancelada_sin_aviso: { texto: 'Cancelada sin aviso', clase: 'bg-red-100 text-red-900' },
  suspendida_hpc: { texto: 'Suspendida por HPC', clase: 'bg-tinta/10 text-tinta/70' },
};

export const ESTADOS_DOCENTE: Record<EstadoDocente, { texto: string; clase: string }> = {
  activo: { texto: 'Activo/a', clase: 'bg-green-50 text-green-800' },
  observacion: { texto: 'En observación', clase: 'bg-amber-50 text-amber-800' },
  baja: { texto: 'Baja', clase: 'bg-tinta/10 text-tinta/60' },
};

export const TIPOS_INCIDENCIA: Record<string, string> = {
  cancelacion_aviso: 'Canceló avisando',
  cancelacion_sin_aviso: 'Canceló sin aviso',
  material_tarde: 'Entregó el material tarde',
  llegada_tarde: 'Llegó tarde',
  otro: 'Otro',
  excepcion_aprobada: 'Excepción aprobada (sigue activo/a)',
};

// ---------- Fechas ----------
// Las fechas llegan como 'AAAA-MM-DD'. new Date('2026-10-24') las toma en UTC y en Argentina
// mostraría el día anterior: por eso se arman con año, mes y día por separado.

function aFecha(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function hoyIso(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

/** "Sábado 24/10" */
export function fechaCorta(iso: string | null): string {
  if (!iso) return 'Sin fecha';
  const f = aFecha(iso);
  const dia = f.toLocaleDateString('es-AR', { weekday: 'long' });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${f.getDate()}/${f.getMonth() + 1}`;
}

/** "Octubre 2026" */
export function nombreMes(iso: string): string {
  const f = aFecha(iso);
  const mes = f.toLocaleDateString('es-AR', { month: 'long' });
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${f.getFullYear()}`;
}

/** true si la clase ya pasó (por fecha; sin fecha, si terminó su mes). */
export function yaPaso(c: { fecha: string | null; mes: string }): boolean {
  const hoy = hoyIso();
  if (c.fecha) return c.fecha < hoy;
  const fin = aFecha(c.mes);
  fin.setMonth(fin.getMonth() + 1);
  fin.setDate(0);
  return `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}` < hoy;
}

/** Enlace de la encuesta de una clase (la abre el alumno, sin cuenta). */
export function enlaceEncuesta(codigo: string): string {
  return `${window.location.origin}/#encuesta?c=${codigo}`;
}

/** Enlace general de la encuesta (el alumno elige formación y clase). */
export function enlaceEncuestaGeneral(): string {
  return `${window.location.origin}/#encuesta`;
}

/** wa.me con el número de un/a docente (sin la firma del portal: es un mensaje del equipo). */
export function enlaceWhatsAppDocente(telefono: string, texto: string): string {
  let n = telefono.replace(/\D/g, '');
  if (n.startsWith('0')) n = n.slice(1);
  if (!n.startsWith('54')) n = `549${n}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}
