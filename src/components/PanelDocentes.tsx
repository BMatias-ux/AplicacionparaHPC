// src/components/PanelDocentes.tsx
// Panel "Docentes" (sólo administradores): registro de docentes de las formaciones anuales,
// cronograma de clases, cumplimiento y resultados de la encuesta de los alumnos.
//
// La regla de Laura Flynn (20/10/2026): "la gente que ya canceló una vez, chau".
//   - Cuando una clase se marca como cancelada (acá, o porque el/la docente avisó desde el
//     portal), la BASE registra la incidencia y propone la baja (trigger clases_cancelacion).
//   - La baja no es automática: arriba de todo aparece "Bajas para resolver" y un/a admin la
//     confirma o la rechaza dejando el motivo (función resolver_baja_docente).
//   - Al confirmar la baja, la persona pierde el acceso y sus clases futuras quedan vacantes.
//
// Seguridad: lo decide la base (RLS, migración 20261020000011). Este panel sólo muestra.

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertCircle, AlertTriangle, CalendarPlus, CheckCircle2, ChevronDown, ChevronUp, Copy, ExternalLink,
  Loader2, MessageCircle, Pencil, Save, Star, UserPlus, UserX,
} from 'lucide-react';
import { obtenerCliente, mensajeDeError } from '../lib/cliente';
import {
  ESTADOS_CLASE, ESTADOS_DOCENTE, TIPOS_INCIDENCIA, TURNOS, HORARIO_TURNO,
  enlaceEncuesta, enlaceEncuestaGeneral, enlaceWhatsAppDocente, fechaCorta, hoyIso, nombreMes, yaPaso,
  type Clase, type Docente, type EstadoClase, type Formacion, type Incidencia, type ResumenDocente, type Turno,
} from '../lib/docentes';

interface Respuesta {
  clase_id: string;
  docente_claridad: number;
  docente_dominio: number;
  docente_respuestas: number;
  docente_organizacion: number;
  satisfaccion_general: number;
  lo_mejor: string | null;
  sugerencias: string | null;
  fecha: string;
}

type Mensaje = { tipo: 'ok' | 'error'; texto: string } | null;
type Vista = 'cronograma' | 'docentes';

const claseInput =
  'block w-full rounded-lg border border-hpc/20 bg-white px-3 py-2 text-[15px] text-tinta focus:border-hpc focus:outline-none focus:ring-2 focus:ring-hpc/20';

const promedioDocente = (r: Respuesta) => (r.docente_claridad + r.docente_dominio + r.docente_respuestas + r.docente_organizacion) / 4;

export function PanelDocentes() {
  const cliente = obtenerCliente()!;
  const [cargando, setCargando] = useState(true);
  const [formaciones, setFormaciones] = useState<Formacion[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [resumen, setResumen] = useState<ResumenDocente[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [vista, setVista] = useState<Vista>('cronograma');
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  async function cargar() {
    const [f, d, r, c, i, e] = await Promise.all([
      cliente.from('formaciones').select('*').order('orden'),
      cliente.from('docentes').select('*').order('nombre'),
      cliente.from('docentes_resumen').select('*'),
      cliente.from('clases').select('*').order('mes').order('fecha', { nullsFirst: false }).order('turno'),
      cliente.from('docente_incidencias').select('*').order('fecha', { ascending: false }),
      cliente.from('encuesta_respuestas').select('*').order('fecha', { ascending: false }),
    ]);
    const error = f.error ?? d.error ?? r.error ?? c.error ?? i.error ?? e.error;
    if (error) setMensaje({ tipo: 'error', texto: mensajeDeError(error) });
    setFormaciones(f.data ?? []);
    setDocentes(d.data ?? []);
    setResumen(r.data ?? []);
    setClases(c.data ?? []);
    setIncidencias(i.data ?? []);
    setRespuestas(e.data ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const porId = useMemo(() => new Map(docentes.map((d) => [d.id, d])), [docentes]);
  const hoy = hoyIso();

  // Alertas de arriba
  const bajasPropuestas = docentes.filter((d) => d.baja_propuesta);
  const en14 = new Date();
  en14.setDate(en14.getDate() + 14);
  const limite14 = `${en14.getFullYear()}-${String(en14.getMonth() + 1).padStart(2, '0')}-${String(en14.getDate()).padStart(2, '0')}`;
  const sinConfirmar = clases.filter((c) => c.estado === 'programada' && c.docente_id && c.fecha && c.fecha >= hoy && c.fecha <= limite14);
  const vacantesProximas = clases.filter((c) => !c.docente_id && !yaPaso(c) && c.estado !== 'suspendida_hpc');
  const pasadasSinCerrar = clases.filter((c) => c.docente_id && (c.estado === 'programada' || c.estado === 'confirmada') && yaPaso(c));

  if (cargando) {
    return (
      <p className="flex items-center gap-2 text-tinta/60">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Cargando docentes…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {mensaje && <Nota mensaje={mensaje} />}

      {bajasPropuestas.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5 md:p-6 space-y-4" aria-labelledby="bajas">
          <h2 id="bajas" className="flex items-center gap-2 text-lg font-semibold text-red-900">
            <UserX size={20} aria-hidden="true" /> Bajas para resolver ({bajasPropuestas.length})
          </h2>
          <p className="text-sm text-red-900/80">
            Regla de la Fundación: quien cancela una clase queda afuera. Confirmá la baja o, si hubo una causa
            excepcional, dejala activa explicando por qué (queda registrado).
          </p>
          {bajasPropuestas.map((d) => (
            <ResolverBaja
              key={d.id}
              docente={d}
              incidencias={incidencias.filter((i) => i.docente_id === d.id)}
              clases={clases}
              formaciones={formaciones}
              onListo={(texto) => { setMensaje({ tipo: 'ok', texto }); cargar(); }}
              onError={(texto) => setMensaje({ tipo: 'error', texto })}
            />
          ))}
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Indicador valor={sinConfirmar.length} texto="clases en los próximos 14 días sin confirmar" alerta={sinConfirmar.length > 0} />
        <Indicador valor={vacantesProximas.length} texto="clases vacantes (sin docente)" alerta={vacantesProximas.length > 0} />
        <Indicador valor={pasadasSinCerrar.length} texto="clases pasadas sin marcar si se dictaron" alerta={pasadasSinCerrar.length > 0} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Vista" className="inline-flex rounded-xl bg-hpc-claro p-1">
          {([['cronograma', 'Cronograma'], ['docentes', `Docentes (${docentes.filter((d) => d.estado !== 'baja').length})`]] as const).map(([id, texto]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={vista === id}
              onClick={() => setVista(id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${vista === id ? 'bg-white text-hpc shadow-sm' : 'text-hpc/70 hover:text-hpc'}`}
            >
              {texto}
            </button>
          ))}
        </div>
        <BotonCopiar texto={enlaceEncuestaGeneral()} etiqueta="Copiar enlace general de la encuesta" />
      </div>

      {vista === 'cronograma' ? (
        <Cronograma
          formaciones={formaciones}
          docentes={docentes}
          porId={porId}
          clases={clases}
          respuestas={respuestas}
          onGuardada={(c, texto) => {
            setClases((lista) => lista.map((x) => (x.id === c.id ? c : x)));
            setMensaje({ tipo: 'ok', texto });
            // La regla puede haber cambiado el estado de un/a docente: se recarga todo.
            if (c.estado === 'cancelada_aviso' || c.estado === 'cancelada_sin_aviso') cargar();
          }}
          onAgregada={(texto) => { setMensaje({ tipo: 'ok', texto }); cargar(); }}
          onError={(texto) => setMensaje({ tipo: 'error', texto })}
        />
      ) : (
        <ListaDocentes
          docentes={docentes}
          resumen={resumen}
          clases={clases}
          formaciones={formaciones}
          incidencias={incidencias}
          respuestas={respuestas}
          onCambio={(texto) => { setMensaje({ tipo: 'ok', texto }); cargar(); }}
          onError={(texto) => setMensaje({ tipo: 'error', texto })}
        />
      )}
    </div>
  );
}

// ============================================================================
// Resolver una baja propuesta
// ============================================================================

function ResolverBaja({ docente, incidencias, clases, formaciones, onListo, onError }: {
  docente: Docente; incidencias: Incidencia[]; clases: Clase[]; formaciones: Formacion[];
  onListo: (t: string) => void; onError: (t: string) => void;
}) {
  const cliente = obtenerCliente()!;
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const ultima = incidencias.find((i) => i.tipo === 'cancelacion_aviso' || i.tipo === 'cancelacion_sin_aviso');
  const claseUltima = ultima?.clase_id ? clases.find((c) => c.id === ultima.clase_id) : undefined;
  const formacion = claseUltima ? formaciones.find((f) => f.id === claseUltima.formacion_id)?.nombre : undefined;
  const futuras = clases.filter((c) => (c.docente_id === docente.id || c.co_docente_id === docente.id) && (c.estado === 'programada' || c.estado === 'confirmada') && !yaPaso(c)).length;

  async function resolver(confirmar: boolean) {
    if (motivo.trim().length < 3) return onError('Escribí el motivo antes de resolver (queda en el historial).');
    setGuardando(true);
    const { error } = await cliente.rpc('resolver_baja_docente', { p_docente: docente.id, p_confirmar: confirmar, p_motivo: motivo.trim() });
    setGuardando(false);
    if (error) return onError(mensajeDeError(error));
    onListo(confirmar
      ? `${docente.nombre}: baja confirmada. Perdió el acceso y ${futuras} clase(s) futura(s) quedaron vacantes. Recordá sacarla/o del grupo de docentes.`
      : `${docente.nombre}: sigue activo/a. La excepción quedó registrada.`);
  }

  return (
    <div className="rounded-xl bg-white p-4 space-y-3 border border-red-100">
      <div>
        <p className="font-semibold text-tinta">{docente.nombre}</p>
        <p className="text-sm text-tinta/70">
          {ultima ? `${TIPOS_INCIDENCIA[ultima.tipo]} · ${fechaCorta(ultima.fecha)}${formacion ? ` · ${formacion}` : ''}` : 'Cancelación registrada'}
          {ultima?.detalle ? ` · ${ultima.detalle}` : ''}
        </p>
        <p className="text-xs text-tinta/55 mt-1">Si se confirma: {futuras} clase(s) futura(s) quedan vacantes.</p>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Motivo (obligatorio)</span>
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: canceló la clase del 16/10, tercera reprogramación" className={`mt-1 ${claseInput}`} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={guardando} onClick={() => resolver(true)} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
          {guardando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UserX size={16} aria-hidden="true" />} Confirmar baja
        </button>
        <button type="button" disabled={guardando} onClick={() => resolver(false)} className="rounded-xl border border-hpc/25 px-4 py-2.5 text-sm font-semibold text-hpc hover:bg-hpc-claro disabled:opacity-60">
          Mantener (excepción)
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Cronograma por mes
// ============================================================================

function Cronograma({ formaciones, docentes, porId, clases, respuestas, onGuardada, onAgregada, onError }: {
  formaciones: Formacion[]; docentes: Docente[]; porId: Map<string, Docente>; clases: Clase[]; respuestas: Respuesta[];
  onGuardada: (c: Clase, texto: string) => void; onAgregada: (t: string) => void; onError: (t: string) => void;
}) {
  const meses = useMemo(() => [...new Set(clases.map((c) => c.mes))].sort(), [clases]);
  const mesActual = hoyIso().slice(0, 8) + '01';
  const [mes, setMes] = useState(() => meses.find((m) => m >= mesActual) ?? meses[meses.length - 1] ?? mesActual);
  const [soloPendientes, setSoloPendientes] = useState(false);

  const delMes = clases.filter((c) => c.mes === mes);
  const filtradas = soloPendientes
    ? delMes.filter((c) => !c.docente_id || c.estado === 'programada' || ((c.estado === 'confirmada') && yaPaso(c)))
    : delMes;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Mes">
        {meses.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMes(m)}
            aria-pressed={mes === m}
            className={`rounded-full px-3.5 py-1.5 text-sm ${mes === m ? 'bg-hpc text-crema' : 'bg-white text-hpc border border-hpc/15 hover:bg-hpc-claro'}`}
          >
            {nombreMes(m)}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-tinta/75">
          <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} className="h-4 w-4 accent-hpc" />
          Sólo lo pendiente
        </label>
      </div>

      {formaciones.map((f) => {
        const filas = filtradas.filter((c) => c.formacion_id === f.id);
        if (filas.length === 0) return null;
        return (
          <section key={f.id} className="bg-white rounded-2xl border border-hpc/10 p-4 md:p-6 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-hpc">{f.nombre}</h3>
              <p className="text-xs text-tinta/55">{f.programa}</p>
            </div>
            <ul className="space-y-3">
              {filas.map((c) => (
                <FilaClase
                  key={c.id}
                  clase={c}
                  formacion={f}
                  docentes={docentes}
                  porId={porId}
                  respuestas={respuestas.filter((r) => r.clase_id === c.id)}
                  onGuardada={onGuardada}
                  onError={onError}
                />
              ))}
            </ul>
          </section>
        );
      })}
      {filtradas.length === 0 && <p className="text-sm text-tinta/60">No hay clases {soloPendientes ? 'pendientes ' : ''}en {nombreMes(mes)}.</p>}

      <NuevaClase formaciones={formaciones} mesInicial={mes} onAgregada={onAgregada} onError={onError} />
    </div>
  );
}

function FilaClase({ clase, formacion, docentes, porId, respuestas, onGuardada, onError }: {
  clase: Clase; formacion: Formacion; docentes: Docente[]; porId: Map<string, Docente>; respuestas: Respuesta[];
  onGuardada: (c: Clase, texto: string) => void; onError: (t: string) => void;
}) {
  const cliente = obtenerCliente()!;
  const [borrador, setBorrador] = useState(clase);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  useEffect(() => setBorrador(clase), [clase]);

  const cambiado = (['fecha', 'docente_id', 'co_docente_id', 'estado', 'notas', 'temas'] as const).some((k) => (borrador[k] ?? '') !== (clase[k] ?? ''));
  const pasada = yaPaso(clase);
  const docente = clase.docente_id ? porId.get(clase.docente_id) : undefined;
  const elegibles = docentes.filter((d) => d.estado !== 'baja' || d.id === clase.docente_id || d.id === clase.co_docente_id);
  const vaACancelar = (borrador.estado === 'cancelada_aviso' || borrador.estado === 'cancelada_sin_aviso') && borrador.estado !== clase.estado;
  const promedio = respuestas.length ? respuestas.reduce((s, r) => s + promedioDocente(r), 0) / respuestas.length : null;

  // Un clic para lo más común después de cada sábado: marcar que la clase se dio.
  async function marcarDictada() {
    setGuardando(true);
    const { data, error } = await cliente.from('clases').update({ estado: 'dictada' }).eq('id', clase.id).select().single();
    setGuardando(false);
    if (error) return onError(mensajeDeError(error));
    onGuardada(data as Clase, `${formacion.nombre} · ${TURNOS[clase.turno]} (${fechaCorta(clase.fecha)}): marcada como dictada.`);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const cambios = {
      fecha: borrador.fecha || null,
      docente_id: borrador.docente_id || null,
      co_docente_id: borrador.co_docente_id || null,
      estado: borrador.estado,
      notas: borrador.notas?.trim() || null,
      temas: borrador.temas?.trim() || null,
      // Si se cambia de docente, la confirmación anterior ya no vale.
      ...(borrador.docente_id !== clase.docente_id && borrador.estado === 'confirmada' ? { estado: 'programada' as EstadoClase, confirmada_at: null } : {}),
    };
    const { data, error } = await cliente.from('clases').update(cambios).eq('id', clase.id).select().single();
    setGuardando(false);
    if (error) {
      return onError(/clases_fecha_en_mes/.test(error.message) ? `La fecha tiene que ser de ${nombreMes(clase.mes)}.` : mensajeDeError(error));
    }
    setEditando(false);
    onGuardada(data as Clase, `${formacion.nombre} · ${TURNOS[clase.turno]}: guardado.${vaACancelar ? ' Se registró la cancelación y se propuso la baja.' : ''}`);
  }

  const textoConfirmacion = docente
    ? `Hola ${docente.nombre.split(' ')[0]}, ¿cómo estás? Te escribo de HPC para confirmar la clase de ${formacion.nombre} del ${fechaCorta(clase.fecha)} (turno ${TURNOS[clase.turno].toLowerCase()}${HORARIO_TURNO[clase.turno] ? `, ${HORARIO_TURNO[clase.turno]}` : ''}). ¿Nos confirmás que la das? También podés confirmarla y subir el enlace a la presentación y la guía en el portal: ${window.location.origin}/#profesionales. ¡Gracias!`
    : '';

  return (
    <li className={`rounded-xl border p-3 md:p-4 ${!clase.docente_id ? 'border-amber-300 bg-amber-50/50' : clase.estado.startsWith('cancelada') ? 'border-red-200 bg-red-50/40' : 'border-hpc/10'}`}>
      <form onSubmit={guardar} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-tinta">{TURNOS[clase.turno]}</span>
          <span className="text-sm text-tinta/60">{fechaCorta(clase.fecha)}</span>
          {docente && (
            <span className="text-sm font-medium text-hpc">
              {docente.nombre}{clase.co_docente_id ? ` y ${porId.get(clase.co_docente_id)?.nombre ?? ''}` : ''}
            </span>
          )}
          {!clase.docente_id && <Chip clase="bg-amber-100 text-amber-900">Vacante</Chip>}
          {clase.docente_id && <Chip clase={ESTADOS_CLASE[clase.estado].clase}>{ESTADOS_CLASE[clase.estado].texto}</Chip>}
          {pasada && clase.docente_id && (clase.estado === 'programada' || clase.estado === 'confirmada') && (
            <Chip clase="bg-amber-100 text-amber-900">¿Se dictó?</Chip>
          )}
          {docente?.estado === 'observacion' && <Chip clase="bg-red-100 text-red-900">Docente en observación</Chip>}
          {docente?.estado === 'baja' && <Chip clase="bg-red-100 text-red-900">Docente de baja: reasignar</Chip>}
          {promedio !== null && (
            <span className="inline-flex items-center gap-1 text-sm text-tinta/70" title="Promedio del desempeño docente en la encuesta">
              <Star size={14} className="text-dorado" aria-hidden="true" /> {promedio.toFixed(1)} ({respuestas.length})
            </span>
          )}
        </div>
        {!editando && clase.notas && <p className="text-xs text-tinta/60">{clase.notas}</p>}

        {editando && (<>
        <div className="grid gap-2 md:grid-cols-[150px_1fr_1fr_190px]">
          <label className="block">
            <span className="text-xs font-medium text-tinta/70">Fecha</span>
            <input type="date" value={borrador.fecha ?? ''} onChange={(e) => setBorrador({ ...borrador, fecha: e.target.value || null })} className={claseInput} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-tinta/70">Docente</span>
            <select value={borrador.docente_id ?? ''} onChange={(e) => setBorrador({ ...borrador, docente_id: e.target.value || null })} className={claseInput}>
              <option value="">— Vacante —</option>
              {elegibles.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}{d.estado === 'observacion' ? ' (en observación)' : d.estado === 'baja' ? ' (BAJA)' : ''}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-tinta/70">Co-docente (opcional)</span>
            <select value={borrador.co_docente_id ?? ''} onChange={(e) => setBorrador({ ...borrador, co_docente_id: e.target.value || null })} className={claseInput}>
              <option value="">—</option>
              {elegibles.filter((d) => d.id !== borrador.docente_id).map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-tinta/70">Estado</span>
            <select value={borrador.estado} onChange={(e) => setBorrador({ ...borrador, estado: e.target.value as EstadoClase })} className={claseInput}>
              {(Object.keys(ESTADOS_CLASE) as EstadoClase[]).map((k) => (
                <option key={k} value={k}>{ESTADOS_CLASE[k].texto}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-tinta/70">Notas internas</span>
          <input value={borrador.notas ?? ''} onChange={(e) => setBorrador({ ...borrador, notas: e.target.value })} className={claseInput} />
        </label>

        {vaACancelar && (
          <p className="flex gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Al guardar se registra la cancelación y se propone la baja de {docente?.nombre ?? 'el/la docente'}
            {clase.co_docente_id ? ` y de ${porId.get(clase.co_docente_id)?.nombre}` : ''}. Si la suspendió la Fundación, elegí «Suspendida por HPC».
          </p>
        )}
        </>)}

        <div className="flex flex-wrap items-center gap-2">
          {editando ? (
            <>
              <button type="submit" disabled={guardando || !cambiado} className="inline-flex items-center gap-2 rounded-lg bg-hpc px-3.5 py-2 text-sm font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-50">
                {guardando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} Guardar
              </button>
              <button type="button" onClick={() => { setBorrador(clase); setEditando(false); }} className="px-2 text-sm text-hpc underline underline-offset-4">Cancelar</button>
            </>
          ) : (
            <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-hpc/20 px-3 py-2 text-sm font-medium text-hpc hover:bg-hpc-claro">
              <Pencil size={15} aria-hidden="true" /> {clase.docente_id ? 'Editar' : 'Asignar docente'}
            </button>
          )}
          {!editando && pasada && clase.docente_id && (clase.estado === 'programada' || clase.estado === 'confirmada') && (
            <button type="button" disabled={guardando} onClick={marcarDictada} className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60">
              <CheckCircle2 size={15} aria-hidden="true" /> Se dictó
            </button>
          )}
          {clase.docente_id && <BotonCopiar texto={enlaceEncuesta(clase.codigo_encuesta)} etiqueta="Enlace de la encuesta" chico />}
          {docente?.telefono && clase.estado === 'programada' && !pasada && (
            <a href={enlaceWhatsAppDocente(docente.telefono, textoConfirmacion)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-whatsapp/30 px-3 py-2 text-sm font-medium text-whatsapp hover:bg-green-50">
              <MessageCircle size={16} aria-hidden="true" /> Pedir confirmación
            </a>
          )}
          {clase.docente_id && !docente?.telefono && clase.estado === 'programada' && !pasada && (
            <BotonCopiar texto={textoConfirmacion} etiqueta="Copiar mensaje de confirmación" chico />
          )}
          {clase.material_url && (
            <a href={clase.material_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-hpc underline underline-offset-4">
              <ExternalLink size={14} aria-hidden="true" /> Material
            </a>
          )}
          {clase.confirmada_at && (
            <span className="text-xs text-tinta/55">Confirmó el {new Date(clase.confirmada_at).toLocaleDateString('es-AR')}</span>
          )}
        </div>
      </form>
    </li>
  );
}

function NuevaClase({ formaciones, mesInicial, onAgregada, onError }: { formaciones: Formacion[]; mesInicial: string; onAgregada: (t: string) => void; onError: (t: string) => void }) {
  const cliente = obtenerCliente()!;
  const [abierta, setAbierta] = useState(false);
  const [formacion, setFormacion] = useState('');
  const [mes, setMes] = useState(mesInicial.slice(0, 7));
  const [fecha, setFecha] = useState('');
  const [turno, setTurno] = useState<Turno>('manana');
  const [guardando, setGuardando] = useState(false);

  async function agregar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const mesIso = (fecha ? fecha.slice(0, 7) : mes) + '-01';
    const { error } = await cliente.from('clases').insert({ formacion_id: formacion, mes: mesIso, fecha: fecha || null, turno });
    setGuardando(false);
    if (error) return onError(mensajeDeError(error));
    setAbierta(false);
    onAgregada('Clase agregada como vacante: asignale docente en el cronograma.');
  }

  if (!abierta) {
    return (
      <button type="button" onClick={() => setAbierta(true)} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-hpc/30 px-4 py-2.5 text-sm font-medium text-hpc hover:bg-hpc-claro">
        <CalendarPlus size={18} aria-hidden="true" /> Agregar una clase
      </button>
    );
  }
  return (
    <form onSubmit={agregar} className="bg-white rounded-2xl border border-hpc/10 p-5 space-y-3">
      <h3 className="font-semibold text-hpc">Agregar una clase</h3>
      <div className="grid gap-3 md:grid-cols-4 md:items-end">
        <label className="block">
          <span className="text-sm font-medium">Formación</span>
          <select required value={formacion} onChange={(e) => setFormacion(e.target.value)} className={`mt-1 ${claseInput}`}>
            <option value="" disabled>Elegí…</option>
            {formaciones.filter((f) => f.activa).map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Mes</span>
          <input type="month" required value={mes} onChange={(e) => setMes(e.target.value)} className={`mt-1 ${claseInput}`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Fecha (si ya está)</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`mt-1 ${claseInput}`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Turno</span>
          <select value={turno} onChange={(e) => setTurno(e.target.value as Turno)} className={`mt-1 ${claseInput}`}>
            {(Object.keys(TURNOS) as Turno[]).map((t) => <option key={t} value={t}>{TURNOS[t]}</option>)}
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 rounded-xl bg-hpc px-4 py-2.5 text-sm font-semibold text-crema disabled:opacity-60">
          {guardando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <CalendarPlus size={16} aria-hidden="true" />} Agregar
        </button>
        <button type="button" onClick={() => setAbierta(false)} className="px-3 text-sm text-hpc underline underline-offset-4">Cancelar</button>
      </div>
    </form>
  );
}

// ============================================================================
// Lista de docentes (registro, desempeño y comentarios)
// ============================================================================

type Orden = 'estado' | 'puntaje' | 'nombre';

function ListaDocentes({ docentes, resumen, clases, formaciones, incidencias, respuestas, onCambio, onError }: {
  docentes: Docente[]; resumen: ResumenDocente[]; clases: Clase[]; formaciones: Formacion[]; incidencias: Incidencia[]; respuestas: Respuesta[];
  onCambio: (t: string) => void; onError: (t: string) => void;
}) {
  const [orden, setOrden] = useState<Orden>('estado');
  const [verBajas, setVerBajas] = useState(false);
  const res = useMemo(() => new Map(resumen.map((r) => [r.id, r])), [resumen]);
  const pesoEstado = { observacion: 0, activo: 1, baja: 2 } as const;

  const lista = docentes
    .filter((d) => verBajas || d.estado !== 'baja')
    .sort((a, b) => {
      if (orden === 'nombre') return a.nombre.localeCompare(b.nombre);
      if (orden === 'puntaje') return (res.get(b.id)?.promedio_docente ?? -1) - (res.get(a.id)?.promedio_docente ?? -1);
      return pesoEstado[a.estado] - pesoEstado[b.estado] || a.nombre.localeCompare(b.nombre);
    });

  return (
    <div className="space-y-5">
      <NuevoDocente onAgregado={onCambio} onError={onError} />
      <section className="bg-white rounded-2xl border border-hpc/10 p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-hpc mr-auto">Registro de docentes</h2>
          <label className="inline-flex items-center gap-2 text-sm text-tinta/75">
            <input type="checkbox" checked={verBajas} onChange={(e) => setVerBajas(e.target.checked)} className="h-4 w-4 accent-hpc" />
            Mostrar bajas
          </label>
          <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} aria-label="Ordenar" className="rounded-lg border border-hpc/20 bg-white px-3 py-2 text-sm">
            <option value="estado">Ordenar por estado</option>
            <option value="puntaje">Ordenar por puntaje de la encuesta</option>
            <option value="nombre">Ordenar por nombre</option>
          </select>
        </div>
        <ul className="divide-y divide-hpc/10">
          {lista.map((d) => (
            <FilaDocente
              key={d.id}
              docente={d}
              resumen={res.get(d.id)}
              clases={clases.filter((c) => c.docente_id === d.id || c.co_docente_id === d.id)}
              formaciones={formaciones}
              incidencias={incidencias.filter((i) => i.docente_id === d.id)}
              respuestas={respuestas.filter((r) => clases.some((c) => c.id === r.clase_id && (c.docente_id === d.id || c.co_docente_id === d.id)))}
              onCambio={onCambio}
              onError={onError}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function FilaDocente({ docente, resumen, clases, formaciones, incidencias, respuestas, onCambio, onError }: {
  docente: Docente; resumen?: ResumenDocente; clases: Clase[]; formaciones: Formacion[]; incidencias: Incidencia[]; respuestas: Respuesta[];
  onCambio: (t: string) => void; onError: (t: string) => void;
}) {
  const cliente = obtenerCliente()!;
  const [abierta, setAbierta] = useState(false);
  const [borrador, setBorrador] = useState(docente);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => setBorrador(docente), [docente]);
  const nombreFormacion = (id: string) => formaciones.find((f) => f.id === id)?.nombre ?? id;
  const proximas = clases.filter((c) => !yaPaso(c) && (c.estado === 'programada' || c.estado === 'confirmada'));
  const comentarios = respuestas.filter((r) => r.lo_mejor || r.sugerencias).slice(0, 6);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const { error } = await cliente.from('docentes').update({
      nombre: borrador.nombre.trim(),
      email: borrador.email?.trim().toLowerCase() || null,
      telefono: borrador.telefono?.trim() || null,
      temas: borrador.temas?.trim() || null,
      cv_url: borrador.cv_url?.trim() || null,
      notas: borrador.notas?.trim() || null,
    }).eq('id', docente.id);
    setGuardando(false);
    if (error) {
      return onError(error.code === '23505' ? 'Ese correo ya lo tiene otro/a docente.' : /cv_url/.test(error.message) ? 'El enlace del CV tiene que empezar con https://' : mensajeDeError(error));
    }
    onCambio(`${borrador.nombre}: datos guardados.`);
  }

  return (
    <li className="py-4">
      <button type="button" onClick={() => setAbierta(!abierta)} aria-expanded={abierta} className="w-full text-left grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-hpc">{docente.nombre}</span>
            <Chip clase={ESTADOS_DOCENTE[docente.estado].clase}>{ESTADOS_DOCENTE[docente.estado].texto}</Chip>
            {docente.baja_propuesta && <Chip clase="bg-red-100 text-red-900">Baja propuesta</Chip>}
            {!docente.email && docente.estado !== 'baja' && <Chip clase="bg-tinta/10 text-tinta/60">Sin correo: no puede entrar</Chip>}
          </span>
          <span className="block text-xs text-tinta/60 mt-1">
            {resumen?.clases_proximas ?? 0} próximas · {resumen?.clases_dictadas ?? 0} dictadas · {resumen?.cancelaciones ?? 0} cancelaciones
            {docente.estado === 'baja' && docente.fecha_baja ? ` · baja el ${fechaCorta(docente.fecha_baja)}` : ''}
          </span>
        </span>
        <span className="flex items-center gap-3 text-sm">
          {resumen && resumen.respuestas_encuesta > 0 ? (
            <span className="inline-flex items-center gap-1 text-tinta/80" title="Desempeño docente en la encuesta (1 a 5)">
              <Star size={15} className="text-dorado" aria-hidden="true" /> {Number(resumen.promedio_docente).toFixed(1)}
              <span className="text-tinta/50">({resumen.respuestas_encuesta})</span>
            </span>
          ) : (
            <span className="text-xs text-tinta/45">Sin encuestas</span>
          )}
          {abierta ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </span>
      </button>

      {abierta && (
        <div className="mt-4 space-y-5">
          <form onSubmit={guardar} className="grid gap-3 md:grid-cols-2">
            <Campo etiqueta="Nombre">
              <input required value={borrador.nombre} onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })} className={claseInput} />
            </Campo>
            <Campo etiqueta="Correo (con este entra al portal)">
              <input type="email" value={borrador.email ?? ''} onChange={(e) => setBorrador({ ...borrador, email: e.target.value })} className={claseInput} />
            </Campo>
            <Campo etiqueta="WhatsApp">
              <input value={borrador.telefono ?? ''} onChange={(e) => setBorrador({ ...borrador, telefono: e.target.value })} placeholder="Ej.: 11 2345 6789" className={claseInput} />
            </Campo>
            <Campo etiqueta="Enlace al CV (Drive)">
              <input value={borrador.cv_url ?? ''} onChange={(e) => setBorrador({ ...borrador, cv_url: e.target.value })} placeholder="https://drive.google.com/…" className={claseInput} />
            </Campo>
            <Campo etiqueta="Formaciones y temas que puede dar" className="md:col-span-2">
              <input value={borrador.temas ?? ''} onChange={(e) => setBorrador({ ...borrador, temas: e.target.value })} className={claseInput} />
            </Campo>
            <Campo etiqueta="Notas internas (no las ve el/la docente)" className="md:col-span-2">
              <textarea rows={2} value={borrador.notas ?? ''} onChange={(e) => setBorrador({ ...borrador, notas: e.target.value })} className={claseInput} />
            </Campo>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 rounded-xl bg-hpc px-4 py-2.5 text-sm font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-60">
                {guardando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} Guardar datos
              </button>
              {docente.cv_url && (
                <a href={docente.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-hpc underline underline-offset-4">
                  <ExternalLink size={14} aria-hidden="true" /> Ver CV
                </a>
              )}
              {docente.estado === 'baja' && docente.motivo_baja && <span className="text-sm text-tinta/70">Motivo de la baja: {docente.motivo_baja}</span>}
            </div>
          </form>

          <Bloque titulo={`Próximas clases (${proximas.length})`}>
            {proximas.length ? (
              <ul className="text-sm space-y-1">
                {proximas.map((c) => (
                  <li key={c.id}>
                    <span>{c.fecha ? fechaCorta(c.fecha) : nombreMes(c.mes)}</span> · {nombreFormacion(c.formacion_id)} · {TURNOS[c.turno]} ·{' '}
                    <span className={c.confirmada_at ? 'text-hpc' : 'text-amber-800'}>{c.confirmada_at ? 'confirmada' : 'sin confirmar'}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-tinta/55">No tiene clases asignadas.</p>}
          </Bloque>

          <Bloque titulo="Historial de cumplimiento">
            {incidencias.length ? (
              <ul className="text-sm space-y-1">
                {incidencias.map((i) => (
                  <li key={i.id}><span>{fechaCorta(i.fecha)}</span> · {TIPOS_INCIDENCIA[i.tipo] ?? i.tipo}{i.detalle ? ` · ${i.detalle}` : ''}</li>
                ))}
              </ul>
            ) : <p className="text-sm text-tinta/55">Sin incidencias.</p>}
          </Bloque>

          <Bloque titulo="Lo que dicen los alumnos">
            {comentarios.length ? (
              <ul className="text-sm space-y-2">
                {comentarios.map((r, n) => (
                  <li key={n} className="rounded-lg bg-crema/70 px-3 py-2">
                    {r.lo_mejor && <p><strong>Lo mejor:</strong> {r.lo_mejor}</p>}
                    {r.sugerencias && <p><strong>Sugerencia:</strong> {r.sugerencias}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-tinta/55">Todavía no hay comentarios.</p>}
          </Bloque>
        </div>
      )}
    </li>
  );
}

function NuevoDocente({ onAgregado, onError }: { onAgregado: (t: string) => void; onError: (t: string) => void }) {
  const cliente = obtenerCliente()!;
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function agregar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const { error } = await cliente.from('docentes').insert({ nombre: nombre.trim(), email: email.trim().toLowerCase() || null, telefono: telefono.trim() || null });
    setGuardando(false);
    if (error) return onError(error.code === '23505' ? 'Ese correo ya está cargado.' : mensajeDeError(error));
    setNombre(''); setEmail(''); setTelefono('');
    onAgregado(`${nombre.trim()} agregado/a al registro.${email ? ' Ya puede entrar a #profesionales con su correo.' : ''}`);
  }

  return (
    <form onSubmit={agregar} className="bg-white rounded-2xl border border-hpc/10 p-5 md:p-6 space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-hpc">Agregar docente</h2>
        <p className="text-sm text-tinta/65">Con el correo cargado puede entrar al portal a ver y confirmar sus clases.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1.3fr_1.3fr_1fr_auto] md:items-end">
        <Campo etiqueta="Nombre"><input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Lic. Nombre Apellido" className={claseInput} /></Campo>
        <Campo etiqueta="Correo"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={claseInput} /></Campo>
        <Campo etiqueta="WhatsApp"><input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={claseInput} /></Campo>
        <button type="submit" disabled={guardando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-hpc px-5 py-2.5 text-sm font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-60">
          {guardando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />} Agregar
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Piezas chicas
// ============================================================================

function Indicador({ valor, texto, alerta }: { valor: number; texto: string; alerta: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${alerta ? 'border-amber-200 bg-amber-50/70' : 'border-hpc/10 bg-white'}`}>
      <p className={`text-3xl font-semibold ${alerta ? 'text-amber-900' : 'text-hpc'}`}>{valor}</p>
      <p className="text-sm text-tinta/70">{texto}</p>
    </div>
  );
}

function Chip({ clase, children }: { clase: string; children: ReactNode }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${clase}`}>{children}</span>;
}

function Campo({ etiqueta, className = '', children }: { etiqueta: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-tinta">{etiqueta}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-hpc mb-1.5">{titulo}</h4>
      {children}
    </div>
  );
}

function Nota({ mensaje }: { mensaje: NonNullable<Mensaje> }) {
  return (
    <p role="status" className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${mensaje.tipo === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
      {mensaje.tipo === 'ok' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
      {mensaje.texto}
    </p>
  );
}

export function BotonCopiar({ texto, etiqueta, chico = false }: { texto: string; etiqueta: string; chico?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (algunos navegadores): se muestra el texto para copiarlo a mano.
      window.prompt('Copiá el texto:', texto);
    }
  }
  return (
    <button type="button" onClick={copiar} className={`inline-flex items-center gap-1.5 rounded-lg border border-hpc/20 font-medium text-hpc hover:bg-hpc-claro ${chico ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm'}`}>
      {copiado ? <CheckCircle2 size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      {copiado ? 'Copiado' : etiqueta}
    </button>
  );
}
