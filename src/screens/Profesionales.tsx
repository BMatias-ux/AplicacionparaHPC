// src/screens/Profesionales.tsx
// Sección "Profesionales": cada profesional del equipo entra con su correo y actualiza su ficha.
//
// Enlace para compartir: https://portal.habilidadesparaelcambio.com.ar/#profesionales
//
// Flujo:
//   Sin sesión  -> Ingreso (correo -> código por correo)
//   Con sesión  -> EditorFicha (ficha pública, agenda con modalidad, datos internos, foto)
//
// Qué puede editar cada uno lo decide la base (RLS, migración 20261001000005). Si alguien
// "toca" el código del navegador para pedir la ficha de otro, la base simplemente no se la da.

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, Mail, KeyRound, Plus, Trash2, Save, CheckCircle2, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';
import { PanelAccesos } from '../components/PanelAccesos';
import { PanelDerivar } from '../components/PanelDerivar';
import { tomarErrorDeEnlace } from '../lib/enlaceCorreo';
import {
  obtenerCliente,
  aplicarSesionDeCorreo,
  mensajeDeError,
  type Ficha,
  type FichaPrivada,
  type Horario,
  type ItemCatalogo,
  type Autorizacion,
  type Modalidad,
} from '../lib/cliente';

// Título y bajada de la pantalla según la pestaña elegida.
type Vista = 'ficha' | 'derivar' | 'accesos';
const ENCABEZADOS: Record<Vista, { titulo: string; bajada: string }> = {
  ficha: {
    titulo: 'Mi ficha',
    bajada: 'Mantené actualizada tu información: es lo que usa admisión para derivarte pacientes y lo que se publica en el portal según lo que autorices.',
  },
  derivar: {
    titulo: 'Derivar',
    bajada: 'Encontrá al profesional indicado para cada paciente según zona, modalidad, población, temática y agenda.',
  },
  accesos: {
    titulo: 'Administrar accesos',
    bajada: 'Quién puede entrar al portal y quién aparece en el directorio público.',
  },
};

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const AUTORIZACIONES: { valor: Autorizacion; texto: string; detalle: string }[] = [
  { valor: 'completo', texto: 'Perfil completo con foto', detalle: 'Nombre, foto, presentación, temáticas y modalidad.' },
  { valor: 'sin_foto', texto: 'Perfil completo sin foto', detalle: 'Todo lo anterior, sin la foto.' },
  { valor: 'solo_nombre', texto: 'Sólo nombre y especialidades', detalle: 'Sin presentación ni foto.' },
  { valor: 'no_publicar', texto: 'No publicar', detalle: 'Tu ficha la ve sólo el equipo de admisión.' },
];

// ============================================================================
// Contenedor: decide si mostrar el ingreso o el editor
// ============================================================================

export function Profesionales() {
  const cliente = obtenerCliente();
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorEnlace, setErrorEnlace] = useState('');
  const [vista, setVista] = useState<Vista>('ficha'); // pestaña elegida: define el título

  useEffect(() => {
    if (!cliente) return;
    // Sesión guardada de una visita anterior (si la hay).
    (async () => {
      // Primero, la sesión del enlace del correo (si se llegó por ahí); después, la guardada.
      const errorEnlace = (await aplicarSesionDeCorreo(cliente)) ?? tomarErrorDeEnlace();
      if (errorEnlace) setErrorEnlace(errorEnlace);
      const { data } = await cliente.auth.getSession();
      setSesion(data.session);
      setCargando(false);
    })();
    // Se dispara al ingresar, al salir y cuando la sesión se renueva sola.
    const { data } = cliente.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva));
    return () => data.subscription.unsubscribe();
  }, [cliente]);

  return (
    <div className="space-y-8">
      <EncabezadoSeccion antetitulo="Equipo profesional" titulo={ENCABEZADOS[sesion ? vista : 'ficha'].titulo} bajada={ENCABEZADOS[sesion ? vista : 'ficha'].bajada} />
      {!cliente ? (
        <Aviso tipo="error">El acceso de profesionales todavía no está configurado. Avisá a coordinación.</Aviso>
      ) : cargando ? (
        <Cargando />
      ) : sesion ? (
        <ZonaConSesion email={sesion.user.email ?? ''} usuarioId={sesion.user.id} tieneContrasena={Boolean(sesion.user.user_metadata?.tiene_contrasena)} onCambiarVista={setVista} />
      ) : (
        <div className="space-y-4">
          {errorEnlace && <Aviso tipo="error">{errorEnlace}</Aviso>}
          <Ingreso />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Con sesión: "Mi ficha" para todos + "Derivar" para el equipo de coordinación
// (admin, admisión, coordinación) + "Administrar accesos" sólo para administradores
// ============================================================================

function ZonaConSesion({ email, usuarioId, tieneContrasena, onCambiarVista }: { email: string; usuarioId: string; tieneContrasena: boolean; onCambiarVista: (v: Vista) => void }) {
  const cliente = obtenerCliente()!;
  const [esAdmin, setEsAdmin] = useState(false);
  const [esEquipo, setEsEquipo] = useState(false); // admin, admisión o coordinación: ve "Derivar"
  // Sin contraseña todavía: se la pedimos arriba de todo. Con contraseña: se puede cambiar desde la barra de sesión.
  const [mostrarContrasena, setMostrarContrasena] = useState(!tieneContrasena);
  const [contrasenaCreada, setContrasenaCreada] = useState(false);
  const [pestana, setPestanaLocal] = useState<Vista>('ficha');
  // Cambia la pestaña y avisa a la pantalla para que actualice el título.
  const setPestana = (v: Vista) => {
    setPestanaLocal(v);
    onCambiarVista(v);
  };

  useEffect(() => {
    // La política "ver mis roles" deja leer sólo los roles propios. Ocultar la pestaña es
    // comodidad visual: lo que de verdad impide a otros administrar es RLS en la base.
    cliente
      .from('usuarios_roles')
      .select('rol')
      .eq('usuario_id', usuarioId)
      .in('rol', ['admin', 'admision', 'coordinacion'])
      .then(({ data }) => {
        const roles = (data ?? []).map((r) => r.rol);
        setEsAdmin(roles.includes('admin'));
        setEsEquipo(roles.length > 0);
      });
  }, [cliente, usuarioId]);

  return (
    <div className="space-y-6">
      {contrasenaCreada && <Aviso tipo="ok">Listo: la próxima vez ingresá con tu correo y tu contraseña.</Aviso>}
      {mostrarContrasena && (
        <TarjetaContrasena
          email={email}
          obligatoria={!tieneContrasena && !contrasenaCreada}
          onListo={() => {
            setMostrarContrasena(false);
            setContrasenaCreada(true);
          }}
        />
      )}
      {!mostrarContrasena && (
        <button type="button" onClick={() => { setMostrarContrasena(true); setContrasenaCreada(false); }} className="text-sm text-hpc underline underline-offset-4">
          Cambiar mi contraseña
        </button>
      )}
      {esEquipo && (
        <div role="tablist" aria-label="Opciones" className="inline-flex rounded-xl bg-hpc-claro p-1">
          {(
            [
              ['ficha', 'Mi ficha'],
              ['derivar', 'Derivar'],
              ...(esAdmin ? ([['accesos', 'Administrar accesos']] as const) : []),
            ] as const
          ).map(([id, texto]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={pestana === id}
              onClick={() => setPestana(id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${pestana === id ? 'bg-white text-hpc shadow-sm' : 'text-hpc/70 hover:text-hpc'}`}
            >
              {texto}
            </button>
          ))}
        </div>
      )}
      {esAdmin && pestana === 'accesos' ? (
        <PanelAccesos />
      ) : esEquipo && pestana === 'derivar' ? (
        <PanelDerivar />
      ) : (
        <EditorFicha email={email} usuarioId={usuarioId} />
      )}
    </div>
  );
}

// ============================================================================
// Ingreso con código por correo
// ============================================================================

function Ingreso() {
  const cliente = obtenerCliente()!;
  // 'contrasena' = correo + contraseña (lo habitual una vez creada)
  // 'correo' / 'codigo' = primer ingreso, o si se olvidó la contraseña
  const [paso, setPaso] = useState<'contrasena' | 'correo' | 'codigo'>('contrasena');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const correo = () => email.trim().toLowerCase();
  const irA = (nuevo: typeof paso) => {
    setPaso(nuevo);
    setError('');
    setCodigo('');
  };

  async function entrarConContrasena(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const { error } = await cliente.auth.signInWithPassword({ email: correo(), password: contrasena });
    setEnviando(false);
    if (error) setError(mensajeDeError(error));
    // Si salió bien, onAuthStateChange (en el contenedor) muestra la ficha.
  }

  async function pedirCodigo(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const { error } = await cliente.auth.signInWithOtp({
      email: correo(),
      // shouldCreateUser: true -> el primer ingreso crea el usuario. La base rechaza los
      // correos que no estén en la lista de habilitados (trigger hpc_validar_correo).
      options: { shouldCreateUser: true },
    });
    setEnviando(false);
    if (error) return setError(mensajeDeError(error));
    setPaso('codigo');
  }

  async function verificar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const { error } = await cliente.auth.verifyOtp({ email: correo(), token: codigo.trim(), type: 'email' });
    setEnviando(false);
    if (error) setError(mensajeDeError(error));
  }

  const campoCorreo = (
    <label className="block">
      <span className="text-sm font-medium text-tinta">Correo electrónico</span>
      <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={claseInput} placeholder="nombre@ejemplo.com" />
    </label>
  );

  return (
    <div className="max-w-md bg-white rounded-2xl border border-hpc/10 p-6 md:p-8">
      {paso === 'contrasena' && (
        <form onSubmit={entrarConContrasena} className="space-y-4">
          <h2 className="text-xl font-semibold text-hpc">Ingresá a tu ficha</h2>
          {campoCorreo}
          <label className="block">
            <span className="text-sm font-medium text-tinta">Contraseña</span>
            <input type="password" required autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className={claseInput} />
          </label>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <Boton cargando={enviando} icono={<KeyRound size={18} aria-hidden="true" />}>
            Ingresar
          </Boton>
          <div className="rounded-xl bg-hpc-claro px-4 py-3 text-sm text-hpc">
            <strong>¿Es tu primera vez o te olvidaste la contraseña?</strong>
            <button type="button" onClick={() => irA('correo')} className="mt-1 block underline underline-offset-4 font-medium">
              Ingresá con un código por correo
            </button>
          </div>
        </form>
      )}

      {paso === 'correo' && (
        <form onSubmit={pedirCodigo} className="space-y-4">
          <h2 className="text-xl font-semibold text-hpc">Ingresá con un código</h2>
          <p className="text-sm text-tinta/70">
            Te mandamos un código desde consultas@habilidadesparaelcambio.com.ar. Usá el correo con el que te registraste en
            la Fundación. Después vas a poder crear tu contraseña.
          </p>
          {campoCorreo}
          {error && <Aviso tipo="error">{error}</Aviso>}
          <Boton cargando={enviando} icono={<Mail size={18} aria-hidden="true" />}>
            Enviarme el código
          </Boton>
          <button type="button" onClick={() => irA('contrasena')} className="w-full text-sm text-hpc underline underline-offset-4">
            Ya tengo contraseña
          </button>
        </form>
      )}

      {paso === 'codigo' && (
        <form onSubmit={verificar} className="space-y-4">
          <h2 className="text-xl font-semibold text-hpc">Revisá tu correo</h2>
          <p className="text-sm text-tinta/70">
            Enviamos un código a <strong>{email}</strong>. Si no llega en un par de minutos, mirá en Spam o Promociones.
          </p>
          <label className="block">
            <span className="text-sm font-medium text-tinta">Código</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              className={`${claseInput} tracking-[0.3em] text-lg text-center placeholder:tracking-normal placeholder:text-base`}
              placeholder="Código del correo"
            />
          </label>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <Boton cargando={enviando} icono={<KeyRound size={18} aria-hidden="true" />}>
            Ingresar
          </Boton>
          <button type="button" onClick={() => irA('correo')} className="w-full text-sm text-hpc underline underline-offset-4">
            Usar otro correo o pedir un código nuevo
          </button>
        </form>
      )}
    </div>
  );
}

// ============================================================================
// Contraseña: se crea después del primer ingreso con código, y se puede cambiar
// ============================================================================

function TarjetaContrasena({ email, obligatoria, onListo }: { email: string; obligatoria: boolean; onListo: () => void }) {
  const cliente = obtenerCliente()!;
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (nueva.length < 8) return setError('La contraseña tiene que tener al menos 8 caracteres.');
    if (nueva !== repetida) return setError('Las dos contraseñas no coinciden.');
    setGuardando(true);
    // updateUser cambia la contraseña del usuario conectado. En "data" guardamos una marca
    // (user_metadata) para saber que ya la creó y no volver a pedírsela.
    const { error } = await cliente.auth.updateUser({ password: nueva, data: { tiene_contrasena: true } });
    setGuardando(false);
    if (error) return setError(mensajeDeError(error));
    onListo();
  }

  return (
    <form onSubmit={guardar} className="rounded-2xl border-2 border-dorado/50 bg-white p-5 md:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-hpc">{obligatoria ? 'Creá tu contraseña' : 'Cambiar contraseña'}</h2>
        <p className="mt-1 text-sm text-tinta/70">
          {obligatoria
            ? 'Así la próxima vez entrás con tu correo y contraseña, sin esperar un código.'
            : 'Mínimo 8 caracteres.'}
        </p>
      </div>
      {/* Correo oculto: le indica al administrador de contraseñas del celular/navegador a qué cuenta
          pertenece, para que ofrezca guardarla y la complete sola la próxima vez. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-tinta">Nueva contraseña</span>
          <input type="password" autoComplete="new-password" required minLength={8} value={nueva} onChange={(e) => setNueva(e.target.value)} className={claseInput} />
          <span className="mt-1 block text-xs text-tinta/55">Mínimo 8 caracteres</span>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-tinta">Repetila</span>
          <input type="password" autoComplete="new-password" required value={repetida} onChange={(e) => setRepetida(e.target.value)} className={claseInput} />
        </label>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 rounded-xl bg-hpc px-5 py-3 text-sm font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-60">
          {guardando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <KeyRound size={18} aria-hidden="true" />}
          Guardar contraseña
        </button>
        {!obligatoria && (
          <button type="button" onClick={onListo} className="text-sm text-hpc underline underline-offset-4">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

// ============================================================================
// Editor de la ficha
// ============================================================================

interface Catalogos {
  zonas: ItemCatalogo[];
  poblaciones: ItemCatalogo[];
  tematicas: ItemCatalogo[];
  enfoques: ItemCatalogo[];
  exclusiones: ItemCatalogo[];
}

interface Seleccion {
  poblaciones: (string | number)[];
  tematicas: (string | number)[];
  enfoques: (string | number)[];
  exclusiones: (string | number)[];
}

// Tabla de relación y nombre de la columna del catálogo, por cada grupo.
const RELACIONES: Record<keyof Seleccion, { tabla: string; columna: string }> = {
  poblaciones: { tabla: 'profesional_poblacion', columna: 'poblacion_id' },
  tematicas: { tabla: 'profesional_tematica', columna: 'tematica_id' },
  enfoques: { tabla: 'profesional_enfoque', columna: 'enfoque_id' },
  exclusiones: { tabla: 'profesional_exclusion', columna: 'exclusion_id' },
};

function EditorFicha({ email, usuarioId }: { email: string; usuarioId: string }) {
  const cliente = obtenerCliente()!;
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [privado, setPrivado] = useState<FichaPrivada | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [seleccion, setSeleccion] = useState<Seleccion>({ poblaciones: [], tematicas: [], enfoques: [], exclusiones: [] });
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'sin_ficha' | 'error'>('cargando');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // ---------- Carga inicial ----------
  useEffect(() => {
    (async () => {
      try {
        // Gracias a RLS, "select * from profesionales" devuelve SÓLO la ficha propia.
        // Se filtra por usuario: un administrador ve TODAS las fichas (RLS), y acá sólo queremos la propia.
        const { data: f, error: e1 } = await cliente.from('profesionales').select('*').eq('usuario_id', usuarioId).maybeSingle();
        if (e1) throw e1;
        if (!f) return setEstado('sin_ficha');

        const [priv, hor, zon, pob, tem, enf, exc, rPob, rTem, rEnf, rExc] = await Promise.all([
          cliente.from('profesionales_privado').select('*').eq('profesional_id', f.id).maybeSingle(),
          cliente.from('profesional_horarios').select('*').eq('profesional_id', f.id).order('dia').order('desde'),
          cliente.from('zonas').select('id, nombre').order('orden'),
          cliente.from('poblaciones').select('id, nombre').order('orden'),
          cliente.from('tematicas').select('id, nombre').order('nombre'),
          cliente.from('enfoques').select('id, nombre').order('nombre'),
          cliente.from('exclusiones').select('id, nombre').order('nombre'),
          cliente.from('profesional_poblacion').select('poblacion_id').eq('profesional_id', f.id),
          cliente.from('profesional_tematica').select('tematica_id').eq('profesional_id', f.id),
          cliente.from('profesional_enfoque').select('enfoque_id').eq('profesional_id', f.id),
          cliente.from('profesional_exclusion').select('exclusion_id').eq('profesional_id', f.id),
        ]);
        const primerError = [priv, hor, zon, pob, tem, enf, exc, rPob, rTem, rEnf, rExc].find((r) => r.error)?.error;
        if (primerError) throw primerError;

        setFicha(f as Ficha);
        setPrivado(priv.data as FichaPrivada | null);
        setHorarios(((hor.data ?? []) as Horario[]).map((h) => ({ ...h, desde: h.desde.slice(0, 5), hasta: h.hasta.slice(0, 5) })));
        setCatalogos({
          zonas: zon.data ?? [],
          poblaciones: pob.data ?? [],
          tematicas: (tem.data ?? []).filter((t) => t.nombre !== '—'),
          enfoques: (enf.data ?? []).filter((t) => t.nombre !== '—'),
          exclusiones: (exc.data ?? []).filter((t) => t.nombre !== '—'),
        });
        setSeleccion({
          poblaciones: (rPob.data ?? []).map((r) => r.poblacion_id),
          tematicas: (rTem.data ?? []).map((r) => r.tematica_id),
          enfoques: (rEnf.data ?? []).map((r) => r.enfoque_id),
          exclusiones: (rExc.data ?? []).map((r) => r.exclusion_id),
        });
        setEstado('listo');
      } catch (err) {
        console.error(err);
        setEstado('error');
      }
    })();
  }, [cliente, usuarioId]);

  const salir = () => cliente.auth.signOut();

  // ---------- Guardar ----------
  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!ficha) return;
    setMensaje(null);

    // Validación de la agenda antes de mandar nada.
    const malHorario = horarios.find((h) => !h.desde || !h.hasta || h.hasta <= h.desde);
    if (malHorario) {
      return setMensaje({ tipo: 'error', texto: `Revisá el horario del ${DIAS[malHorario.dia]}: "hasta" tiene que ser después de "desde".` });
    }

    setGuardando(true);
    try {
      // Modalidad general: se deduce de la agenda si cargó franjas; si no, de las casillas.
      const online = horarios.length ? horarios.some((h) => h.modalidad === 'online') : ficha.online;
      const presencial = horarios.length ? horarios.some((h) => h.modalidad === 'presencial') : ficha.presencial;

      const { error: e1 } = await cliente
        .from('profesionales')
        .update({
          nombre_publico: ficha.nombre_publico.trim(),
          zona_id: ficha.zona_id || null,
          presentacion: vacioANull(ficha.presentacion),
          biografia: vacioANull(ficha.biografia),
          propuesta_valor: vacioANull(ficha.propuesta_valor),
          frase: vacioANull(ficha.frase),
          online,
          presencial,
          edad_minima: ficha.edad_minima,
          edad_maxima: ficha.edad_maxima,
          idiomas: ficha.idiomas,
          autorizacion: ficha.autorizacion,
        })
        .eq('id', ficha.id);
      if (e1) throw e1;

      if (privado) {
        const { error: e2 } = await cliente
          .from('profesionales_privado')
          .update({
            telefono: vacioANull(privado.telefono),
            matricula_nacional: vacioANull(privado.matricula_nacional),
            matricula_provincial: vacioANull(privado.matricula_provincial),
            titulo: vacioANull(privado.titulo),
            universidad: vacioANull(privado.universidad),
            direccion: vacioANull(privado.direccion),
            localidad: vacioANull(privado.localidad),
            autoriza_direccion: privado.autoriza_direccion,
            tiempo_espera: vacioANull(privado.tiempo_espera),
            otras_exclusiones: vacioANull(privado.otras_exclusiones),
          })
          .eq('profesional_id', ficha.id);
        if (e2) throw e2;
      }

      // Relaciones: borrar las propias y volver a insertar lo marcado. Simple y sin duplicados.
      for (const grupo of Object.keys(RELACIONES) as (keyof Seleccion)[]) {
        const { tabla, columna } = RELACIONES[grupo];
        const { error: eb } = await cliente.from(tabla).delete().eq('profesional_id', ficha.id);
        if (eb) throw eb;
        if (seleccion[grupo].length) {
          const filas = seleccion[grupo].map((id) => ({ profesional_id: ficha.id, [columna]: id }));
          const { error: ei } = await cliente.from(tabla).insert(filas);
          if (ei) throw ei;
        }
      }

      // Agenda: mismo criterio.
      const { error: eh } = await cliente.from('profesional_horarios').delete().eq('profesional_id', ficha.id);
      if (eh) throw eh;
      if (horarios.length) {
        const { error: ehi } = await cliente.from('profesional_horarios').insert(
          horarios.map(({ dia, desde, hasta, modalidad, sede }) => ({
            profesional_id: ficha.id,
            dia,
            desde,
            hasta,
            modalidad,
            sede: modalidad === 'presencial' ? vacioANull(sede) : null,
          })),
        );
        if (ehi) throw ehi;
      }

      setFicha({ ...ficha, online, presencial });
      setMensaje({ tipo: 'ok', texto: '¡Listo! Tu ficha quedó guardada.' });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: mensajeDeError(err) });
    } finally {
      setGuardando(false);
    }
  }

  // ---------- Foto ----------
  async function subirFoto(original: File) {
    if (!ficha) return;
    setSubiendoFoto(true);
    setMensaje(null);
    try {
      // Las fotos de celular suelen pesar 3-8 MB: las achicamos en el navegador antes de subir.
      const archivo = await achicarFoto(original);
      if (archivo.size > 3 * 1024 * 1024) {
        throw new Error('La foto pesa más de 3 MB. Probá con una más liviana.');
      }
      const extension = archivo.type === 'image/png' ? 'png' : archivo.type === 'image/webp' ? 'webp' : 'jpg';
      // La carpeta tiene que ser el id de la ficha: así lo exige la política de Storage.
      const ruta = `${ficha.id}/foto.${extension}`;
      const { error } = await cliente.storage
        .from('fotos-profesionales')
        .upload(ruta, archivo, { upsert: true, contentType: archivo.type });
      if (error) throw error;
      const { data } = cliente.storage.from('fotos-profesionales').getPublicUrl(ruta);
      // ?v= evita que el navegador muestre la foto anterior guardada en caché.
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { error: e2 } = await cliente.from('profesionales').update({ foto_url: url }).eq('id', ficha.id);
      if (e2) throw e2;
      setFicha({ ...ficha, foto_url: url });
      setMensaje({ tipo: 'ok', texto: 'Foto actualizada.' });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: mensajeDeError(err) });
    } finally {
      setSubiendoFoto(false);
    }
  }

  // ---------- Pantallas de estado ----------
  if (estado === 'cargando') return <Cargando />;
  if (estado === 'error' || estado === 'sin_ficha' || !ficha || !catalogos) {
    return (
      <div className="space-y-4 max-w-xl">
        <Aviso tipo="error">
          {estado === 'sin_ficha'
            ? 'Tu correo está habilitado pero todavía no tiene una ficha asociada. Avisá a coordinación.'
            : 'No pudimos cargar tu ficha. Revisá la conexión y recargá la página.'}
        </Aviso>
        <BarraSesion email={email} onSalir={salir} />
      </div>
    );
  }

  const cambiarFicha = <K extends keyof Ficha>(campo: K, valor: Ficha[K]) => setFicha({ ...ficha, [campo]: valor });
  const cambiarPrivado = <K extends keyof FichaPrivada>(campo: K, valor: FichaPrivada[K]) =>
    privado && setPrivado({ ...privado, [campo]: valor });
  const alternar = (grupo: keyof Seleccion, id: string | number) =>
    setSeleccion((s) => ({
      ...s,
      [grupo]: s[grupo].includes(id) ? s[grupo].filter((x) => x !== id) : [...s[grupo], id],
    }));

  return (
    <form onSubmit={guardar} className="space-y-6 pb-24">
      <BarraSesion email={email} onSalir={salir} actualizado={ficha.actualizado} />

      {/* 1. Perfil público */}
      <Bloque titulo="Perfil" bajada="Lo que ven las personas en el portal, si lo autorizás más abajo.">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="shrink-0 text-center">
            <div className="w-28 h-28 rounded-2xl bg-hpc-claro overflow-hidden flex items-center justify-center">
              {ficha.foto_url ? (
                <img src={ficha.foto_url} alt="Tu foto actual" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-hpc/40" size={32} aria-hidden="true" />
              )}
            </div>
            <label className="mt-2 inline-flex items-center gap-1 text-sm text-hpc underline underline-offset-4 cursor-pointer">
              {subiendoFoto ? 'Subiendo…' : ficha.foto_url ? 'Cambiar foto' : 'Subir foto'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={subiendoFoto}
                onChange={(e) => e.target.files?.[0] && subirFoto(e.target.files[0])}
              />
            </label>
          </div>
          <div className="flex-1 w-full grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre como querés que aparezca" ayuda='Ej.: "Lic. Paula Puig"' className="sm:col-span-2">
              <input required value={ficha.nombre_publico} onChange={(e) => cambiarFicha('nombre_publico', e.target.value)} className={claseInput} />
            </Campo>
            <Campo etiqueta="Zona / sede principal">
              <select value={ficha.zona_id ?? ''} onChange={(e) => cambiarFicha('zona_id', e.target.value || null)} className={claseInput}>
                <option value="">Sólo online / sin sede</option>
                {catalogos.zonas.map((z) => (
                  <option key={z.id} value={z.id}>{z.nombre}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Idiomas en los que atendés" ayuda="Separados por coma">
              <input
                value={ficha.idiomas.join(', ')}
                onChange={(e) => cambiarFicha('idiomas', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                className={claseInput}
                placeholder="Español, Inglés"
              />
            </Campo>
          </div>
        </div>
        <Campo etiqueta="Presentación breve" ayuda="2 o 3 líneas. Es lo primero que se lee.">
          <textarea rows={3} maxLength={400} value={ficha.presentacion ?? ''} onChange={(e) => cambiarFicha('presentacion', e.target.value)} className={claseInput} />
        </Campo>
        <Campo etiqueta="Biografía / trayectoria">
          <textarea rows={5} value={ficha.biografia ?? ''} onChange={(e) => cambiarFicha('biografia', e.target.value)} className={claseInput} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="¿Qué ofrecés de distinto?">
            <textarea rows={3} value={ficha.propuesta_valor ?? ''} onChange={(e) => cambiarFicha('propuesta_valor', e.target.value)} className={claseInput} />
          </Campo>
          <Campo etiqueta="Una frase que te represente (opcional)">
            <textarea rows={3} value={ficha.frase ?? ''} onChange={(e) => cambiarFicha('frase', e.target.value)} className={claseInput} />
          </Campo>
        </div>
      </Bloque>

      {/* 2. Agenda */}
      <Bloque
        titulo="Días y horarios de atención"
        bajada="Cargá cada franja con su horario exacto y si es presencial u online. Así admisión no te deriva a alguien que no podés atender."
      >
        <EditorHorarios horarios={horarios} onCambiar={setHorarios} />
        {!horarios.length && (
          <div className="flex flex-wrap gap-4 pt-2">
            <Casilla marcada={ficha.online} onCambiar={(v) => cambiarFicha('online', v)}>Atiendo online</Casilla>
            <Casilla marcada={ficha.presencial} onCambiar={(v) => cambiarFicha('presencial', v)}>Atiendo presencial</Casilla>
          </div>
        )}
        <Campo etiqueta="Tiempo de espera aproximado para una primera consulta" ayuda="Ej.: 1 semana, 15 días, sin cupo hasta marzo">
          <input value={privado?.tiempo_espera ?? ''} onChange={(e) => cambiarPrivado('tiempo_espera', e.target.value)} className={claseInput} disabled={!privado} />
        </Campo>
      </Bloque>

      {/* 3. Abordaje */}
      <Bloque titulo="A quién atendés" bajada="Esto es lo que usa admisión para derivarte.">
        <Grupo titulo="Población">
          <Chips items={catalogos.poblaciones} marcados={seleccion.poblaciones} onAlternar={(id) => alternar('poblaciones', id)} />
        </Grupo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Edad mínima que atendés">
            <input type="number" min={0} max={110} value={ficha.edad_minima ?? ''} onChange={(e) => cambiarFicha('edad_minima', e.target.value === '' ? null : Number(e.target.value))} className={claseInput} />
          </Campo>
          <Campo etiqueta="Edad máxima" ayuda="Dejalo vacío si no tenés tope">
            <input type="number" min={0} max={110} value={ficha.edad_maxima ?? ''} onChange={(e) => cambiarFicha('edad_maxima', e.target.value === '' ? null : Number(e.target.value))} className={claseInput} />
          </Campo>
        </div>
        {catalogos.enfoques.length > 0 && (
          <Grupo titulo="Enfoques / marcos de trabajo">
            <Chips items={catalogos.enfoques} marcados={seleccion.enfoques} onAlternar={(id) => alternar('enfoques', id)} />
          </Grupo>
        )}
        {catalogos.tematicas.length > 0 && (
          <Grupo titulo="Temáticas que trabajás">
            <ChipsConBusqueda items={catalogos.tematicas} marcados={seleccion.tematicas} onAlternar={(id) => alternar('tematicas', id)} />
          </Grupo>
        )}
        {catalogos.exclusiones.length > 0 && (
          <Grupo titulo="Casos que NO tomás" ayuda="Es interno: no se publica. Evita derivaciones que no corresponden.">
            <Chips items={catalogos.exclusiones} marcados={seleccion.exclusiones} onAlternar={(id) => alternar('exclusiones', id)} variante="alerta" />
          </Grupo>
        )}
        <Campo etiqueta="Otras aclaraciones sobre casos que no tomás (interno)">
          <textarea rows={2} value={privado?.otras_exclusiones ?? ''} onChange={(e) => cambiarPrivado('otras_exclusiones', e.target.value)} className={claseInput} disabled={!privado} />
        </Campo>
      </Bloque>

      {/* 4. Datos internos */}
      {privado && (
        <Bloque titulo="Datos de contacto y matrícula" bajada="Uso interno de la Fundación. No se publican.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Correo de ingreso">
              <input value={privado.email ?? email} disabled className={`${claseInput} opacity-60`} />
            </Campo>
            <Campo etiqueta="Teléfono / WhatsApp">
              <input type="tel" value={privado.telefono ?? ''} onChange={(e) => cambiarPrivado('telefono', e.target.value)} className={claseInput} />
            </Campo>
            <Campo etiqueta="Título">
              <input value={privado.titulo ?? ''} onChange={(e) => cambiarPrivado('titulo', e.target.value)} className={claseInput} placeholder="Licenciada en Psicología" />
            </Campo>
            <Campo etiqueta="Universidad">
              <input value={privado.universidad ?? ''} onChange={(e) => cambiarPrivado('universidad', e.target.value)} className={claseInput} />
            </Campo>
            <Campo etiqueta="Matrícula nacional">
              <input value={privado.matricula_nacional ?? ''} onChange={(e) => cambiarPrivado('matricula_nacional', e.target.value)} className={claseInput} />
            </Campo>
            <Campo etiqueta="Matrícula provincial">
              <input value={privado.matricula_provincial ?? ''} onChange={(e) => cambiarPrivado('matricula_provincial', e.target.value)} className={claseInput} />
            </Campo>
            <Campo etiqueta="Dirección del consultorio">
              <input value={privado.direccion ?? ''} onChange={(e) => cambiarPrivado('direccion', e.target.value)} className={claseInput} />
            </Campo>
            <Campo etiqueta="Localidad">
              <input value={privado.localidad ?? ''} onChange={(e) => cambiarPrivado('localidad', e.target.value)} className={claseInput} />
            </Campo>
          </div>
          <Casilla marcada={privado.autoriza_direccion} onCambiar={(v) => cambiarPrivado('autoriza_direccion', v)}>
            Autorizo que admisión comparta la dirección del consultorio con pacientes derivados
          </Casilla>
        </Bloque>
      )}

      {/* 5. Autorización */}
      <Bloque titulo="¿Qué se publica en el portal?">
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Autorización de publicación</legend>
          {AUTORIZACIONES.map((a) => (
            <label
              key={a.valor}
              className={`flex gap-3 rounded-xl border p-4 cursor-pointer ${
                ficha.autorizacion === a.valor ? 'border-hpc bg-hpc-claro' : 'border-hpc/15 hover:border-hpc/40'
              }`}
            >
              <input
                type="radio"
                name="autorizacion"
                value={a.valor}
                checked={ficha.autorizacion === a.valor}
                onChange={() => cambiarFicha('autorizacion', a.valor)}
                className="mt-1 accent-[#0e4f55]"
              />
              <span>
                <span className="block font-medium text-hpc">{a.texto}</span>
                <span className="block text-sm text-tinta/65">{a.detalle}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </Bloque>

      {/* Barra de guardado fija abajo (en celular queda sobre la barra de navegación) */}
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-0 md:left-64 z-30 bg-crema/95 backdrop-blur border-t border-hpc/10">
        <div className="mx-auto max-w-6xl px-4 md:px-10 py-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-xl bg-hpc px-5 py-3 text-sm font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-60"
          >
            {guardando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {mensaje && (
            <p role="status" className={`flex items-center gap-2 text-sm ${mensaje.tipo === 'ok' ? 'text-whatsapp' : 'text-red-700'}`}>
              {mensaje.tipo === 'ok' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
              {mensaje.texto}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

// ============================================================================
// Agenda
// ============================================================================

function EditorHorarios({ horarios, onCambiar }: { horarios: Horario[]; onCambiar: (h: Horario[]) => void }) {
  const cambiar = (i: number, cambios: Partial<Horario>) => onCambiar(horarios.map((h, j) => (j === i ? { ...h, ...cambios } : h)));
  const agregar = () => {
    // Propone el día siguiente al último cargado, con la misma franja y modalidad (carga más rápida).
    const ultimo = horarios[horarios.length - 1];
    onCambiar([
      ...horarios,
      ultimo
        ? { ...ultimo, id: undefined, dia: Math.min(ultimo.dia + 1, 7) }
        : { dia: 1, desde: '09:00', hasta: '13:00', modalidad: 'online' as Modalidad, sede: null },
    ]);
  };

  return (
    <div className="space-y-3">
      {horarios.length === 0 && <p className="text-sm text-tinta/60">Todavía no cargaste horarios.</p>}
      {horarios.map((h, i) => (
        <div key={i} className="grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr_1.3fr_auto] gap-2 items-end rounded-xl border border-hpc/10 bg-crema/50 p-3">
          <Campo etiqueta="Día" compacto>
            <select value={h.dia} onChange={(e) => cambiar(i, { dia: Number(e.target.value) })} className={claseInput}>
              {DIAS.slice(1).map((d, n) => (
                <option key={d} value={n + 1}>{d}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Modalidad" compacto>
            <select value={h.modalidad} onChange={(e) => cambiar(i, { modalidad: e.target.value as Modalidad })} className={claseInput}>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </Campo>
          <Campo etiqueta="Desde" compacto>
            <input type="time" required value={h.desde} onChange={(e) => cambiar(i, { desde: e.target.value })} className={claseInput} />
          </Campo>
          <Campo etiqueta="Hasta" compacto>
            <input type="time" required value={h.hasta} onChange={(e) => cambiar(i, { hasta: e.target.value })} className={claseInput} />
          </Campo>
          <button
            type="button"
            onClick={() => onCambiar(horarios.filter((_, j) => j !== i))}
            aria-label={`Quitar franja del ${DIAS[h.dia]}`}
            className="justify-self-end sm:justify-self-auto p-3 rounded-lg text-red-700 hover:bg-red-50 col-start-2 sm:col-start-auto"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
          {h.modalidad === 'presencial' && (
            <div className="col-span-2 sm:col-span-5">
              <Campo etiqueta="Consultorio / sede de esa franja" compacto>
                <input value={h.sede ?? ''} onChange={(e) => cambiar(i, { sede: e.target.value })} className={claseInput} placeholder="Ej.: Consultorio Belgrano 123, Salta" />
              </Campo>
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={agregar} className="inline-flex items-center gap-2 rounded-xl border border-hpc/30 px-4 py-2.5 text-sm font-medium text-hpc hover:bg-hpc-claro">
        <Plus size={18} aria-hidden="true" />
        Agregar franja
      </button>
    </div>
  );
}

// ============================================================================
// Piezas chicas de interfaz
// ============================================================================

const claseInput =
  'mt-1 block w-full rounded-lg border border-hpc/20 bg-white px-3 py-2.5 text-[15px] text-tinta focus:border-hpc focus:outline-none focus:ring-2 focus:ring-hpc/20 disabled:bg-crema';

function vacioANull(v: string | null | undefined) {
  const t = (v ?? '').trim();
  return t === '' ? null : t;
}

function Bloque({ titulo, bajada, children }: { titulo: string; bajada?: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-hpc/10 p-5 md:p-7 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-hpc">{titulo}</h2>
        {bajada && <p className="mt-1 text-sm text-tinta/65">{bajada}</p>}
      </div>
      {children}
    </section>
  );
}

function Campo({ etiqueta, ayuda, children, className = '', compacto = false }: { etiqueta: string; ayuda?: string; children: ReactNode; className?: string; compacto?: boolean }) {
  return (
    <label className={`block ${className}`}>
      <span className={`font-medium text-tinta ${compacto ? 'text-xs' : 'text-sm'}`}>{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-tinta/55">{ayuda}</span>}
    </label>
  );
}

function Grupo({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-tinta">{titulo}</legend>
      {ayuda && <p className="text-xs text-tinta/55">{ayuda}</p>}
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}

function Chips({ items, marcados, onAlternar, variante = 'normal' }: { items: ItemCatalogo[]; marcados: (string | number)[]; onAlternar: (id: string | number) => void; variante?: 'normal' | 'alerta' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const activo = marcados.includes(it.id);
        const color = variante === 'alerta'
          ? activo ? 'bg-red-700 text-white border-red-700' : 'border-red-200 text-red-800 hover:bg-red-50'
          : activo ? 'bg-hpc text-crema border-hpc' : 'border-hpc/20 text-hpc hover:bg-hpc-claro';
        return (
          <button key={it.id} type="button" aria-pressed={activo} onClick={() => onAlternar(it.id)} className={`rounded-full border px-3 py-1.5 text-sm ${color}`}>
            {it.nombre}
          </button>
        );
      })}
    </div>
  );
}

function ChipsConBusqueda(props: { items: ItemCatalogo[]; marcados: (string | number)[]; onAlternar: (id: string | number) => void }) {
  const [filtro, setFiltro] = useState('');
  const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const visibles = useMemo(
    () => (filtro ? props.items.filter((t) => normalizar(t.nombre).includes(normalizar(filtro))) : props.items),
    [filtro, props.items],
  );
  return (
    <div className="space-y-2">
      <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar temática…" className={`${claseInput} max-w-sm`} aria-label="Buscar temática" />
      <p className="text-xs text-tinta/55">{props.marcados.length} seleccionadas</p>
      <Chips {...props} items={visibles} />
    </div>
  );
}

function Casilla({ marcada, onCambiar, children }: { marcada: boolean; onCambiar: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-start gap-2 text-sm text-tinta cursor-pointer">
      <input type="checkbox" checked={marcada} onChange={(e) => onCambiar(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0e4f55]" />
      <span>{children}</span>
    </label>
  );
}

function BarraSesion({ email, onSalir, actualizado }: { email: string; onSalir: () => void; actualizado?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-hpc-claro px-4 py-3 text-sm">
      <span className="text-hpc">
        Ingresaste como <strong className="break-all">{email}</strong>
        {actualizado && (
          <span className="block text-xs text-tinta/60">
            Última actualización: {new Date(actualizado).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        )}
      </span>
      <button type="button" onClick={onSalir} className="inline-flex items-center gap-1.5 text-hpc underline underline-offset-4">
        <LogOut size={16} aria-hidden="true" />
        Salir
      </button>
    </div>
  );
}

function Boton({ cargando, icono, children }: { cargando: boolean; icono: ReactNode; children: ReactNode }) {
  return (
    <button type="submit" disabled={cargando} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-hpc px-5 py-3 font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-60">
      {cargando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : icono}
      {children}
    </button>
  );
}

function Aviso({ tipo, children }: { tipo: 'error' | 'ok'; children: ReactNode }) {
  return (
    <p role="alert" className={`flex gap-2 rounded-xl px-4 py-3 text-sm ${tipo === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
      {tipo === 'ok' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" aria-hidden="true" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />}
      <span>{children}</span>
    </p>
  );
}

function Cargando() {
  return (
    <p className="flex items-center gap-2 text-tinta/60">
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      Cargando…
    </p>
  );
}

// Achica una foto a un máximo de 1200 px por lado y la convierte a JPEG (calidad 0,85).
// Así una foto de celular de varios MB queda en unos 200-400 KB, que es lo que se ve en la ficha.
// Si el navegador no puede leer la imagen (por ejemplo, un formato raro), devuelve el original
// y la validación de tamaño/tipo de Storage decide.
async function achicarFoto(archivo: File): Promise<File> {
  const LADO_MAX = 1200;
  if (archivo.size < 500 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
    return archivo; // ya es liviana: no la tocamos
  }
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAX / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext('2d')!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : archivo;
  } catch {
    return archivo;
  }
}
