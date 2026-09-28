// scripts/importar-fichas.mjs
// Convierte las respuestas de la planilla "HPC · Fichas Profesionales 2026" en un
// archivo SQL listo para pegar en Supabase (SQL Editor).
//
// ¿Por qué generar SQL en vez de escribir directo en Supabase?
//   1. Podés LEER lo que se va a cargar antes de cargarlo.
//   2. No hace falta guardar la clave de servicio de Supabase en tu PC.
//   3. Si algo sale mal, se vuelve a correr: el SQL borra e inserta dentro de una transacción.
//
// Uso (PowerShell, desde la carpeta del proyecto):
//   1. En la planilla: pestaña "Respuestas" → Archivo → Descargar → CSV.
//   2. Guardar el archivo como  datos\fichas.csv   (la carpeta datos\ está en .gitignore)
//   3. node scripts/importar-fichas.mjs datos/fichas.csv
//      -> muestra un resumen SIN datos personales y escribe datos/importacion.sql
//   4. Abrir datos/importacion.sql, revisarlo y pegarlo en Supabase → SQL Editor → Run.
//
// Qué NO importa, a propósito:
//   - "Pacientes actuales": son nombres de pacientes. No tienen que estar en esta base.
//   - "Otras temáticas" / "Otros enfoques": texto libre; se revisa a mano y se agrega al catálogo.
//   - La foto: el enlace de Drive se guarda en profesionales_privado.foto_origen; la foto
//     se sube a Supabase Storage en la Fase 3 (un enlace de Drive no sirve como imagen web).
//
// Cada envío del formulario es una fila nueva: si alguien lo mandó dos veces, se toma
// el MÁS RECIENTE por correo electrónico.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

// ---------- CSV ----------
// Lector de CSV mínimo (RFC 4180): soporta comillas, comas y saltos de línea dentro de
// una celda, que es justo lo que tienen las respuestas largas del formulario.
function leerCsv(texto) {
  const filas = [];
  let fila = [];
  let celda = '';
  let entreComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') entreComillas = false;
      else celda += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ',') { fila.push(celda); celda = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(celda); filas.push(fila); fila = []; celda = '';
    } else celda += c;
  }
  if (celda || fila.length) { fila.push(celda); filas.push(fila); }
  return filas;
}

// ---------- Normalización ----------
const limpiar = (v) => (v ?? '').replace(/\s+/g, ' ').trim();
const lista = (v) => limpiar(v).split(' · ').map((x) => x.trim()).filter(Boolean);
// Quita el paréntesis final: "TCC (Terapia Cognitivo Conductual)" queda igual (es parte del nombre),
// pero "Adultez joven (18-35)" -> "Adultez joven" para mapear la población.
const sinRango = (v) => v.replace(/\s*\([\d+\-\s]+\)\s*$/, '').trim();

const ZONAS = {
  'caba': 'caba', 'norte bs. as.': 'ba_norte', 'oeste bs. as.': 'ba_oeste', 'sur bs. as.': 'ba_sur',
  'salta': 'salta', 'tucumán': 'tucuman', 'tucuman': 'tucuman', 'neuquén': 'neuquen', 'neuquen': 'neuquen',
  'santa fe': 'santa_fe', 'córdoba': 'cordoba', 'cordoba': 'cordoba',
};
const POBLACIONES = {
  'niñez': 'ninez', 'adolescencia': 'adolescencia', 'adultez joven': 'adultez_joven', 'adultez': 'adultez',
  'adultos mayores': 'adultos_mayores', 'parejas': 'parejas', 'familias': 'familias',
};

function especialidad(rol) {
  const r = limpiar(rol).toLowerCase();
  if (r.includes('psiquiatr')) return 'psiquiatria';
  if (r.includes('nutri')) return 'nutricion';
  return 'psicologia';
}

function autorizacion(texto) {
  const t = limpiar(texto).toLowerCase();
  if (t.startsWith('sí, perfil completo') || t.startsWith('si, perfil completo')) return 'completo';
  if (t.includes('sin foto')) return 'sin_foto';
  if (t.includes('solo nombre')) return 'solo_nombre';
  return 'no_publicar'; // sin respuesta o "No publicar": por defecto, no se publica
}

function edad(v) {
  const n = parseInt(limpiar(v), 10);
  return Number.isInteger(n) && n >= 0 && n <= 120 ? n : null; // "SIN TOPE" -> null
}

// Año de 4 cifras razonable, o null.
function anio(v) {
  const n = parseInt(limpiar(v), 10);
  return Number.isInteger(n) && n >= 1950 && n <= 2100 ? n : 'null';
}

// ---------- SQL ----------
const sql = (v) => (v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const sqlArr = (arr) => (arr.length ? `array[${arr.map(sql).join(',')}]` : `'{}'::text[]`);

// ---------- Programa ----------
const archivo = process.argv[2];
if (!archivo) {
  console.error('Uso: node scripts/importar-fichas.mjs datos/fichas.csv');
  process.exit(1);
}

const [encabezados, ...filas] = leerCsv(readFileSync(archivo, 'utf8').replace(/^﻿/, ''));
const col = (nombre) => {
  const i = encabezados.findIndex((h) => limpiar(h).toLowerCase() === nombre.toLowerCase());
  if (i === -1) throw new Error(`No encuentro la columna "${nombre}" en el CSV. ¿Es la pestaña "Respuestas"?`);
  return i;
};
const C = Object.fromEntries(
  [
    'Nombre y apellido', 'Nombre para publicación', 'Correo electrónico', 'Teléfono / WhatsApp', 'Zona / sede',
    'Rol en la Fundación', 'Título de grado', 'Universidad', 'Año de egreso', 'Matrícula nacional',
    'Matrícula provincial', 'Seguro mala praxis', 'Posgrados y certificaciones', 'Formaciones HPC', 'Idiomas',
    'Enfoques', 'Población', 'Edad mínima', 'Edad máxima', 'Temáticas que aborda', 'Áreas destacadas',
    'NO aborda', 'Otras exclusiones', 'Deriva a', 'Modalidad', 'CUPOS DISPONIBLES', 'Cupos nuevos por mes',
    'Tiempo de espera 1ª consulta', 'Admisión urgente', 'Dirección', 'Localidad', 'Provincia',
    'Autoriza publicar dirección', 'Presentación breve', 'Biografía extendida', 'Propuesta de valor', 'Frase',
    'Foto (URL)', 'Autoriza publicación', 'Honorarios', 'Formas de pago', 'Facturación', 'Fecha de envío',
  ].map((n) => [n, col(n)])
);
const v = (fila, n) => limpiar(fila[C[n]]);

// Una ficha por correo (o por nombre si no dejó correo): gana la última fila.
const porPersona = new Map();
filas.forEach((fila, i) => {
  const nombre = v(fila, 'Nombre y apellido');
  if (!nombre) return; // filas vacías (la primera de prueba, por ejemplo)
  const clave = (v(fila, 'Correo electrónico') || nombre).toLowerCase();
  porPersona.set(clave, { fila, numero: i + 2 }); // +2: encabezado y base 1, como en Sheets
});

const tematicas = new Set();
const enfoques = new Set();
const exclusiones = new Set();
const avisos = [];
const bloques = [];
const resumen = { total: 0, completo: 0, sin_foto: 0, solo_nombre: 0, no_publicar: 0, zonas: {} };

for (const { fila, numero } of porPersona.values()) {
  const id = randomUUID();
  const zonaTexto = v(fila, 'Zona / sede').toLowerCase();
  const zona = ZONAS[zonaTexto] ?? null;
  if (!zona) avisos.push(`Fila ${numero}: zona "${v(fila, 'Zona / sede')}" no reconocida (queda sin zona)`);
  const modalidad = v(fila, 'Modalidad').toLowerCase();
  const aut = autorizacion(v(fila, 'Autoriza publicación'));
  const tems = lista(v(fila, 'Temáticas que aborda'));
  const enfs = lista(v(fila, 'Enfoques'));
  const excl = lista(v(fila, 'NO aborda'));
  const pobs = lista(v(fila, 'Población'))
    .map((p) => POBLACIONES[sinRango(p).toLowerCase()])
    .filter(Boolean);
  tems.forEach((t) => tematicas.add(t));
  enfs.forEach((e) => enfoques.add(e));
  excl.forEach((e) => exclusiones.add(e));

  resumen.total++;
  resumen[aut]++;
  resumen.zonas[zona ?? 'sin zona'] = (resumen.zonas[zona ?? 'sin zona'] ?? 0) + 1;

  const autorizaDireccion = v(fila, 'Autoriza publicar dirección').toLowerCase().startsWith('sí');

  bloques.push(`
-- Fila ${numero}
insert into profesionales (id, nombre_publico, especialidad_id, zona_id, presentacion, biografia, propuesta_valor, frase,
  online, presencial, edad_minima, edad_maxima, idiomas, areas_destacadas, autorizacion)
values (${sql(id)}, ${sql(v(fila, 'Nombre para publicación') || v(fila, 'Nombre y apellido'))}, ${sql(especialidad(v(fila, 'Rol en la Fundación')))},
  ${sql(zona)}, ${sql(v(fila, 'Presentación breve'))}, ${sql(v(fila, 'Biografía extendida'))}, ${sql(v(fila, 'Propuesta de valor'))},
  ${sql(v(fila, 'Frase'))}, ${modalidad.includes('online')}, ${modalidad.includes('presencial')},
  ${edad(v(fila, 'Edad mínima')) ?? 'null'}, ${edad(v(fila, 'Edad máxima')) ?? 'null'}, ${sqlArr(lista(v(fila, 'Idiomas')))},
  ${sql(v(fila, 'Áreas destacadas'))}, ${sql(aut)});
insert into profesionales_privado (profesional_id, nombre_completo, email, telefono, matricula_nacional, matricula_provincial,
  titulo, universidad, anio_egreso, seguro_mala_praxis, posgrados, formaciones_hpc, direccion, localidad, provincia,
  autoriza_direccion, cupos_texto, cupos_nuevos_mes, tiempo_espera, admision_urgente, deriva_a, otras_exclusiones,
  honorarios, formas_pago, facturacion, foto_origen, fila_origen)
values (${sql(id)}, ${sql(v(fila, 'Nombre y apellido'))}, ${sql(v(fila, 'Correo electrónico'))}, ${sql(v(fila, 'Teléfono / WhatsApp'))},
  ${sql(v(fila, 'Matrícula nacional'))}, ${sql(v(fila, 'Matrícula provincial'))}, ${sql(v(fila, 'Título de grado'))},
  ${sql(v(fila, 'Universidad'))}, ${anio(v(fila, 'Año de egreso'))},
  ${sql(v(fila, 'Seguro mala praxis'))}, ${sql(v(fila, 'Posgrados y certificaciones'))}, ${sql(v(fila, 'Formaciones HPC'))},
  ${sql(v(fila, 'Dirección'))}, ${sql(v(fila, 'Localidad'))}, ${sql(v(fila, 'Provincia'))}, ${autorizaDireccion},
  ${sql(v(fila, 'CUPOS DISPONIBLES'))}, ${sql(v(fila, 'Cupos nuevos por mes'))}, ${sql(v(fila, 'Tiempo de espera 1ª consulta'))},
  ${sql(v(fila, 'Admisión urgente'))}, ${sql(v(fila, 'Deriva a'))}, ${sql(v(fila, 'Otras exclusiones'))},
  ${sql(v(fila, 'Honorarios'))}, ${sql(v(fila, 'Formas de pago'))}, ${sql(v(fila, 'Facturación'))}, ${sql(v(fila, 'Foto (URL)'))}, ${numero});
${tems.map((t) => `insert into profesional_tematica select ${sql(id)}, id from tematicas where nombre = ${sql(t)};`).join('\n')}
${enfs.map((e) => `insert into profesional_enfoque select ${sql(id)}, id from enfoques where nombre = ${sql(e)};`).join('\n')}
${excl.map((e) => `insert into profesional_exclusion select ${sql(id)}, id from exclusiones where nombre = ${sql(e)};`).join('\n')}
${pobs.map((p) => `insert into profesional_poblacion values (${sql(id)}, ${sql(p)});`).join('\n')}`);
}

const salida = `-- Generado por scripts/importar-fichas.mjs el ${new Date().toISOString()}
-- Origen: ${archivo} · ${resumen.total} profesionales
-- CONTIENE DATOS PERSONALES: no subir a GitHub ni compartir.
begin;

-- Se reemplaza lo importado antes desde la planilla (no toca fichas cargadas a mano).
delete from profesionales where id in (select profesional_id from profesionales_privado where origen = 'ficha_2026');

insert into tematicas (nombre) values ${[...tematicas].sort().map((t) => `(${sql(t)})`).join(', ') || "('—')"} on conflict (nombre) do nothing;
insert into enfoques (nombre) values ${[...enfoques].sort().map((t) => `(${sql(t)})`).join(', ') || "('—')"} on conflict (nombre) do nothing;
insert into exclusiones (nombre) values ${[...exclusiones].sort().map((t) => `(${sql(t)})`).join(', ') || "('—')"} on conflict (nombre) do nothing;
${bloques.join('\n')}

commit;
`;

const destino = 'datos/importacion.sql';
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, salida);

// Resumen sin nombres ni contactos: se puede pegar en la bitácora tranquilo.
console.log(`Profesionales: ${resumen.total} (filas únicas por correo)`);
console.log(`  Perfil completo: ${resumen.completo} · Sin foto: ${resumen.sin_foto} · Solo nombre: ${resumen.solo_nombre} · No publicar: ${resumen.no_publicar}`);
console.log(`  Por zona: ${Object.entries(resumen.zonas).map(([z, n]) => `${z} ${n}`).join(' · ')}`);
console.log(`Catálogos: ${tematicas.size} temáticas · ${enfoques.size} enfoques · ${exclusiones.size} exclusiones`);
avisos.forEach((a) => console.log('⚠', a));
console.log(`\nListo: ${destino}. Revisalo y pegalo en Supabase → SQL Editor.`);
