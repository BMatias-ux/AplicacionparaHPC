// src/components/PanelDerivar.tsx
// Pestaña "Derivar": directorio INTERNO del equipo para derivar pacientes.
//
// Quién la ve: administración, admisión y coordinación (roles de usuarios_roles).
// Qué muestra de cada profesional: agenda por día/franja con modalidad, tiempo de espera,
// población y edades, temáticas, casos que NO toma, contacto, matrícula y honorarios.
//
// Seguridad: todo lo autoriza la base con RLS. Las políticas "equipo lee ..." (función
// es_equipo()) dejan leer fichas, datos privados y horarios sólo a esos roles. Si alguien
// sin rol abriera esta pantalla, la base le devolvería listas vacías.
//
// Es de sólo lectura: cada profesional mantiene su información desde "Mi ficha", así que
// lo que se ve acá está siempre al día.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search, Loader2, AlertCircle, Phone, Mail, Clock, MapPin, Laptop, ChevronDown, TriangleAlert } from 'lucide-react';
import { obtenerCliente, mensajeDeError, type ItemCatalogo, type Modalidad } from '../lib/cliente';

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTOS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Franjas para el filtro "turno": se cruzan con los horarios de cada profesional.
const TURNOS = {
  manana: { texto: 'Mañana (antes de 12)', desde: '00:00', hasta: '12:00' },
  tarde: { texto: 'Tarde (12 a 18)', desde: '12:00', hasta: '18:00' },
  noche: { texto: 'Noche (después de 18)', desde: '18:00', hasta: '24:00' },
} as const;
type Turno = keyof typeof TURNOS;

interface HorarioDerivar {
  profesional_id: string;
  dia: number;
  desde: string;
  hasta: string;
  modalidad: Modalidad;
  sede: string | null;
}

interface Privado {
  profesional_id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  matricula_nacional: string | null;
  matricula_provincial: string | null;
  localidad: string | null;
  direccion: string | null;
  tiempo_espera: string | null;
  cupos_texto: string | null;
  cupos_nuevos_mes: string | null;
  admision_urgente: string | null;
  deriva_a: string | null;
  otras_exclusiones: string | null;
  honorarios: string | null;
  formas_pago: string | null;
}

// Una fila por profesional, con todo lo necesario ya cruzado.
interface Profesional {
  id: string;
  nombre: string;
  especialidad: string;
  zonaId: string | null;
  zona: string;
  online: boolean;
  presencial: boolean;
  edadMinima: number | null;
  edadMaxima: number | null;
  idiomas: string[];
  actualizado: string;
  enEquipo: boolean; // tiene acceso habilitado al portal (equipo confirmado)
  privado: Privado | null;
  horarios: HorarioDerivar[];
  poblaciones: string[]; // ids
  tematicas: number[]; // ids
  exclusiones: number[]; // ids
}

interface Catalogos {
  zonas: ItemCatalogo[];
  poblaciones: ItemCatalogo[];
  tematicas: ItemCatalogo[];
  exclusiones: ItemCatalogo[];
}

// Arma el número para wa.me: sólo dígitos, con código de país. Los celulares argentinos
// cargados sin prefijo (ej.: 1158142817) necesitan "549" adelante para que WhatsApp los encuentre.
function enlaceWhatsApp(telefono: string | null | undefined): string {
  let d = (telefono ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) d = d.slice(1); // 011... -> 11...
  if (d.startsWith('54')) return d.startsWith('549') ? d : `549${d.slice(2)}`;
  return `549${d}`;
}

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const hora = (t: string) => t.slice(0, 5);
// Agrupa filas "relación" (profesional_id, x_id) en un mapa profesional -> lista de ids.
function agrupar<T extends { profesional_id: string }>(filas: T[] | null, campo: keyof T) {
  const mapa = new Map<string, (string | number)[]>();
  for (const f of filas ?? []) {
    const lista = mapa.get(f.profesional_id) ?? [];
    lista.push(f[campo] as string | number);
    mapa.set(f.profesional_id, lista);
  }
  return mapa;
}

export function PanelDerivar() {
  const cliente = obtenerCliente()!;
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos>({ zonas: [], poblaciones: [], tematicas: [], exclusiones: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [texto, setTexto] = useState('');
  const [zona, setZona] = useState('');
  const [modalidad, setModalidad] = useState<'' | Modalidad>('');
  const [poblacion, setPoblacion] = useState('');
  const [edad, setEdad] = useState('');
  const [tematica, setTematica] = useState('');
  const [exclusion, setExclusion] = useState('');
  const [dia, setDia] = useState('');
  const [turno, setTurno] = useState<'' | Turno>('');
  const [incluirFuera, setIncluirFuera] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);

  // ---------- Carga: todo en paralelo y se cruza en el navegador ----------
  useEffect(() => {
    (async () => {
      try {
        const r = await Promise.all([
          cliente.from('profesionales').select('id, nombre_publico, zona_id, online, presencial, edad_minima, edad_maxima, idiomas, activo, actualizado, especialidades(nombre)'),
          cliente.from('profesionales_privado').select('profesional_id, nombre_completo, email, telefono, matricula_nacional, matricula_provincial, localidad, direccion, tiempo_espera, cupos_texto, cupos_nuevos_mes, admision_urgente, deriva_a, otras_exclusiones, honorarios, formas_pago'),
          cliente.from('profesional_horarios').select('profesional_id, dia, desde, hasta, modalidad, sede').order('dia').order('desde'),
          cliente.from('profesional_poblacion').select('profesional_id, poblacion_id'),
          cliente.from('profesional_tematica').select('profesional_id, tematica_id'),
          cliente.from('profesional_exclusion').select('profesional_id, exclusion_id'),
          cliente.from('accesos_profesionales').select('profesional_id, habilitado, es_admin'),
          cliente.from('zonas').select('id, nombre').order('orden'),
          cliente.from('poblaciones').select('id, nombre').order('orden'),
          cliente.from('tematicas').select('id, nombre').order('nombre'),
          cliente.from('exclusiones').select('id, nombre').order('nombre'),
        ]);
        const primerError = r.find((x) => x.error)?.error;
        if (primerError) throw primerError;
        const [prof, priv, hor, pob, tem, exc, acc, zon, catPob, catTem, catExc] = r.map((x) => x.data ?? []);

        const zonas = zon as ItemCatalogo[];
        const privados = new Map((priv as Privado[]).map((p) => [p.profesional_id, p]));
        const horarios = new Map<string, HorarioDerivar[]>();
        for (const h of hor as HorarioDerivar[]) {
          horarios.set(h.profesional_id, [...(horarios.get(h.profesional_id) ?? []), { ...h, desde: hora(h.desde), hasta: hora(h.hasta) }]);
        }
        const poblaciones = agrupar(pob as { profesional_id: string; poblacion_id: string }[], 'poblacion_id');
        const tematicas = agrupar(tem as { profesional_id: string; tematica_id: number }[], 'tematica_id');
        const exclusiones = agrupar(exc as { profesional_id: string; exclusion_id: number }[], 'exclusion_id');
        // Equipo = acceso habilitado y no es cuenta de administración (las Lauras, Matías).
        const accesos = acc as { profesional_id: string | null; habilitado: boolean; es_admin: boolean }[];
        const delEquipo = new Set(accesos.filter((a) => a.profesional_id && a.habilitado && !a.es_admin).map((a) => a.profesional_id!));
        const deAdmin = new Set(accesos.filter((a) => a.profesional_id && a.es_admin).map((a) => a.profesional_id!));

        type FilaProf = { id: string; nombre_publico: string; zona_id: string | null; online: boolean; presencial: boolean; edad_minima: number | null; edad_maxima: number | null; idiomas: string[] | null; activo: boolean; actualizado: string; especialidades: { nombre: string } | null };
        const lista: Profesional[] = (prof as unknown as FilaProf[])
          .filter((p) => !deAdmin.has(p.id)) // las cuentas de administración no se derivan
          .map((p) => ({
            id: p.id,
            nombre: p.nombre_publico,
            especialidad: p.especialidades?.nombre ?? '—',
            zonaId: p.zona_id,
            zona: zonas.find((z) => z.id === p.zona_id)?.nombre ?? 'Sin zona / online',
            online: p.online,
            presencial: p.presencial,
            edadMinima: p.edad_minima,
            edadMaxima: p.edad_maxima,
            idiomas: p.idiomas ?? [],
            actualizado: p.actualizado,
            enEquipo: delEquipo.has(p.id),
            privado: privados.get(p.id) ?? null,
            horarios: horarios.get(p.id) ?? [],
            poblaciones: (poblaciones.get(p.id) ?? []) as string[],
            tematicas: (tematicas.get(p.id) ?? []) as number[],
            exclusiones: (exclusiones.get(p.id) ?? []) as number[],
          }));
        // Primero los que tienen agenda cargada, después por nombre.
        lista.sort((a, b) => Number(b.horarios.length > 0) - Number(a.horarios.length > 0) || a.nombre.localeCompare(b.nombre, 'es'));

        setProfesionales(lista);
        setCatalogos({
          zonas,
          poblaciones: catPob as ItemCatalogo[],
          tematicas: (catTem as ItemCatalogo[]).filter((t) => t.nombre !== '—'),
          exclusiones: (catExc as ItemCatalogo[]).filter((t) => t.nombre !== '—'),
        });
      } catch (err) {
        console.error(err);
        setError(mensajeDeError(err));
      } finally {
        setCargando(false);
      }
    })();
  }, [cliente]);

  const nombreDe = (catalogo: ItemCatalogo[], id: string | number) => catalogo.find((c) => String(c.id) === String(id))?.nombre ?? '';

  // ---------- Filtros ----------
  const filtrados = useMemo(() => {
    const q = normalizar(texto.trim());
    const edadNum = edad ? Number(edad) : null;
    return profesionales.filter((p) => {
      if (!incluirFuera && !p.enEquipo) return false;
      if (zona && p.zonaId !== zona) return false;
      if (modalidad === 'online' && !p.online) return false;
      if (modalidad === 'presencial' && !p.presencial) return false;
      if (poblacion && !p.poblaciones.includes(poblacion)) return false;
      if (edadNum !== null) {
        if (p.edadMinima !== null && edadNum < p.edadMinima) return false;
        if (p.edadMaxima !== null && edadNum > p.edadMaxima) return false;
      }
      if (tematica && !p.tematicas.includes(Number(tematica))) return false;
      if (exclusion && p.exclusiones.includes(Number(exclusion))) return false; // NO toma ese caso
      if (dia || turno) {
        const franja = turno ? TURNOS[turno] : null;
        const sirve = p.horarios.some(
          (h) =>
            (!dia || h.dia === Number(dia)) &&
            (!modalidad || h.modalidad === modalidad) &&
            (!franja || (h.desde < franja.hasta && h.hasta > franja.desde)), // se superponen
        );
        if (!sirve) return false;
      }
      if (q) {
        const enTexto = [p.nombre, p.especialidad, p.zona, ...p.tematicas.map((t) => nombreDe(catalogos.tematicas, t))].map(normalizar).join(' ');
        if (!enTexto.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionales, texto, zona, modalidad, poblacion, edad, tematica, exclusion, dia, turno, incluirFuera, catalogos]);

  const hayFiltros = Boolean(texto || zona || modalidad || poblacion || edad || tematica || exclusion || dia || turno);
  const limpiar = () => {
    setTexto(''); setZona(''); setModalidad(''); setPoblacion(''); setEdad('');
    setTematica(''); setExclusion(''); setDia(''); setTurno('');
  };

  if (cargando) {
    return (
      <p className="flex items-center gap-2 text-tinta/60">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Cargando el equipo…
      </p>
    );
  }
  if (error) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
        <AlertCircle size={18} aria-hidden="true" /> {error}
      </p>
    );
  }

  const claseCampo = 'mt-1 block w-full rounded-lg border border-hpc/20 bg-white px-3 py-2.5 text-[15px] focus:border-hpc focus:outline-none focus:ring-2 focus:ring-hpc/20';

  return (
    <div className="space-y-6">
      {/* ---------- Filtros ---------- */}
      <section className="bg-white rounded-2xl border border-hpc/10 p-5 md:p-7 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-hpc">Buscar profesional para derivar</h2>
          <p className="text-sm text-tinta/65">
            Completá lo que sepas del paciente. La lista se ajusta sola. Uso interno: no compartas estos datos fuera del equipo.
          </p>
        </div>

        <label className="relative block">
          <span className="sr-only">Buscar por nombre o temática</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Nombre o temática (ej.: ansiedad, duelo, TCA)"
            className="w-full rounded-lg border border-hpc/20 bg-white pl-9 pr-3 py-2.5 text-[15px] focus:border-hpc focus:outline-none focus:ring-2 focus:ring-hpc/20"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium">Zona</span>
            <select value={zona} onChange={(e) => setZona(e.target.value)} className={claseCampo}>
              <option value="">Todas</option>
              {catalogos.zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Modalidad</span>
            <select value={modalidad} onChange={(e) => setModalidad(e.target.value as '' | Modalidad)} className={claseCampo}>
              <option value="">Cualquiera</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Población</span>
            <select value={poblacion} onChange={(e) => setPoblacion(e.target.value)} className={claseCampo}>
              <option value="">Cualquiera</option>
              {catalogos.poblaciones.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Edad del paciente</span>
            <input type="number" min={0} max={120} inputMode="numeric" value={edad} onChange={(e) => setEdad(e.target.value)} placeholder="Ej.: 16" className={claseCampo} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Temática</span>
            <select value={tematica} onChange={(e) => setTematica(e.target.value)} className={claseCampo}>
              <option value="">Cualquiera</option>
              {catalogos.tematicas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Que SÍ tome casos de…</span>
            <select value={exclusion} onChange={(e) => setExclusion(e.target.value)} className={claseCampo}>
              <option value="">Sin restricción</option>
              {catalogos.exclusiones.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Día</span>
            <select value={dia} onChange={(e) => setDia(e.target.value)} className={claseCampo}>
              <option value="">Cualquiera</option>
              {DIAS.slice(1).map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Turno</span>
            <select value={turno} onChange={(e) => setTurno(e.target.value as '' | Turno)} className={claseCampo}>
              <option value="">Cualquiera</option>
              {(Object.keys(TURNOS) as Turno[]).map((t) => <option key={t} value={t}>{TURNOS[t].texto}</option>)}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex items-center gap-2 text-sm text-tinta/75">
            <input type="checkbox" checked={incluirFuera} onChange={(e) => setIncluirFuera(e.target.checked)} className="h-4 w-4 accent-hpc" />
            Incluir profesionales cargados que todavía no son parte del equipo
          </label>
          {hayFiltros && (
            <button type="button" onClick={limpiar} className="text-sm text-hpc underline underline-offset-4">Limpiar filtros</button>
          )}
        </div>
      </section>

      {/* ---------- Resultados ---------- */}
      <p className="text-sm text-tinta/65">
        {filtrados.length === 1 ? '1 profesional' : `${filtrados.length} profesionales`} {hayFiltros ? 'coinciden' : 'en el equipo'}
        {(dia || turno) && ' (según la agenda que cargó cada uno)'}
      </p>

      <ul className="space-y-3">
        {filtrados.map((p) => (
          <TarjetaProfesional
            key={p.id}
            p={p}
            catalogos={catalogos}
            abierta={abierto === p.id}
            onAlternar={() => setAbierto(abierto === p.id ? null : p.id)}
          />
        ))}
        {filtrados.length === 0 && (
          <li className="rounded-2xl border border-dashed border-hpc/20 p-6 text-sm text-tinta/60">
            Nadie coincide con todos los filtros. Probá sacando alguno (por ejemplo el día o el turno).
          </li>
        )}
      </ul>
    </div>
  );
}

// ---------- Tarjeta de cada profesional ----------

function TarjetaProfesional({ p, catalogos, abierta, onAlternar }: { p: Profesional; catalogos: Catalogos; abierta: boolean; onAlternar: () => void }) {
  const nombres = (catalogo: ItemCatalogo[], ids: (string | number)[]) =>
    ids.map((id) => catalogo.find((c) => String(c.id) === String(id))?.nombre).filter((x): x is string => Boolean(x));
  const pv = p.privado;
  const telefono = enlaceWhatsApp(pv?.telefono);
  const noToma = nombres(catalogos.exclusiones, p.exclusiones);
  const edades =
    p.edadMinima !== null || p.edadMaxima !== null
      ? `${p.edadMinima ?? 0} a ${p.edadMaxima !== null ? `${p.edadMaxima} años` : 'sin tope'}`
      : null;

  return (
    <li className="bg-white rounded-2xl border border-hpc/10">
      <button type="button" onClick={onAlternar} aria-expanded={abierta} className="w-full text-left p-5 md:p-6 flex gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-lg font-semibold text-hpc">{p.nombre}</p>
            <p className="text-sm text-tinta/60">{p.especialidad}</p>
            {!p.enEquipo && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">Fuera del equipo</span>}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Chip><MapPin size={14} aria-hidden="true" /> {p.zona}</Chip>
            {p.online && <Chip><Laptop size={14} aria-hidden="true" /> Online</Chip>}
            {p.presencial && <Chip>Presencial</Chip>}
            {pv?.tiempo_espera && <Chip><Clock size={14} aria-hidden="true" /> Espera: {pv.tiempo_espera}</Chip>}
          </div>
          {/* Agenda resumida: es lo primero que se mira para derivar. */}
          {p.horarios.length ? (
            <p className="text-sm text-tinta/75">
              {p.horarios.map((h) => `${DIAS_CORTOS[h.dia]} ${h.desde}–${h.hasta} (${h.modalidad === 'online' ? 'online' : 'presencial'})`).join(' · ')}
            </p>
          ) : (
            <div className="space-y-0.5 text-sm">
              {/* Sin agenda en el portal: mostramos lo que declaró en el formulario de inscripción. */}
              {pv?.cupos_texto && <p className="text-tinta/75">Disponibilidad (formulario): {pv.cupos_texto}</p>}
              <p className="flex items-center gap-1.5 text-amber-800">
                <TriangleAlert size={14} aria-hidden="true" /> Todavía no cargó su agenda en el portal
              </p>
            </div>
          )}
        </div>
        <ChevronDown size={20} className={`mt-1 shrink-0 text-hpc transition-transform ${abierta ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {abierta && (
        <div className="border-t border-hpc/10 p-5 md:p-6 grid gap-5 md:grid-cols-2 text-sm">
          <Dato titulo="Contacto">
            {pv?.nombre_completo && <p>{pv.nombre_completo}</p>}
            {telefono && (
              <p className="flex items-center gap-1.5">
                <Phone size={14} aria-hidden="true" />
                <a href={`https://wa.me/${telefono}`} title="Abrir en WhatsApp" target="_blank" rel="noreferrer" className="text-hpc underline underline-offset-4">{pv?.telefono}</a>
              </p>
            )}
            {pv?.email && (
              <p className="flex items-center gap-1.5 break-all">
                <Mail size={14} aria-hidden="true" />
                <a href={`mailto:${pv.email}`} className="text-hpc underline underline-offset-4">{pv.email}</a>
              </p>
            )}
            {(pv?.matricula_nacional || pv?.matricula_provincial) && (
              <p>Matrícula: {[pv?.matricula_nacional && `MN ${pv.matricula_nacional}`, pv?.matricula_provincial && `MP ${pv.matricula_provincial}`].filter(Boolean).join(' · ')}</p>
            )}
            {(pv?.localidad || pv?.direccion) && <p>Consultorio: {[pv?.direccion, pv?.localidad].filter(Boolean).join(', ')}</p>}
            {!pv && <p className="text-tinta/55">Sin datos de contacto cargados.</p>}
          </Dato>

          <Dato titulo="Agenda">
            {p.horarios.length ? (
              <ul className="space-y-0.5">
                {p.horarios.map((h, i) => (
                  <li key={i}>
                    {DIAS[h.dia]} {h.desde} a {h.hasta} · {h.modalidad === 'online' ? 'Online' : `Presencial${h.sede ? ` (${h.sede})` : ''}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-tinta/55">Sin agenda cargada.</p>
            )}
            {pv?.cupos_texto && <p className="mt-2">Cupos: {pv.cupos_texto}</p>}
            {pv?.cupos_nuevos_mes && <p>Pacientes nuevos por mes: {pv.cupos_nuevos_mes}</p>}
            {pv?.admision_urgente && <p>Admisión urgente: {pv.admision_urgente}</p>}
          </Dato>

          <Dato titulo="A quién atiende">
            <p>{nombres(catalogos.poblaciones, p.poblaciones).join(' · ') || 'Sin datos'}</p>
            {edades && <p>Edades: {edades}</p>}
            {p.idiomas.length > 0 && <p>Idiomas: {p.idiomas.join(', ')}</p>}
          </Dato>

          <Dato titulo="Casos que NO toma">
            {noToma.length || pv?.otras_exclusiones ? (
              <>
                {noToma.length > 0 && <p>{noToma.join(' · ')}</p>}
                {pv?.otras_exclusiones && <p>{pv.otras_exclusiones}</p>}
              </>
            ) : (
              <p className="text-tinta/55">No indicó restricciones.</p>
            )}
            {pv?.deriva_a && <p className="mt-1">Suele derivar a: {pv.deriva_a}</p>}
          </Dato>

          <Dato titulo="Temáticas" className="md:col-span-2">
            <p>{nombres(catalogos.tematicas, p.tematicas).join(' · ') || 'Sin datos'}</p>
          </Dato>

          {(pv?.honorarios || pv?.formas_pago) && (
            <Dato titulo="Honorarios y pago" className="md:col-span-2">
              {pv?.honorarios && <p>{pv.honorarios}</p>}
              {pv?.formas_pago && <p>{pv.formas_pago}</p>}
            </Dato>
          )}

          <p className="md:col-span-2 text-xs text-tinta/50">
            Ficha actualizada el {new Date(p.actualizado).toLocaleDateString('es-AR')}. Cada profesional la mantiene desde «Mi ficha».
          </p>
        </div>
      )}
    </li>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-hpc-claro px-2.5 py-1 text-hpc">{children}</span>;
}

function Dato({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-hpc/70">{titulo}</p>
      {children}
    </div>
  );
}
