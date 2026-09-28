// src/screens/Equipo.tsx
// Directorio del equipo: fichas públicas de profesionales, con filtros.
//
// Los datos vienen de la vista `fichas_publicas` de Supabase, que ya aplica la
// autorización de cada profesional (sin foto, sólo nombre, etc.). Acá no se decide
// qué es público: eso lo decide la base. Esta pantalla sólo muestra y filtra.
//
// El botón de cada ficha NO lleva al contacto del profesional: lleva al WhatsApp del
// equipo con el nombre en el mensaje, para respetar el circuito de admisión y derivación.

import { useEffect, useMemo, useState } from 'react';
import { Search, Laptop, MapPin, ChevronDown } from 'lucide-react';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';
import { BotonWhatsApp } from '../components/BotonWhatsApp';
import { leerFichasPublicas, supabaseConfigurado, type FichaPublica } from '../lib/supabase';
import { enlaceWhatsApp } from '../lib/whatsapp';

const POR_PAGINA = 12;

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; fichas: FichaPublica[] };

// Quita tildes y pasa a minúsculas, para que "psicologia" encuentre "Psicología".
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Valores únicos y ordenados de un campo, para armar los desplegables con lo que realmente hay.
function opciones(fichas: FichaPublica[], leer: (f: FichaPublica) => (string | null)[]): string[] {
  return [...new Set(fichas.flatMap(leer).filter((x): x is string => Boolean(x)))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );
}

export function Equipo() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [texto, setTexto] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [zona, setZona] = useState('');
  const [modalidad, setModalidad] = useState<'' | 'online' | 'presencial'>('');
  const [poblacion, setPoblacion] = useState('');
  const [visibles, setVisibles] = useState(POR_PAGINA);

  useEffect(() => {
    // AbortController: si la persona sale de la pantalla antes de que llegue la respuesta,
    // se cancela el pedido y no intentamos actualizar un componente que ya no existe.
    const control = new AbortController();
    leerFichasPublicas(control.signal)
      .then((fichas) => setEstado({ tipo: 'listo', fichas }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('No se pudieron leer las fichas:', error);
          setEstado({ tipo: 'error' });
        }
      });
    return () => control.abort();
  }, []);

  const fichas = estado.tipo === 'listo' ? estado.fichas : [];

  const filtradas = useMemo(() => {
    const busqueda = normalizar(texto.trim());
    return fichas.filter(
      (f) =>
        (!especialidad || f.especialidad === especialidad) &&
        (!zona || f.zona === zona) &&
        (!modalidad || f[modalidad]) &&
        (!poblacion || f.poblaciones.includes(poblacion)) &&
        (!busqueda ||
          normalizar([f.nombre_publico, f.especialidad, f.zona ?? "", ...f.tematicas, ...f.enfoques].join(' ')).includes(busqueda))
    );
  }, [fichas, texto, especialidad, zona, modalidad, poblacion]);

  // Al cambiar un filtro, volvemos a mostrar la primera página.
  useEffect(() => setVisibles(POR_PAGINA), [texto, especialidad, zona, modalidad, poblacion]);

  const hayFiltros = texto || especialidad || zona || modalidad || poblacion;

  return (
    <div className="space-y-6">
      <EncabezadoSeccion
        antetitulo="Nuestro equipo"
        titulo="Profesionales"
        bajada="Psicólogos y psiquiatras formados en terapias basadas en la evidencia. Si no sabés a quién elegir, escribinos: el equipo de admisión te ayuda a encontrar a la persona indicada."
      />

      {!supabaseConfigurado || estado.tipo === 'error' ? (
        <SinDatos />
      ) : estado.tipo === 'cargando' ? (
        <p className="text-tinta/60" aria-live="polite">Cargando el equipo…</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-hpc/10 p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="relative md:col-span-2">
              <span className="sr-only">Buscar por nombre, especialidad o temática</span>
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
              <input
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Nombre, especialidad o temática"
                className="w-full rounded-xl border border-hpc/15 bg-crema/40 py-2.5 pl-10 pr-3 text-sm"
              />
            </label>
            <Filtro etiqueta="Especialidad" valor={especialidad} cambiar={setEspecialidad}
              opciones={opciones(fichas, (f) => [f.especialidad])} />
            <Filtro etiqueta="Zona" valor={zona} cambiar={setZona} opciones={opciones(fichas, (f) => [f.zona])} />
            <Filtro etiqueta="Modalidad" valor={modalidad} cambiar={(v) => setModalidad(v as typeof modalidad)}
              opciones={['online', 'presencial']} nombres={{ online: 'Online', presencial: 'Presencial' }} />
            <Filtro etiqueta="Población" valor={poblacion} cambiar={setPoblacion}
              opciones={opciones(fichas, (f) => f.poblaciones)} />
          </div>

          <p className="text-sm text-tinta/60" aria-live="polite">
            {filtradas.length === 1 ? '1 profesional' : `${filtradas.length} profesionales`}
            {hayFiltros && (
              <button
                type="button"
                className="ml-3 font-semibold text-dorado underline underline-offset-4"
                onClick={() => {
                  setTexto(''); setEspecialidad(''); setZona(''); setModalidad(''); setPoblacion('');
                }}
              >
                Limpiar filtros
              </button>
            )}
          </p>

          {filtradas.length === 0 ? (
            <SinResultados />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
              {filtradas.slice(0, visibles).map((f) => (
                <TarjetaProfesional key={f.id} ficha={f} />
              ))}
            </div>
          )}

          {visibles < filtradas.length && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setVisibles((n) => n + POR_PAGINA)}
                className="rounded-xl border border-hpc/20 px-6 py-3 text-sm font-semibold text-hpc hover:bg-hpc-claro"
              >
                Ver más profesionales
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Piezas ----------

function Filtro({ etiqueta, valor, cambiar, opciones, nombres = {} }: {
  etiqueta: string; valor: string; cambiar: (v: string) => void; opciones: string[]; nombres?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="sr-only">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        className="w-full rounded-xl border border-hpc/15 bg-crema/40 px-3 py-2.5 text-sm"
      >
        <option value="">{etiqueta}: todas</option>
        {opciones.map((o) => (
          <option key={o} value={o}>{nombres[o] ?? o}</option>
        ))}
      </select>
    </label>
  );
}

// Iniciales para cuando no hay foto (o el profesional no autorizó mostrarla).
function iniciales(nombre: string) {
  const palabras = nombre.replace(/^(lic|dra?|mg|prof)\.?\s+/i, '').split(/\s+/).filter(Boolean);
  return (palabras[0]?.[0] ?? '') + (palabras[palabras.length - 1]?.[0] ?? '');
}

function TarjetaProfesional({ ficha }: { ficha: FichaPublica }) {
  const [fotoRota, setFotoRota] = useState(false);
  const f = ficha;
  const tieneDetalle = f.biografia || f.propuesta_valor || f.enfoques.length > 0 || f.frase;

  return (
    <article className="bg-white rounded-2xl border border-hpc/10 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {f.foto_url && !fotoRota ? (
          <img src={f.foto_url} alt="" loading="lazy" onError={() => setFotoRota(true)}
            className="w-16 h-16 rounded-full object-cover bg-hpc-claro" />
        ) : (
          <div aria-hidden="true"
            className="w-16 h-16 rounded-full bg-hpc-claro text-hpc font-display text-xl flex items-center justify-center uppercase">
            {iniciales(f.nombre_publico)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-hpc leading-tight">{f.nombre_publico}</h3>
          <p className="text-sm text-tinta/70">{f.especialidad}</p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-2 text-xs">
        {f.zona && (
          <li className="inline-flex items-center gap-1 rounded-full bg-crema px-2.5 py-1">
            <MapPin size={12} aria-hidden="true" /> {f.zona}
          </li>
        )}
        {f.online && (
          <li className="inline-flex items-center gap-1 rounded-full bg-crema px-2.5 py-1">
            <Laptop size={12} aria-hidden="true" /> Online
          </li>
        )}
        {f.presencial && <li className="rounded-full bg-crema px-2.5 py-1">Presencial</li>}
        {f.poblaciones.map((p) => (
          <li key={p} className="rounded-full bg-hpc-claro px-2.5 py-1 text-hpc">{p}</li>
        ))}
      </ul>

      {f.presentacion && <p className="text-sm leading-relaxed text-tinta/80">{f.presentacion}</p>}

      {f.tematicas.length > 0 && (
        <p className="text-sm text-tinta/70">
          <span className="font-semibold text-tinta">Temáticas: </span>
          {f.tematicas.slice(0, 6).join(' · ')}
          {f.tematicas.length > 6 && ` y ${f.tematicas.length - 6} más`}
        </p>
      )}

      {tieneDetalle && (
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-1 text-sm font-semibold text-dorado">
            Ver ficha completa
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-tinta/80">
            {f.enfoques.length > 0 && <p><span className="font-semibold text-tinta">Enfoques: </span>{f.enfoques.join(' · ')}</p>}
            {f.tematicas.length > 6 && <p><span className="font-semibold text-tinta">Todas las temáticas: </span>{f.tematicas.join(' · ')}</p>}
            {f.biografia && <p>{f.biografia}</p>}
            {f.propuesta_valor && <p className="italic">{f.propuesta_valor}</p>}
            {f.frase && <p className="rounded-xl bg-crema p-3">“{f.frase}”</p>}
            {f.idiomas.length > 1 && <p><span className="font-semibold text-tinta">Idiomas: </span>{f.idiomas.join(', ')}</p>}
          </div>
        </details>
      )}

      <a
        href={enlaceWhatsApp(`Hola, quisiera consultar por un turno con ${f.nombre_publico}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center rounded-xl bg-whatsapp px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
      >
        Consultar por un turno
      </a>
    </article>
  );
}

function SinResultados() {
  return (
    <div className="rounded-2xl border border-dashed border-hpc/25 p-6 text-center text-tinta/70">
      <p>No encontramos profesionales con esos filtros.</p>
      <p className="mt-1 text-sm">Escribinos y el equipo de admisión te ayuda a encontrar a alguien.</p>
      <div className="mt-4"><BotonWhatsApp motivo="terapia" texto="Consultar por WhatsApp" /></div>
    </div>
  );
}

function SinDatos() {
  return (
    <div className="rounded-2xl border border-dashed border-hpc/25 p-6 text-tinta/70">
      <p className="font-semibold text-hpc">Estamos actualizando las fichas del equipo.</p>
      <p className="mt-1 text-sm">Mientras tanto, escribinos y te ayudamos a encontrar al profesional indicado.</p>
      <div className="mt-4"><BotonWhatsApp motivo="terapia" texto="Consultar por WhatsApp" /></div>
    </div>
  );
}
