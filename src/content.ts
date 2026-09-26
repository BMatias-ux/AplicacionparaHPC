// src/content.ts
// Contenido de la app. Sale de los textos que ya usa el bot de WhatsApp (repo bot-hpc,
// lib/textos.js), que a su vez son las plantillas que el equipo usa a mano.
// Criterio: la app dice lo mismo que el bot y que el equipo.
//
// ⚠️ Los PRECIOS no se muestran acá a propósito: cambian seguido y ya viven en el bot.
// Tenerlos en dos lugares es garantía de que alguno quede desactualizado.

import type { MotivoWhatsApp } from './lib/whatsapp';
import { SITIOS } from './config';

export interface Servicio {
  id: string;
  titulo: string;
  bajada: string;
  detalle: string[];
  puntos?: string[];
  aviso?: string;
  motivo: MotivoWhatsApp;
  enlace?: { texto: string; url: string };
}

/** Servicios para pacientes (tratamiento). */
export const SERVICIOS_CLINICOS: Servicio[] = [
  {
    id: 'terapia',
    titulo: 'Terapia individual',
    bajada: 'Psicoterapia con profesionales del equipo, presencial u online.',
    detalle: [
      'Somos un centro de salud mental especializado en Terapia Cognitivo-Conductual (TCC), terapias contextuales y DBT.',
      'Trabajamos de forma particular y emitimos factura para que gestiones el reintegro en tu obra social o prepaga.',
      'Te hacemos unas preguntas cortas para derivarte al profesional más adecuado.',
    ],
    motivo: 'terapia',
  },
  {
    id: 'dbt',
    titulo: 'Programa DBT',
    bajada: 'Terapia Dialéctico Conductual, programa completo y multimodal.',
    detalle: [
      'Terapia basada en la evidencia para personas con emociones intensas y dificultades para regularlas. Combina herramientas de la TCC con prácticas de mindfulness.',
      'Está destinado a cuadros de mayor complejidad. Se hace 100% online para adolescentes y adultos de todo el país, o con terapia individual presencial en Recoleta, Ramos Mejía, San Miguel de Tucumán y Neuquén capital (sujeto a disponibilidad).',
    ],
    puntos: [
      'Programa completo: terapia individual + taller de habilidades + psiquiatría si corresponde.',
      'Sólo talleres, si ya tenés atención individual por otro lado.',
      'En ambos casos se empieza con una entrevista de admisión online.',
    ],
    motivo: 'dbt',
  },
  {
    id: 'talleres',
    titulo: 'Talleres de habilidades DBT',
    bajada: 'Grupos online para adolescentes y adultos. Hay opciones gratuitas.',
    detalle: [
      'Un espacio grupal para aprender y practicar habilidades concretas para gestionar emociones, malestar y relaciones. Un encuentro semanal de 2 horas, 100% online.',
    ],
    puntos: [
      'Mindfulness: estar presente y observar sin juzgar.',
      'Tolerancia al malestar: atravesar emociones intensas sin empeorar las cosas.',
      'Regulación emocional: comprender, nombrar y regular lo que sentís.',
      'Efectividad interpersonal: pedir lo que necesitás y cuidar tus vínculos.',
    ],
    aviso:
      'Es requisito tener acompañamiento psicológico y/o psiquiátrico, con profesionales dispuestos a comunicarse con los coordinadores.',
    motivo: 'talleres',
    enlace: { texto: 'Ver talleres gratuitos', url: SITIOS.talleresGratis },
  },
];

/** Propuestas para profesionales de la salud mental. */
export const SERVICIOS_PROFESIONALES: Servicio[] = [
  {
    id: 'formaciones',
    titulo: 'Formaciones anuales',
    bajada: '9 encuentros mensuales, 100% online, con certificación institucional.',
    detalle: [
      'Programas de formación clínica especializada desde modelos basados en la evidencia (TCC y terapias contextuales). Las clases se graban e incluyen Pasantía Institucional Rotativa HPC.',
    ],
    puntos: [
      'Terapia Dialéctico Conductual (DBT)',
      'Terapias Conductuales Infantojuveniles',
      'Psicoterapia Conductual y Basada en Procesos',
      'Terapias Cognitivo-Conductuales y Contextuales',
      'Trauma y Regulación Emocional',
      'ACT y FAP: Terapias Contextuales Aplicadas',
    ],
    motivo: 'formaciones',
    enlace: { texto: 'Programas y aranceles', url: SITIOS.formaciones },
  },
  {
    id: 'cursos',
    titulo: 'Cursos online',
    bajada: 'Cursada libre, acceso permanente y certificado.',
    detalle: ['El catálogo completo, los temas y los valores están en Cursos de Psicología. La compra se hace directo en el sitio.'],
    motivo: 'cursos',
    enlace: { texto: 'Ir a cursosdepsicologia.com.ar', url: SITIOS.cursos },
  },
  {
    id: 'membresia',
    titulo: 'Membresía',
    bajada: 'Comunidad de desarrollo clínico y profesional.',
    detalle: [],
    puntos: [
      'Todas las formaciones clínicas de la plataforma de cursos.',
      'Supervisión grupal cada dos meses con casos reales.',
      'Canal diario de consulta de casos con la red.',
      '20% de descuento en las formaciones anuales.',
      'Un ateneo anual de la comunidad.',
    ],
    motivo: 'membresia',
    enlace: { texto: 'Beneficios de la membresía', url: SITIOS.membresia },
  },
  {
    id: 'sumate',
    titulo: 'Sumate al equipo',
    bajada: 'Para profesionales que quieran integrar la red HPC.',
    detalle: [
      'El primer paso es completar la Ficha Profesional: con ella asignamos derivaciones con precisión y armamos tu perfil en los espacios digitales de la red.',
    ],
    motivo: 'profesional',
    enlace: { texto: 'Completar la Ficha Profesional', url: SITIOS.sumateProfesional },
  },
];

/**
 * Lugares de atención presencial (del mensaje de terapia individual del bot).
 *
 * ⚠️ Zona Norte (San Isidro) y Salta capital NO se listan: al corte de septiembre 2026 no hay
 * profesionales cargados en esas zonas y ya hubo un reclamo por publicidad que prometía Salta.
 * Se agregan de nuevo acá cuando haya equipo presencial confirmado.
 */
export const SEDES: { zona: string; lugares: string }[] = [
  { zona: 'Ciudad de Buenos Aires', lugares: 'Belgrano, Parque Chacabuco, Retiro y Monserrat' },
  { zona: 'Zona Sur', lugares: 'Lomas de Zamora y Lanús Este' },
  { zona: 'Zona Oeste', lugares: 'Ramos Mejía, San Justo, Haedo Norte (Morón) y Liniers' },
  { zona: 'Neuquén', lugares: 'Neuquén capital' },
  { zona: 'Santa Fe', lugares: 'Santa Fe capital' },
  { zona: 'Córdoba', lugares: 'Córdoba capital' },
  { zona: 'Tucumán', lugares: 'San Miguel de Tucumán' },
];
