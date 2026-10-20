// src/components/MisClases.tsx
// Lo que ve cada docente al entrar al portal (#profesionales): sus clases de las formaciones.
//
// Puede:
//   - Confirmar que da cada clase.
//   - Cargar el enlace a la presentación y la guía (una carpeta o archivo de Drive).
//   - Avisar que NO puede dar una clase. Cuenta como cancelación (regla de la Fundación), pero
//     avisar con tiempo permite conseguir reemplazo: por eso se pide confirmación explícita.
//   - Ver el promedio de la encuesta de sus alumnos (sólo con 3 respuestas o más, sin comentarios).
//
// Todo pasa por funciones de la base (mis_clases, confirmar_mi_clase, ...): un/a docente no
// puede leer ni tocar clases de otras personas.

import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Link2, Loader2, Star, XCircle } from 'lucide-react';
import { obtenerCliente, mensajeDeError } from '../lib/cliente';
import { ESTADOS_CLASE, HORARIO_TURNO, TURNOS, textoTurno, fechaCorta, nombreMes, yaPaso, type MiClase } from '../lib/docentes';

interface Resultados {
  respuestas: number;
  promedio_docente: number | null;
  promedio_general: number | null;
}

export function MisClases() {
  const cliente = obtenerCliente()!;
  const [clases, setClases] = useState<MiClase[] | null>(null);
  const [resultados, setResultados] = useState<Resultados | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [verPasadas, setVerPasadas] = useState(false);

  async function cargar() {
    const [c, r] = await Promise.all([cliente.rpc('mis_clases'), cliente.rpc('mis_resultados_encuesta')]);
    if (c.error) setMensaje({ tipo: 'error', texto: mensajeDeError(c.error) });
    setClases((c.data ?? []) as MiClase[]);
    setResultados(((r.data ?? []) as Resultados[])[0] ?? null);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!clases) {
    return (
      <p className="flex items-center gap-2 text-tinta/60">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Cargando tus clases…
      </p>
    );
  }

  const proximas = clases.filter((c) => !yaPaso(c));
  const pasadas = clases.filter((c) => yaPaso(c));

  return (
    <div className="space-y-6">
      {mensaje && (
        <p role="status" className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${mensaje.tipo === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {mensaje.tipo === 'ok' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
          {mensaje.texto}
        </p>
      )}

      <div className="rounded-2xl bg-hpc-claro px-5 py-4 text-sm text-hpc space-y-1">
        <p><strong>Confirmá cada clase</strong> y cargá el enlace a la presentación y la guía antes del encuentro.</p>
        <p>Si no podés dar una clase, avisá acá lo antes posible: el equipo necesita tiempo para conseguir reemplazo.</p>
      </div>

      {resultados && resultados.respuestas > 0 && (
        <div className="bg-white rounded-2xl border border-hpc/10 p-5 flex flex-wrap items-center gap-x-8 gap-y-2">
          <p className="font-semibold text-hpc">Encuesta de tus alumnos</p>
          {resultados.promedio_docente !== null ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-tinta"><Star size={16} className="text-dorado" aria-hidden="true" /> Desempeño docente: <strong>{Number(resultados.promedio_docente).toFixed(1)}</strong> / 5</span>
              <span className="text-tinta">Satisfacción general: <strong>{Number(resultados.promedio_general).toFixed(1)}</strong> / 5</span>
              <span className="text-sm text-tinta/60">{resultados.respuestas} respuestas</span>
            </>
          ) : (
            <span className="text-sm text-tinta/60">{resultados.respuestas} respuesta(s). Los promedios se muestran a partir de 3, para cuidar el anonimato.</span>
          )}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-hpc">Próximas clases ({proximas.length})</h2>
        {proximas.length === 0 && <p className="text-sm text-tinta/60">No tenés clases asignadas por ahora.</p>}
        <ul className="space-y-3">
          {proximas.map((c) => (
            <TarjetaClase key={c.id} clase={c} onListo={(texto) => { setMensaje({ tipo: 'ok', texto }); cargar(); }} onError={(texto) => setMensaje({ tipo: 'error', texto })} />
          ))}
        </ul>
      </section>

      {pasadas.length > 0 && (
        <section className="space-y-3">
          <button type="button" onClick={() => setVerPasadas(!verPasadas)} className="text-sm text-hpc underline underline-offset-4">
            {verPasadas ? 'Ocultar' : 'Ver'} clases anteriores ({pasadas.length})
          </button>
          {verPasadas && (
            <ul className="space-y-2 text-sm">
              {pasadas.map((c) => (
                <li key={c.id} className="rounded-xl bg-white border border-hpc/10 px-4 py-2.5">
                  <span>{c.fecha ? fechaCorta(c.fecha) : nombreMes(c.mes)}</span> · {c.formacion} · {TURNOS[c.turno]} ·{' '}
                  <span className="text-tinta/60">{ESTADOS_CLASE[c.estado].texto}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function TarjetaClase({ clase, onListo, onError }: { clase: MiClase; onListo: (t: string) => void; onError: (t: string) => void }) {
  const cliente = obtenerCliente()!;
  const [ocupado, setOcupado] = useState(false);
  const [material, setMaterial] = useState(clase.material_url ?? '');
  const [avisando, setAvisando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const cancelada = clase.estado.startsWith('cancelada') || clase.estado === 'suspendida_hpc';

  async function llamar(fn: string, args: Record<string, unknown>, texto: string) {
    setOcupado(true);
    const { error } = await cliente.rpc(fn, args);
    setOcupado(false);
    if (error) {
      return onError(/ENLACE_INVALIDO/.test(error.message) ? 'El enlace tiene que empezar con https:// (copialo desde Drive con «Copiar enlace»).' : mensajeDeError(error));
    }
    onListo(texto);
  }

  function guardarMaterial(e: FormEvent) {
    e.preventDefault();
    llamar('cargar_material_mi_clase', { p_clase: clase.id, p_url: material.trim() || null }, 'Enlace del material guardado. ¡Gracias!');
  }

  return (
    <li className={`bg-white rounded-2xl border p-5 space-y-4 ${cancelada ? 'border-red-200 opacity-80' : 'border-hpc/10'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-hpc">{clase.formacion}</p>
          <p className="text-sm text-tinta/70">
            <span>{clase.fecha ? fechaCorta(clase.fecha) : `${nombreMes(clase.mes)} (fecha a confirmar)`}</span> · {textoTurno(clase.turno)}
            {HORARIO_TURNO[clase.turno] ? ` (${HORARIO_TURNO[clase.turno]})` : ''}
            {clase.co_docente ? ` · con ${clase.co_docente}` : ''}
          </p>
          {clase.temas && <p className="text-sm text-tinta/70 mt-1">Temas: {clase.temas}</p>}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADOS_CLASE[clase.estado].clase}`}>{ESTADOS_CLASE[clase.estado].texto}</span>
      </div>

      {!cancelada && (
        <>
          {clase.estado === 'programada' && (
            <button type="button" disabled={ocupado} onClick={() => llamar('confirmar_mi_clase', { p_clase: clase.id }, `Confirmaste ${clase.formacion} (${fechaCorta(clase.fecha)}). ¡Gracias!`)} className="inline-flex items-center gap-2 rounded-xl bg-hpc px-4 py-2.5 text-sm font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-60">
              {ocupado ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />} Confirmo que doy esta clase
            </button>
          )}

          <form onSubmit={guardarMaterial} className="flex flex-wrap items-end gap-2">
            <label className="block flex-1 min-w-[240px]">
              <span className="text-sm font-medium text-tinta">Enlace a la presentación y la guía</span>
              <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="https://drive.google.com/…" className="mt-1 block w-full rounded-lg border border-hpc/20 bg-white px-3 py-2.5 text-[15px] focus:border-hpc focus:outline-none focus:ring-2 focus:ring-hpc/20" />
            </label>
            <button type="submit" disabled={ocupado || material === (clase.material_url ?? '')} className="inline-flex items-center gap-2 rounded-xl border border-hpc/25 px-4 py-2.5 text-sm font-semibold text-hpc hover:bg-hpc-claro disabled:opacity-50">
              <Link2 size={16} aria-hidden="true" /> Guardar enlace
            </button>
            {clase.material_url && (
              <a href={clase.material_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 py-2.5 text-sm text-hpc underline underline-offset-4">
                <ExternalLink size={14} aria-hidden="true" /> Abrir
              </a>
            )}
          </form>

          {!avisando ? (
            <button type="button" onClick={() => setAvisando(true)} className="text-sm text-red-700 underline underline-offset-4">
              No puedo dar esta clase
            </button>
          ) : (
            <div className="rounded-xl bg-red-50 p-4 space-y-3">
              <p className="flex gap-2 text-sm text-red-900">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                Vas a cancelar tu participación en esta clase. Para la Fundación cuenta como cancelación y coordinación va a revisar tu continuidad.
              </p>
              <label className="block">
                <span className="text-sm font-medium text-red-900">Contanos el motivo</span>
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="mt-1 block w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-[15px]" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={ocupado} onClick={() => llamar('no_puedo_dar_mi_clase', { p_clase: clase.id, p_motivo: motivo }, 'Avisamos a coordinación que no podés dar la clase.')} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  <XCircle size={16} aria-hidden="true" /> Confirmar que no puedo
                </button>
                <button type="button" onClick={() => setAvisando(false)} className="px-3 text-sm text-hpc underline underline-offset-4">Volver</button>
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );
}
