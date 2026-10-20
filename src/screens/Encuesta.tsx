// src/screens/Encuesta.tsx
// Encuesta de satisfacción de las formaciones anuales, respondida por los alumnos SIN cuenta.
//
// Dos formas de llegar:
//   - Enlace de una clase:  portal.habilidadesparaelcambio.com.ar/#encuesta?c=CODIGO
//     (lo copia coordinación desde el panel Docentes). Ya trae formación, fecha y docente.
//   - Enlace general:       portal.habilidadesparaelcambio.com.ar/#encuesta
//     El alumno elige su formación y la clase de las últimas semanas.
//
// Por qué así y no con el nombre del docente escrito a mano (como la encuesta del sitio .org):
// "Lic. Pérez", "Perez" y "la profe de Trauma" son tres docentes distintos para una planilla.
// Con el código, cada respuesta queda atada a la clase y al docente correctos.
//
// Anónima: no se pide nombre ni correo, y la base guarda sólo la fecha (sin hora).
// Las mismas preguntas y escalas que la encuesta anterior, para poder comparar.

import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, Send } from 'lucide-react';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';
import { textoTurno, fechaCorta, type ClaseEncuesta, type Formacion } from '../lib/docentes';

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

async function rpc<T>(funcion: string, cuerpo: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${URL_BASE}/rest/v1/rpc/${funcion}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY!, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(await r.text());
  const texto = await r.text();
  return (texto ? JSON.parse(texto) : null) as T;
}

function codigoDelHash(): string | null {
  const consulta = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(consulta).get('c');
}

// Recordar en este navegador qué clases ya se respondieron (sólo para avisar; no es un control).
function yaRespondida(codigo: string): boolean {
  try { return localStorage.getItem(`hpc-encuesta-${codigo}`) === '1'; } catch { return false; }
}
function marcarRespondida(codigo: string) {
  try { localStorage.setItem(`hpc-encuesta-${codigo}`, '1'); } catch { /* sin almacenamiento: no pasa nada */ }
}

const PREGUNTAS_DOCENTE = [
  { id: 'p_claridad', texto: 'Claridad en la exposición de los temas', bajo: 'Muy baja', alto: 'Excelente' },
  { id: 'p_dominio', texto: 'Dominio del tema', bajo: 'Muy bajo', alto: 'Excelente' },
  { id: 'p_respuestas', texto: 'Disposición para responder preguntas y consultas', bajo: 'Muy baja', alto: 'Excelente' },
  { id: 'p_organizacion', texto: 'Organización y aprovechamiento del tiempo de clase', bajo: 'Muy baja', alto: 'Excelente' },
] as const;
const PREGUNTAS_CONTENIDO = [
  { id: 'p_relevancia', texto: 'Relevancia de los temas para tu práctica clínica', bajo: 'Muy baja', alto: 'Muy alta' },
  { id: 'p_profundidad', texto: 'Profundidad y actualización del contenido', bajo: 'Muy baja', alto: 'Muy alta' },
  { id: 'p_material', texto: 'Calidad del material entregado (bibliografía, diapositivas, recursos)', bajo: 'Muy baja', alto: 'Excelente' },
  { id: 'p_aplicabilidad', texto: 'Aplicabilidad práctica de lo aprendido', bajo: 'Muy baja', alto: 'Muy alta' },
] as const;
const PREGUNTA_GENERAL = { id: 'p_general', texto: 'Satisfacción general con el encuentro', bajo: 'Muy insatisfecho/a', alto: 'Muy satisfecho/a' } as const;

type IdPregunta = (typeof PREGUNTAS_DOCENTE)[number]['id'] | (typeof PREGUNTAS_CONTENIDO)[number]['id'] | typeof PREGUNTA_GENERAL.id;

export function Encuesta() {
  const [codigo, setCodigo] = useState<string | null>(codigoDelHash);
  const [clase, setClase] = useState<ClaseEncuesta | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'elegir' | 'responder' | 'enviada' | 'no_encontrada' | 'sin_configurar'>('cargando');

  useEffect(() => {
    const alCambiar = () => setCodigo(codigoDelHash());
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  useEffect(() => {
    if (!URL_BASE || !ANON_KEY) return setEstado('sin_configurar');
    if (!codigo) { setClase(null); return setEstado('elegir'); }
    setEstado('cargando');
    rpc<ClaseEncuesta[]>('encuesta_clase', { p_codigo: codigo })
      .then((filas) => {
        if (!filas?.length) return setEstado('no_encontrada');
        setClase(filas[0]);
        setEstado('responder');
      })
      .catch(() => setEstado('no_encontrada'));
  }, [codigo]);

  return (
    <div className="space-y-8 max-w-3xl">
      <EncabezadoSeccion
        antetitulo="Formaciones anuales"
        titulo="Encuesta de satisfacción"
        bajada="Tu opinión nos ayuda a mejorar cada encuentro. Completarla te toma menos de 3 minutos."
      />
      <p className="inline-flex items-center gap-2 rounded-full bg-hpc-claro px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-hpc">
        <ShieldCheck size={15} aria-hidden="true" /> Encuesta 100 % anónima
      </p>

      {estado === 'sin_configurar' && <p className="text-tinta/70">La encuesta no está disponible en este momento.</p>}
      {estado === 'cargando' && <p className="flex items-center gap-2 text-tinta/60"><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Cargando…</p>}
      {estado === 'no_encontrada' && (
        <div className="rounded-2xl bg-white border border-hpc/10 p-6 space-y-2">
          <p className="font-semibold text-hpc">No encontramos esa clase.</p>
          <p className="text-sm text-tinta/70">Puede que el enlace esté incompleto o que la clase se haya reprogramado.</p>
          <a href="#encuesta" className="text-sm text-hpc underline underline-offset-4">Elegir la clase de otra forma</a>
        </div>
      )}
      {estado === 'elegir' && <ElegirClase onElegida={(c) => { window.location.hash = `encuesta?c=${c}`; }} />}
      {estado === 'responder' && clase && <Formulario clase={clase} onEnviada={() => setEstado('enviada')} />}
      {estado === 'enviada' && (
        <div className="rounded-2xl bg-white border border-hpc/10 p-8 text-center space-y-2">
          <CheckCircle2 size={40} className="mx-auto text-whatsapp" aria-hidden="true" />
          <p className="text-xl font-semibold text-hpc">¡Gracias por tu respuesta!</p>
          <p className="text-sm text-tinta/70">La leemos con el equipo docente para seguir mejorando cada encuentro.</p>
        </div>
      )}
    </div>
  );
}

function ElegirClase({ onElegida }: { onElegida: (codigo: string) => void }) {
  const [formaciones, setFormaciones] = useState<Formacion[]>([]);
  const [formacion, setFormacion] = useState('');
  const [clases, setClases] = useState<ClaseEncuesta[] | null>(null);

  useEffect(() => {
    fetch(`${URL_BASE}/rest/v1/formaciones?select=*&activa=eq.true&order=orden`, { headers: { apikey: ANON_KEY!, Authorization: `Bearer ${ANON_KEY}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setFormaciones)
      .catch(() => setFormaciones([]));
  }, []);

  useEffect(() => {
    if (!formacion) return setClases(null);
    setClases(null);
    rpc<ClaseEncuesta[]>('encuesta_clases_recientes', { p_formacion: formacion }).then((c) => setClases(c ?? [])).catch(() => setClases([]));
  }, [formacion]);

  return (
    <section className="bg-white rounded-2xl border border-hpc/10 p-6 space-y-4">
      <h2 className="text-xl font-semibold text-hpc">¿Qué clase vas a evaluar?</h2>
      <label className="block">
        <span className="text-sm font-medium">Formación que estás cursando</span>
        <select value={formacion} onChange={(e) => setFormacion(e.target.value)} className="mt-1 block w-full rounded-lg border border-hpc/20 bg-white px-3 py-2.5 text-[15px]">
          <option value="">Seleccioná una formación…</option>
          {formaciones.map((f) => <option key={f.id} value={f.id}>{f.programa} · cohorte {f.cohorte}</option>)}
        </select>
      </label>
      {formacion && clases === null && <p className="flex items-center gap-2 text-sm text-tinta/60"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Buscando clases…</p>}
      {clases && clases.length === 0 && <p className="text-sm text-tinta/70">No hay clases de las últimas semanas para evaluar en esta formación.</p>}
      {clases && clases.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium mb-1">Elegí la clase</legend>
          {clases.map((c) => (
            <button key={c.codigo} type="button" onClick={() => onElegida(c.codigo)} className="block w-full rounded-xl border border-hpc/15 px-4 py-3 text-left hover:border-hpc hover:bg-hpc-claro">
              <span className="block font-medium text-hpc">{fechaCorta(c.fecha)} · {textoTurno(c.turno)}</span>
              <span className="block text-sm text-tinta/70">Docente: {c.docentes}</span>
            </button>
          ))}
        </fieldset>
      )}
    </section>
  );
}

function Formulario({ clase, onEnviada }: { clase: ClaseEncuesta; onEnviada: () => void }) {
  const [valores, setValores] = useState<Partial<Record<IdPregunta, number>>>({});
  const [loMejor, setLoMejor] = useState('');
  const [sugerencias, setSugerencias] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const repetida = yaRespondida(clase.codigo);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const todas = [...PREGUNTAS_DOCENTE, ...PREGUNTAS_CONTENIDO, PREGUNTA_GENERAL];
    const falta = todas.find((p) => !valores[p.id]);
    if (falta) return setError(`Falta responder: «${falta.texto}».`);
    setError('');
    setEnviando(true);
    try {
      await rpc('responder_encuesta', { p_codigo: clase.codigo, ...valores, p_lo_mejor: loMejor, p_sugerencias: sugerencias });
      marcarRespondida(clase.codigo);
      onEnviada();
    } catch {
      setError('No se pudo enviar. Revisá tu conexión y volvé a intentar.');
    } finally {
      setEnviando(false);
    }
  }

  const escala = (p: { id: IdPregunta; texto: string; bajo: string; alto: string }) => (
    <fieldset key={p.id} className="space-y-2">
      <legend className="text-[15px] font-medium text-tinta">{p.texto} <span className="text-red-700" aria-hidden="true">*</span></legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border text-base font-semibold ${valores[p.id] === n ? 'border-hpc bg-hpc text-crema' : 'border-hpc/20 bg-white text-hpc hover:bg-hpc-claro'}`}>
            <input type="radio" name={p.id} value={n} checked={valores[p.id] === n} onChange={() => setValores({ ...valores, [p.id]: n })} className="sr-only" />
            {n}
          </label>
        ))}
      </div>
      <div className="flex justify-between max-w-[236px] text-xs text-tinta/55"><span>{p.bajo}</span><span>{p.alto}</span></div>
    </fieldset>
  );

  return (
    <form onSubmit={enviar} className="space-y-6">
      <section className="rounded-2xl bg-hpc text-crema p-5 md:p-6">
        <p className="text-xs uppercase tracking-wider text-crema/70">Estás evaluando</p>
        <p className="mt-1 text-lg font-semibold">{clase.programa}</p>
        <p className="text-sm text-crema/85">{clase.fecha ? fechaCorta(clase.fecha) : ''} · {textoTurno(clase.turno)}</p>
        <p className="text-sm text-crema/85">Docente: {clase.docentes}</p>
        <a href="#encuesta" className="mt-2 inline-block text-xs text-crema/80 underline underline-offset-4">No es mi clase</a>
      </section>

      {repetida && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Desde este dispositivo ya se respondió esta clase. Si sos otra persona, podés responder igual.</p>
      )}

      <section className="bg-white rounded-2xl border border-hpc/10 p-5 md:p-6 space-y-5">
        <h2 className="text-lg font-semibold text-hpc">Desempeño del/de la docente</h2>
        {PREGUNTAS_DOCENTE.map(escala)}
      </section>
      <section className="bg-white rounded-2xl border border-hpc/10 p-5 md:p-6 space-y-5">
        <h2 className="text-lg font-semibold text-hpc">Contenido de la clase</h2>
        {PREGUNTAS_CONTENIDO.map(escala)}
      </section>
      <section className="bg-white rounded-2xl border border-hpc/10 p-5 md:p-6 space-y-5">
        <h2 className="text-lg font-semibold text-hpc">Valoración general</h2>
        {escala(PREGUNTA_GENERAL)}
        <label className="block">
          <span className="text-[15px] font-medium">¿Qué fue lo mejor de la clase?</span>
          <textarea rows={3} maxLength={2000} value={loMejor} onChange={(e) => setLoMejor(e.target.value)} className="mt-1 block w-full rounded-lg border border-hpc/20 bg-white px-3 py-2.5 text-[15px]" />
        </label>
        <label className="block">
          <span className="text-[15px] font-medium">Sugerencias para mejorar</span>
          <textarea rows={3} maxLength={2000} value={sugerencias} onChange={(e) => setSugerencias(e.target.value)} className="mt-1 block w-full rounded-lg border border-hpc/20 bg-white px-3 py-2.5 text-[15px]" />
        </label>
        <p className="text-xs text-tinta/55">No escribas tu nombre ni datos de pacientes en los comentarios.</p>
      </section>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <button type="submit" disabled={enviando} className="inline-flex items-center gap-2 rounded-xl bg-hpc px-6 py-3 font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-60">
        {enviando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />} Enviar respuestas
      </button>
    </form>
  );
}
