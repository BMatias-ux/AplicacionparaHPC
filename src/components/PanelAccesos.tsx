// src/components/PanelAccesos.tsx
// Panel de administración de accesos del equipo profesional (sólo administradores).
//
// Qué permite:
//   - Ver todos los correos cargados, buscar y filtrar (habilitados / deshabilitados).
//   - Activar o desactivar el ACCESO de cada persona (columna accesos_profesionales.habilitado).
//     Desactivar corta el acceso aunque ya haya ingresado antes: deja de ver y editar su ficha.
//   - Mostrar u ocultar la ficha en el PORTAL PÚBLICO (profesionales.activo). Sirve cuando
//     alguien deja la Fundación: se le quita el acceso y además desaparece del directorio.
//   - Agregar un correo nuevo (queda habilitado al guardarlo).
//   - Anotar por qué se habilitó o no (columna notas).
//
// Seguridad: todo esto lo autoriza la base con RLS (política "admin gestiona accesos" y
// "admin gestiona profesionales"). Si alguien sin rol admin abriera este panel, la base no
// le devolvería datos ni le dejaría guardar.

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { obtenerCliente, mensajeDeError, type ItemCatalogo } from '../lib/cliente';

interface Acceso {
  email: string;
  nombre: string | null;
  zona_id: string | null;
  habilitado: boolean;
  notas: string | null;
  primer_ingreso: string | null;
  profesional_id: string | null;
  // Ficha vinculada (PostgREST la trae embebida por la clave foránea profesional_id).
  profesionales: { activo: boolean } | null;
}

type Filtro = 'todos' | 'habilitados' | 'deshabilitados';

export function PanelAccesos() {
  const cliente = obtenerCliente()!;
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [zonas, setZonas] = useState<ItemCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [guardandoEmail, setGuardandoEmail] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  async function cargar() {
    const [a, z] = await Promise.all([
      cliente
        .from('accesos_profesionales')
        .select('email, nombre, zona_id, habilitado, notas, primer_ingreso, profesional_id, profesionales(activo)')
        .order('nombre'),
      cliente.from('zonas').select('id, nombre').order('orden'),
    ]);
    if (a.error) setMensaje({ tipo: 'error', texto: mensajeDeError(a.error) });
    setAccesos((a.data ?? []) as unknown as Acceso[]);
    setZonas(z.data ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombreZona = (id: string | null) => zonas.find((z) => z.id === id)?.nombre ?? 'Sin zona';

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return accesos.filter((a) => {
      if (filtro === 'habilitados' && !a.habilitado) return false;
      if (filtro === 'deshabilitados' && a.habilitado) return false;
      return !q || a.email.includes(q) || (a.nombre ?? '').toLowerCase().includes(q);
    });
  }, [accesos, busqueda, filtro]);

  const cantidadHabilitados = accesos.filter((a) => a.habilitado).length;

  // ---------- Acciones ----------

  async function cambiarAcceso(a: Acceso, habilitado: boolean) {
    setGuardandoEmail(a.email);
    setMensaje(null);
    const { error } = await cliente.from('accesos_profesionales').update({ habilitado }).eq('email', a.email);
    setGuardandoEmail(null);
    if (error) return setMensaje({ tipo: 'error', texto: mensajeDeError(error) });
    setAccesos((lista) => lista.map((x) => (x.email === a.email ? { ...x, habilitado } : x)));
    setMensaje({ tipo: 'ok', texto: `${a.nombre ?? a.email}: acceso ${habilitado ? 'activado' : 'desactivado'}.` });
  }

  async function cambiarVisibilidad(a: Acceso, activo: boolean) {
    if (!a.profesional_id) return;
    setGuardandoEmail(a.email);
    setMensaje(null);
    const { error } = await cliente.from('profesionales').update({ activo }).eq('id', a.profesional_id);
    setGuardandoEmail(null);
    if (error) return setMensaje({ tipo: 'error', texto: mensajeDeError(error) });
    setAccesos((lista) => lista.map((x) => (x.email === a.email ? { ...x, profesionales: { activo } } : x)));
    setMensaje({ tipo: 'ok', texto: `${a.nombre ?? a.email}: ${activo ? 'visible' : 'oculta'} en el portal.` });
  }

  async function guardarNotas(a: Acceso, notas: string) {
    if ((a.notas ?? '') === notas) return; // no cambió
    const { error } = await cliente.from('accesos_profesionales').update({ notas: notas || null }).eq('email', a.email);
    if (error) return setMensaje({ tipo: 'error', texto: mensajeDeError(error) });
    setAccesos((lista) => lista.map((x) => (x.email === a.email ? { ...x, notas } : x)));
  }

  if (cargando) {
    return (
      <p className="flex items-center gap-2 text-tinta/60">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Cargando accesos…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <FormularioNuevo zonas={zonas} onAgregado={(texto) => { setMensaje({ tipo: 'ok', texto }); cargar(); }} onError={(texto) => setMensaje({ tipo: 'error', texto })} />

      <section className="bg-white rounded-2xl border border-hpc/10 p-5 md:p-7 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-hpc">Cuentas del equipo</h2>
            <p className="text-sm text-tinta/65">
              {cantidadHabilitados} con acceso de {accesos.length} cargadas. <strong>Acceso</strong>: puede entrar a editar su ficha.{' '}
              <strong>En el portal</strong>: su ficha aparece en el directorio público (si la autorizó).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="relative flex-1 min-w-[220px]">
            <span className="sr-only">Buscar por nombre o correo</span>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o correo"
              className="w-full rounded-lg border border-hpc/20 bg-white pl-9 pr-3 py-2.5 text-[15px] focus:border-hpc focus:outline-none focus:ring-2 focus:ring-hpc/20"
            />
          </label>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            aria-label="Filtrar"
            className="rounded-lg border border-hpc/20 bg-white px-3 py-2.5 text-[15px]"
          >
            <option value="todos">Todos</option>
            <option value="habilitados">Con acceso</option>
            <option value="deshabilitados">Sin acceso</option>
          </select>
        </div>

        {mensaje && (
          <p role="status" className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${mensaje.tipo === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {mensaje.tipo === 'ok' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
            {mensaje.texto}
          </p>
        )}

        <ul className="divide-y divide-hpc/10">
          {visibles.map((a) => (
            <li key={a.email} className="py-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <p className="font-medium text-hpc">{a.nombre ?? '(sin nombre)'}</p>
                <p className="text-sm text-tinta/70 break-all">{a.email}</p>
                <p className="text-xs text-tinta/55 mt-0.5">
                  {nombreZona(a.zona_id)} ·{' '}
                  {a.primer_ingreso
                    ? `Ingresó el ${new Date(a.primer_ingreso).toLocaleDateString('es-AR')}`
                    : 'Todavía no ingresó'}
                </p>
                <input
                  defaultValue={a.notas ?? ''}
                  onBlur={(e) => guardarNotas(a, e.target.value.trim())}
                  placeholder="Notas internas (ej.: confirmado por Laura)"
                  aria-label={`Notas sobre ${a.nombre ?? a.email}`}
                  className="mt-2 w-full max-w-md rounded-lg border border-transparent bg-crema/60 px-2 py-1.5 text-sm hover:border-hpc/20 focus:border-hpc focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Interruptor
                  etiqueta="Acceso"
                  activo={a.habilitado}
                  ocupado={guardandoEmail === a.email}
                  onCambiar={(v) => cambiarAcceso(a, v)}
                />
                <Interruptor
                  etiqueta="En el portal"
                  activo={a.profesionales?.activo ?? false}
                  ocupado={guardandoEmail === a.email}
                  deshabilitado={!a.profesional_id}
                  ayuda={!a.profesional_id ? 'Sin ficha todavía' : undefined}
                  onCambiar={(v) => cambiarVisibilidad(a, v)}
                />
              </div>
            </li>
          ))}
          {visibles.length === 0 && <li className="py-6 text-sm text-tinta/60">No hay cuentas que coincidan.</li>}
        </ul>
      </section>
    </div>
  );
}

// ---------- Alta de un correo nuevo ----------

function FormularioNuevo({ zonas, onAgregado, onError }: { zonas: ItemCatalogo[]; onAgregado: (t: string) => void; onError: (t: string) => void }) {
  const cliente = obtenerCliente()!;
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [zona, setZona] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function agregar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const correo = email.trim().toLowerCase(); // la base exige minúsculas
    const { error } = await cliente
      .from('accesos_profesionales')
      .insert({ email: correo, nombre: nombre.trim() || null, zona_id: zona || null, habilitado: true });
    setGuardando(false);
    if (error) {
      // 23505 = clave duplicada: ese correo ya estaba cargado.
      return onError(error.code === '23505' ? 'Ese correo ya está cargado: buscalo en la lista y activale el acceso.' : mensajeDeError(error));
    }
    setEmail('');
    setNombre('');
    setZona('');
    onAgregado(`${correo} agregado con acceso. Ya puede entrar a #profesionales con su correo.`);
  }

  return (
    <form onSubmit={agregar} className="bg-white rounded-2xl border border-hpc/10 p-5 md:p-7 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-hpc">Agregar profesional</h2>
        <p className="text-sm text-tinta/65">Queda con acceso apenas lo guardás. La ficha se crea sola cuando ingresa por primera vez.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1.3fr_1.3fr_1fr_auto] md:items-end">
        <label className="block">
          <span className="text-sm font-medium">Correo</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-lg border border-hpc/20 px-3 py-2.5 text-[15px] focus:border-hpc focus:outline-none focus:ring-2 focus:ring-hpc/20" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Nombre</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Lic. Nombre Apellido" className="mt-1 block w-full rounded-lg border border-hpc/20 px-3 py-2.5 text-[15px] focus:border-hpc focus:outline-none focus:ring-2 focus:ring-hpc/20" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Zona</span>
          <select value={zona} onChange={(e) => setZona(e.target.value)} className="mt-1 block w-full rounded-lg border border-hpc/20 bg-white px-3 py-2.5 text-[15px]">
            <option value="">Sin zona / online</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={guardando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-hpc px-5 py-3 text-sm font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-60">
          {guardando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
          Agregar
        </button>
      </div>
    </form>
  );
}

// ---------- Interruptor accesible (role="switch") ----------

function Interruptor({ etiqueta, activo, ocupado, deshabilitado, ayuda, onCambiar }: { etiqueta: string; activo: boolean; ocupado?: boolean; deshabilitado?: boolean; ayuda?: string; onCambiar: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={etiqueta}
        disabled={ocupado || deshabilitado}
        onClick={() => onCambiar(!activo)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40 ${activo ? 'bg-hpc' : 'bg-tinta/20'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${activo ? 'left-6' : 'left-1'}`} />
      </button>
      <span className="text-sm leading-tight">
        <span className="block font-medium text-tinta">{etiqueta}</span>
        <span className="block text-xs text-tinta/55">{ayuda ?? (activo ? 'Sí' : 'No')}</span>
      </span>
    </div>
  );
}
