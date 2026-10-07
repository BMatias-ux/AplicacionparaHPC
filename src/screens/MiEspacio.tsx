// src/screens/MiEspacio.tsx
// "Mi espacio": la cuenta del paciente (Etapa A, 07/10/2026).
//
// Enlace para compartir: https://portal.habilidadesparaelcambio.com.ar/#mi-espacio
//
// Flujo:
//   Sin sesión            -> IngresoPaciente (Google, código por correo o contraseña)
//   Con sesión, sin perfil -> CompletarPerfil (nombre, contacto opcional, aceptar el aviso)
//   Con sesión y perfil   -> PanelPaciente (Inicio con avisos, Ánimo, Ejercicios, Turnos, Mis datos)
//
// Cualquier persona puede crearse una cuenta (registro abierto). Qué ve y qué puede editar cada
// una lo decide la base con RLS (migración 20261007000009): un paciente sólo lee y escribe SU
// perfil y SU registro de ánimo. Este archivo no protege nada por sí mismo; sólo muestra.
//
// La sesión es la misma que la de la sección Profesionales (mismo cliente y misma storageKey):
// quien ya ingresó en una, ya está adentro en la otra.

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import {
  AlertCircle, Bell, CalendarClock, CheckCircle2, ExternalLink, Frown, Annoyed, Meh, Smile, Laugh,
  KeyRound, Loader2, LogOut, Mail, NotebookPen, Trash2, UserRound, Wind,
} from 'lucide-react';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';
import { BotonWhatsApp } from '../components/BotonWhatsApp';
import { Respiracion } from '../components/Respiracion';
import { Anclaje54321 } from '../components/Anclaje54321';
import { guardarDestino, tomarErrorDeEnlace } from '../lib/enlaceCorreo';
import {
  obtenerCliente,
  aplicarSesionDeCorreo,
  mensajeDeError,
  type AvisoPaciente,
  type ItemCatalogo,
  type PerfilPaciente,
  type RegistroAnimo,
} from '../lib/cliente';

// "Continuar con Google" se muestra sólo cuando el proveedor ya está configurado en Supabase.
// Si se mostrara antes, Google devolvería una página de error. Se prende desde Vercel:
//   app-hpc → Settings → Environment Variables → VITE_GOOGLE_ACTIVO = true (y redeploy).
const GOOGLE_ACTIVO = import.meta.env.VITE_GOOGLE_ACTIVO === 'true';

const claseInput =
  'mt-1 block w-full rounded-lg border border-hpc/20 bg-white px-3 py-2.5 text-[15px] text-tinta focus:border-hpc focus:outline-none focus:ring-2 focus:ring-hpc/20 disabled:bg-crema';

// ============================================================================
// Contenedor: decide qué mostrar según la sesión
// ============================================================================

export function MiEspacio() {
  const cliente = obtenerCliente();
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorEnlace, setErrorEnlace] = useState('');

  useEffect(() => {
    if (!cliente) return;
    (async () => {
      // Si se volvió de Google o del enlace del correo, primero se abre esa sesión.
      const error = (await aplicarSesionDeCorreo(cliente)) ?? tomarErrorDeEnlace();
      if (error) setErrorEnlace(error);
      const { data } = await cliente.auth.getSession();
      setSesion(data.session);
      setCargando(false);
    })();
    const { data } = cliente.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva));
    return () => data.subscription.unsubscribe();
  }, [cliente]);

  return (
    <div className="space-y-8">
      <EncabezadoSeccion
        antetitulo="Tu cuenta"
        titulo="Mi espacio"
        bajada={
          sesion
            ? undefined
            : 'Un lugar privado para tus novedades, ejercicios y tu registro de ánimo. Pronto, también tus turnos.'
        }
      />
      {!cliente ? (
        <Aviso tipo="error">Las cuentas todavía no están disponibles. Escribinos por WhatsApp y te ayudamos.</Aviso>
      ) : cargando ? (
        <Cargando />
      ) : sesion ? (
        <ConSesion cliente={cliente} sesion={sesion} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr] items-start">
          <div className="space-y-4">
            {errorEnlace && <Aviso tipo="error">{errorEnlace}</Aviso>}
            <IngresoPaciente cliente={cliente} />
          </div>
          <QueIncluye />
        </div>
      )}
    </div>
  );
}

/** Lo que gana la persona al crear la cuenta (al lado del formulario de ingreso). */
function QueIncluye() {
  const items = [
    { icono: Bell, titulo: 'Novedades', texto: 'Avisos de la Fundación, talleres y actividades.' },
    { icono: NotebookPen, titulo: 'Registro de ánimo', texto: 'Anotá cómo te sentís y mirá cómo vas. Es privado: sólo lo ves vos.' },
    { icono: Wind, titulo: 'Ejercicios', texto: 'Respiración y anclaje para momentos de ansiedad.' },
    { icono: CalendarClock, titulo: 'Tus turnos', texto: 'Muy pronto vas a poder verlos acá.' },
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map(({ icono: Icono, titulo, texto }) => (
        <li key={titulo} className="bg-white rounded-2xl border border-hpc/10 p-5">
          <Icono className="text-dorado" size={24} aria-hidden="true" />
          <h2 className="mt-2 text-lg font-semibold text-hpc">{titulo}</h2>
          <p className="mt-1 text-sm text-tinta/70">{texto}</p>
        </li>
      ))}
    </ul>
  );
}

// ============================================================================
// Ingreso: Google, código por correo o contraseña
// ============================================================================

function IngresoPaciente({ cliente }: { cliente: SupabaseClient }) {
  const [paso, setPaso] = useState<'inicio' | 'codigo' | 'contrasena'>('inicio');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const correo = () => email.trim().toLowerCase();
  const irA = (nuevo: typeof paso) => {
    setPaso(nuevo);
    setError('');
    setCodigo('');
  };

  async function conGoogle() {
    setError('');
    setEnviando(true);
    // Al volver de Google, Supabase trae la sesión en la dirección (#access_token=...).
    // enlaceCorreo.ts la toma y, gracias a guardarDestino, vuelve a esta sección.
    guardarDestino('mi-espacio');
    const { error } = await cliente.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    // Si salió bien, el navegador ya se está yendo a Google; sólo llegamos acá si falló.
    if (error) {
      setEnviando(false);
      setError(mensajeDeError(error));
    }
  }

  async function pedirCodigo(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    guardarDestino('mi-espacio'); // por si la persona toca el enlace del correo en vez de copiar el código
    const { error } = await cliente.auth.signInWithOtp({
      email: correo(),
      // shouldCreateUser: el primer ingreso crea la cuenta (registro abierto).
      // origen 'pacientes': la base sólo exige "correo habilitado" cuando el origen es 'profesionales'.
      options: { shouldCreateUser: true, data: { origen: 'pacientes' } },
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
    // Si salió bien, onAuthStateChange (en el contenedor) muestra el espacio.
  }

  async function entrarConContrasena(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const { error } = await cliente.auth.signInWithPassword({ email: correo(), password: contrasena });
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
    <div className="bg-white rounded-2xl border border-hpc/10 p-6 md:p-8 space-y-5">
      {paso === 'inicio' && (
        <>
          <div>
            <h2 className="text-xl font-semibold text-hpc">Ingresá o creá tu cuenta</h2>
            <p className="mt-1 text-sm text-tinta/70">Es gratis y te lleva un minuto. Podés usar cualquier correo.</p>
          </div>
          {GOOGLE_ACTIVO && (
            <>
              <button
                type="button"
                onClick={conGoogle}
                disabled={enviando}
                className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-tinta/20 bg-white px-5 py-3 font-semibold text-tinta hover:bg-crema disabled:opacity-60"
              >
                <LogoGoogle />
                Continuar con Google
              </button>
              <p className="flex items-center gap-3 text-xs uppercase tracking-wider text-tinta/45" aria-hidden="true">
                <span className="h-px flex-1 bg-tinta/15" /> o con tu correo <span className="h-px flex-1 bg-tinta/15" />
              </p>
            </>
          )}
          <form onSubmit={pedirCodigo} className="space-y-4">
            {campoCorreo}
            <p className="text-xs text-tinta/60">
              Te mandamos un código desde consultas@habilidadesparaelcambio.com.ar. No hace falta contraseña.
            </p>
            {error && <Aviso tipo="error">{error}</Aviso>}
            <Boton cargando={enviando} icono={<Mail size={18} aria-hidden="true" />}>
              Enviarme el código
            </Boton>
          </form>
          <button type="button" onClick={() => irA('contrasena')} className="w-full text-sm text-hpc underline underline-offset-4">
            Ya tengo contraseña
          </button>
          <p className="text-xs text-tinta/55">
            Al crear tu cuenta aceptás el{' '}
            <a href="#privacidad" className="underline underline-offset-2">aviso de privacidad</a>. Este espacio no
            reemplaza la atención: si estás en una urgencia, mirá los teléfonos en{' '}
            <a href="#contacto" className="underline underline-offset-2">Contacto</a>.
          </p>
        </>
      )}

      {paso === 'codigo' && (
        <form onSubmit={verificar} className="space-y-4">
          <h2 className="text-xl font-semibold text-hpc">Revisá tu correo</h2>
          <p className="text-sm text-tinta/70">
            Enviamos un código a <strong className="break-all">{email}</strong>. Si no llega en un par de minutos, mirá en
            Spam o Promociones.
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
          <button type="button" onClick={() => irA('inicio')} className="w-full text-sm text-hpc underline underline-offset-4">
            Usar otro correo o pedir un código nuevo
          </button>
        </form>
      )}

      {paso === 'contrasena' && (
        <form onSubmit={entrarConContrasena} className="space-y-4">
          <h2 className="text-xl font-semibold text-hpc">Ingresá con tu contraseña</h2>
          {campoCorreo}
          <label className="block">
            <span className="text-sm font-medium text-tinta">Contraseña</span>
            <input type="password" required autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className={claseInput} />
          </label>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <Boton cargando={enviando} icono={<KeyRound size={18} aria-hidden="true" />}>
            Ingresar
          </Boton>
          <button type="button" onClick={() => irA('inicio')} className="w-full text-sm text-hpc underline underline-offset-4">
            Prefiero recibir un código por correo
          </button>
        </form>
      )}
    </div>
  );
}

/** Logo de Google para el botón de ingreso (Google pide usar su logo en estos botones). */
function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// ============================================================================
// Con sesión: perfil (o completarlo) y panel
// ============================================================================

function ConSesion({ cliente, sesion }: { cliente: SupabaseClient; sesion: Session }) {
  const [perfil, setPerfil] = useState<PerfilPaciente | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'sin_perfil' | 'listo' | 'error'>('cargando');

  useEffect(() => {
    // RLS devuelve sólo el perfil propio; el filtro por usuario es por claridad (y porque
    // una cuenta del equipo puede leer más filas).
    cliente
      .from('pacientes')
      .select('id, nombre, email, telefono_portal, zona_id, creado')
      .eq('usuario_id', sesion.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return setEstado('error');
        }
        setPerfil(data as PerfilPaciente | null);
        setEstado(data ? 'listo' : 'sin_perfil');
      });
  }, [cliente, sesion.user.id]);

  const salir = () => cliente.auth.signOut();

  if (estado === 'cargando') return <Cargando />;
  if (estado === 'error') {
    return (
      <div className="space-y-4 max-w-xl">
        <Aviso tipo="error">No pudimos cargar tu espacio. Revisá la conexión y recargá la página.</Aviso>
        <BarraSesion email={sesion.user.email ?? ''} onSalir={salir} />
      </div>
    );
  }
  if (estado === 'sin_perfil' || !perfil) {
    return (
      <CompletarPerfil
        cliente={cliente}
        sesion={sesion}
        onListo={(p) => {
          setPerfil(p);
          setEstado('listo');
        }}
        onSalir={salir}
      />
    );
  }
  return <PanelPaciente cliente={cliente} sesion={sesion} perfil={perfil} onPerfil={setPerfil} onSalir={salir} />;
}

// ---------- Primer ingreso: completar el perfil ----------

function CompletarPerfil({
  cliente, sesion, onListo, onSalir,
}: { cliente: SupabaseClient; sesion: Session; onListo: (p: PerfilPaciente) => void; onSalir: () => void }) {
  const meta = sesion.user.user_metadata ?? {};
  // Si entró con Google, el nombre ya viene en los metadatos.
  const [nombre, setNombre] = useState<string>(String(meta.full_name ?? meta.name ?? ''));
  const [telefono, setTelefono] = useState('');
  const [zona, setZona] = useState('');
  const [mayor, setMayor] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [zonas, setZonas] = useState<ItemCatalogo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cliente.from('zonas').select('id, nombre').order('orden').then(({ data }) => setZonas(data ?? []));
  }, [cliente]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) return setError('Contanos cómo te llamás.');
    if (!mayor) return setError('Para crear la cuenta tenés que tener 18 años o más, o ser el adulto responsable.');
    if (!acepta) return setError('Para continuar tenés que aceptar el aviso de privacidad.');
    setGuardando(true);
    // usuario_id, origen y la fecha de consentimiento los completa la base (trigger
    // proteger_campos_paciente), no el navegador.
    const { data, error } = await cliente
      .from('pacientes')
      .insert({
        nombre: nombre.trim(),
        email: sesion.user.email,
        telefono_portal: telefono.trim() || null,
        zona_id: zona || null,
        mayor_de_edad: true,
      })
      .select('id, nombre, email, telefono_portal, zona_id, creado')
      .single();
    setGuardando(false);
    if (error) return setError(mensajeDeError(error));
    onListo(data as PerfilPaciente);
  }

  return (
    <form onSubmit={guardar} className="max-w-xl bg-white rounded-2xl border border-hpc/10 p-6 md:p-8 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-hpc">¡Bienvenida, bienvenido!</h2>
        <p className="mt-1 text-sm text-tinta/70">Unos pocos datos para armar tu espacio. Sólo el nombre es obligatorio.</p>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-tinta">Nombre y apellido</span>
        <input required autoComplete="name" maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} className={claseInput} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-tinta">WhatsApp (opcional)</span>
          <input type="tel" autoComplete="tel" maxLength={30} value={telefono} onChange={(e) => setTelefono(e.target.value)} className={claseInput} placeholder="387 555-1234" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-tinta">Zona (opcional)</span>
          <select value={zona} onChange={(e) => setZona(e.target.value)} className={claseInput}>
            <option value="">Prefiero no decir</option>
            {zonas.map((z) => (
              <option key={z.id} value={String(z.id)}>{z.nombre}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="space-y-3 rounded-xl bg-hpc-claro/60 p-4 text-sm">
        <Casilla marcada={mayor} onCambiar={setMayor}>
          Tengo 18 años o más (si la cuenta es para un menor, la crea el adulto responsable).
        </Casilla>
        <Casilla marcada={acepta} onCambiar={setAcepta}>
          Leí y acepto el{' '}
          <a href="#privacidad" target="_blank" className="underline underline-offset-2 text-hpc">aviso de privacidad</a>.
        </Casilla>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <Boton cargando={guardando} icono={<CheckCircle2 size={18} aria-hidden="true" />}>
        Crear mi espacio
      </Boton>
      <BarraSesion email={sesion.user.email ?? ''} onSalir={onSalir} />
    </form>
  );
}

// ---------- Panel con pestañas ----------

type Pestana = 'inicio' | 'animo' | 'ejercicios' | 'turnos' | 'datos';
const PESTANAS: [Pestana, string][] = [
  ['inicio', 'Inicio'],
  ['animo', 'Ánimo'],
  ['ejercicios', 'Ejercicios'],
  ['turnos', 'Turnos'],
  ['datos', 'Mis datos'],
];

function PanelPaciente({
  cliente, sesion, perfil, onPerfil, onSalir,
}: { cliente: SupabaseClient; sesion: Session; perfil: PerfilPaciente; onPerfil: (p: PerfilPaciente) => void; onSalir: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('inicio');
  const primerNombre = perfil.nombre.trim().split(/\s+/)[0];

  return (
    <div className="space-y-6">
      <p className="text-xl text-hpc font-display">Hola, {primerNombre}</p>
      <div role="tablist" aria-label="Secciones de mi espacio" className="-mx-4 px-4 overflow-x-auto">
        <div className="inline-flex rounded-xl bg-hpc-claro p-1">
          {PESTANAS.map(([id, texto]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={pestana === id}
              onClick={() => setPestana(id)}
              className={`whitespace-nowrap rounded-lg px-3 md:px-4 py-2 text-[13px] md:text-sm font-medium ${pestana === id ? 'bg-white text-hpc shadow-sm' : 'text-hpc/70 hover:text-hpc'}`}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>

      {pestana === 'inicio' && <InicioPaciente cliente={cliente} onIr={setPestana} />}
      {pestana === 'animo' && <RegistroDeAnimo cliente={cliente} pacienteId={perfil.id} />}
      {pestana === 'ejercicios' && (
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <Respiracion />
          <Anclaje54321 />
        </div>
      )}
      {pestana === 'turnos' && <TurnosProximamente />}
      {pestana === 'datos' && <MisDatos cliente={cliente} sesion={sesion} perfil={perfil} onPerfil={onPerfil} onSalir={onSalir} />}
    </div>
  );
}

// ---------- Inicio: avisos y accesos ----------

function InicioPaciente({ cliente, onIr }: { cliente: SupabaseClient; onIr: (p: Pestana) => void }) {
  const [avisos, setAvisos] = useState<AvisoPaciente[] | null>(null);

  useEffect(() => {
    // RLS ya filtra: activos, vigentes y (para todos o para mí).
    cliente
      .from('avisos')
      .select('id, titulo, cuerpo, enlace, texto_enlace, paciente_id, desde')
      .order('desde', { ascending: false })
      .limit(10)
      .then(({ data }) => setAvisos((data ?? []) as AvisoPaciente[]));
  }, [cliente]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem] items-start">
      <section aria-labelledby="titulo-avisos" className="space-y-3">
        <h2 id="titulo-avisos" className="flex items-center gap-2 text-xl font-semibold text-hpc">
          <Bell size={20} className="text-dorado" aria-hidden="true" /> Novedades
        </h2>
        {avisos === null ? (
          <Cargando />
        ) : avisos.length === 0 ? (
          <p className="text-sm text-tinta/60">No hay novedades por ahora.</p>
        ) : (
          <ul className="space-y-3">
            {avisos.map((a) => (
              <li key={a.id} className={`bg-white rounded-2xl border p-5 ${a.paciente_id ? 'border-dorado/60' : 'border-hpc/10'}`}>
                {a.paciente_id && <p className="text-xs font-semibold uppercase tracking-wider text-dorado">Para vos</p>}
                <h3 className="text-lg font-semibold text-hpc">{a.titulo}</h3>
                {a.cuerpo && <p className="mt-1 text-sm text-tinta/75 whitespace-pre-line">{a.cuerpo}</p>}
                {a.enlace && (
                  <a href={a.enlace} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-hpc underline underline-offset-4">
                    {a.texto_enlace || 'Ver más'} <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <aside className="space-y-3">
        <button type="button" onClick={() => onIr('animo')} className="w-full text-left bg-white rounded-2xl border border-hpc/10 p-5 hover:border-hpc/40">
          <NotebookPen className="text-dorado" size={22} aria-hidden="true" />
          <span className="mt-2 block text-lg font-semibold text-hpc">¿Cómo estás hoy?</span>
          <span className="block text-sm text-tinta/70">Anotalo en tu registro de ánimo.</span>
        </button>
        <button type="button" onClick={() => onIr('ejercicios')} className="w-full text-left bg-white rounded-2xl border border-hpc/10 p-5 hover:border-hpc/40">
          <Wind className="text-dorado" size={22} aria-hidden="true" />
          <span className="mt-2 block text-lg font-semibold text-hpc">Un minuto para vos</span>
          <span className="block text-sm text-tinta/70">Respiración 4-7-8 y anclaje 5-4-3-2-1.</span>
        </button>
        <BotonWhatsApp motivo="paciente" texto="Consultar al equipo" ancho />
      </aside>
    </div>
  );
}

// ---------- Registro de ánimo ----------

const ANIMOS = [
  { valor: 1, texto: 'Muy mal', icono: Frown },
  { valor: 2, texto: 'Mal', icono: Annoyed },
  { valor: 3, texto: 'Regular', icono: Meh },
  { valor: 4, texto: 'Bien', icono: Smile },
  { valor: 5, texto: 'Muy bien', icono: Laugh },
] as const;

const EMOCIONES = [
  'Tranquilidad', 'Alegría', 'Gratitud', 'Esperanza', 'Cansancio', 'Ansiedad',
  'Tristeza', 'Enojo', 'Miedo', 'Soledad', 'Frustración', 'Culpa',
];

function RegistroDeAnimo({ cliente, pacienteId }: { cliente: SupabaseClient; pacienteId: string }) {
  const [registros, setRegistros] = useState<RegistroAnimo[] | null>(null);
  const [animo, setAnimo] = useState<number | null>(null);
  const [emociones, setEmociones] = useState<string[]>([]);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [ultimoGuardado, setUltimoGuardado] = useState<number | null>(null);

  async function cargar() {
    const { data, error } = await cliente
      .from('registros_animo')
      .select('id, fecha, animo, emociones, nota')
      .order('fecha', { ascending: false })
      .limit(60);
    if (error) {
      console.error(error);
      setRegistros([]);
      return setMensaje({ tipo: 'error', texto: 'No pudimos cargar tus registros.' });
    }
    setRegistros((data ?? []) as RegistroAnimo[]);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);

  const alternar = (e: string) =>
    setEmociones((lista) => (lista.includes(e) ? lista.filter((x) => x !== e) : [...lista, e]));

  async function guardar(ev: FormEvent) {
    ev.preventDefault();
    setMensaje(null);
    if (!animo) return setMensaje({ tipo: 'error', texto: 'Elegí cómo te sentís.' });
    setGuardando(true);
    const { error } = await cliente
      .from('registros_animo')
      .insert({ paciente_id: pacienteId, animo, emociones, nota: nota.trim() || null });
    setGuardando(false);
    if (error) return setMensaje({ tipo: 'error', texto: mensajeDeError(error) });
    setUltimoGuardado(animo);
    setAnimo(null);
    setEmociones([]);
    setNota('');
    setMensaje({ tipo: 'ok', texto: 'Guardado. Gracias por tomarte este momento.' });
    cargar();
  }

  async function borrar(id: number) {
    const { error } = await cliente.from('registros_animo').delete().eq('id', id);
    if (error) return setMensaje({ tipo: 'error', texto: mensajeDeError(error) });
    setRegistros((r) => (r ?? []).filter((x) => x.id !== id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr] items-start">
      <form onSubmit={guardar} className="bg-white rounded-2xl border border-hpc/10 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-hpc">¿Cómo te sentís ahora?</h2>
          <p className="mt-1 text-xs text-tinta/60">Es privado: sólo lo ves vos. El equipo no tiene acceso a este registro.</p>
        </div>
        <div className="grid grid-cols-5 gap-2" role="group" aria-label="Cómo te sentís">
          {ANIMOS.map(({ valor, texto, icono: Icono }) => (
            <button
              key={valor}
              type="button"
              aria-pressed={animo === valor}
              onClick={() => setAnimo(valor)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-3 text-[11px] font-medium ${
                animo === valor ? 'border-hpc bg-hpc text-crema' : 'border-hpc/15 text-hpc hover:border-hpc/40'
              }`}
            >
              <Icono size={26} aria-hidden="true" />
              {texto}
            </button>
          ))}
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-tinta">¿Qué emociones aparecen? (opcional)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {EMOCIONES.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={emociones.includes(e)}
                onClick={() => alternar(e)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  emociones.includes(e) ? 'border-hpc bg-hpc-claro text-hpc font-medium' : 'border-tinta/15 text-tinta/70'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="text-sm font-medium text-tinta">Una nota para vos (opcional)</span>
          <textarea rows={3} maxLength={2000} value={nota} onChange={(e) => setNota(e.target.value)} className={claseInput} placeholder="¿Qué pasó hoy? ¿Qué te ayudó?" />
        </label>
        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
        {ultimoGuardado !== null && ultimoGuardado <= 2 && (
          <div className="rounded-xl bg-crema p-4 text-sm text-tinta/80 space-y-3">
            <p>
              Gracias por registrarlo. Si estás pasando un momento difícil, no tenés que atravesarlo en soledad:
              escribile al equipo o hablá con alguien de confianza. Si es una urgencia, mirá los teléfonos en{' '}
              <a href="#contacto" className="underline underline-offset-2 text-hpc">Contacto</a>.
            </p>
            <BotonWhatsApp motivo="paciente" texto="Escribir al equipo" variante="suave" />
          </div>
        )}
        <Boton cargando={guardando} icono={<NotebookPen size={18} aria-hidden="true" />}>
          Guardar registro
        </Boton>
      </form>

      <section aria-labelledby="titulo-historial" className="space-y-4">
        <h2 id="titulo-historial" className="text-xl font-semibold text-hpc">Tu recorrido</h2>
        {registros === null ? (
          <Cargando />
        ) : registros.length === 0 ? (
          <p className="text-sm text-tinta/60">Todavía no hay registros. El primero aparece acá apenas lo guardes.</p>
        ) : (
          <>
            <GraficoAnimo registros={registros} />
            <ul className="space-y-2">
              {registros.slice(0, 20).map((r) => {
                const a = ANIMOS.find((x) => x.valor === r.animo)!;
                return (
                  <li key={r.id} className="bg-white rounded-xl border border-hpc/10 p-4 flex gap-3">
                    <a.icono size={22} className="shrink-0 text-hpc mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <strong className="text-hpc">{a.texto}</strong>{' '}
                        <span className="text-tinta/55">· {formatearFecha(r.fecha)}</span>
                      </p>
                      {r.emociones.length > 0 && <p className="text-xs text-tinta/65 mt-0.5">{r.emociones.join(' · ')}</p>}
                      {r.nota && <p className="text-sm text-tinta/80 mt-1 whitespace-pre-line break-words">{r.nota}</p>}
                    </div>
                    <button type="button" onClick={() => borrar(r.id)} aria-label="Borrar este registro" className="shrink-0 self-start text-tinta/40 hover:text-red-700">
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

/** Barras de los últimos 14 días: el promedio de cada día (los días sin registro quedan vacíos). */
function GraficoAnimo({ registros }: { registros: RegistroAnimo[] }) {
  const dias = useMemo(() => {
    const hoy = new Date();
    const lista: { clave: string; etiqueta: string; promedio: number | null }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      const clave = d.toDateString();
      const delDia = registros.filter((r) => new Date(r.fecha).toDateString() === clave);
      const promedio = delDia.length ? delDia.reduce((s, r) => s + r.animo, 0) / delDia.length : null;
      lista.push({ clave, etiqueta: d.toLocaleDateString('es-AR', { day: 'numeric' }), promedio });
    }
    return lista;
  }, [registros]);

  const conDatos = dias.filter((d) => d.promedio !== null).length;

  return (
    <figure className="bg-white rounded-2xl border border-hpc/10 p-5">
      <figcaption className="text-sm font-medium text-tinta">Últimos 14 días</figcaption>
      <div className="mt-4 flex items-end gap-1.5 h-28" role="img" aria-label={`Ánimo de los últimos 14 días: ${conDatos} días con registro`}>
        {dias.map((d) => (
          <div key={d.clave} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <div
              className={`w-full rounded-t-md ${d.promedio === null ? 'bg-tinta/5' : 'bg-hpc'}`}
              style={{ height: d.promedio === null ? '4px' : `${(d.promedio / 5) * 100}%` }}
              title={d.promedio === null ? 'Sin registro' : `Promedio ${d.promedio.toFixed(1)} de 5`}
            />
            <span className="text-[10px] text-tinta/50">{d.etiqueta}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-tinta/55">Más alta la barra, mejor el ánimo de ese día (promedio de 1 a 5).</p>
    </figure>
  );
}

// ---------- Turnos (Etapa B) ----------

function TurnosProximamente() {
  return (
    <div className="max-w-xl bg-white rounded-2xl border border-hpc/10 p-6 md:p-8 space-y-4">
      <CalendarClock className="text-dorado" size={28} aria-hidden="true" />
      <h2 className="text-xl font-semibold text-hpc">Tus turnos, muy pronto acá</h2>
      <p className="text-sm text-tinta/75 leading-relaxed">
        Estamos preparando esta sección para que veas tus turnos y prestaciones. Mientras tanto, para pedir, confirmar o
        cambiar un turno, escribile al equipo por WhatsApp.
      </p>
      <BotonWhatsApp motivo="paciente" texto="Escribir por un turno" />
    </div>
  );
}

// ---------- Mis datos ----------

function MisDatos({
  cliente, sesion, perfil, onPerfil, onSalir,
}: { cliente: SupabaseClient; sesion: Session; perfil: PerfilPaciente; onPerfil: (p: PerfilPaciente) => void; onSalir: () => void }) {
  const [nombre, setNombre] = useState(perfil.nombre);
  const [telefono, setTelefono] = useState(perfil.telefono_portal ?? '');
  const [zona, setZona] = useState(perfil.zona_id ?? '');
  const [zonas, setZonas] = useState<ItemCatalogo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const tieneContrasena = Boolean(sesion.user.user_metadata?.tiene_contrasena);
  const conGoogle = sesion.user.app_metadata?.provider === 'google';

  useEffect(() => {
    cliente.from('zonas').select('id, nombre').order('orden').then(({ data }) => setZonas(data ?? []));
  }, [cliente]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setMensaje(null);
    if (!nombre.trim()) return setMensaje({ tipo: 'error', texto: 'El nombre no puede quedar vacío.' });
    setGuardando(true);
    const { data, error } = await cliente
      .from('pacientes')
      .update({ nombre: nombre.trim(), telefono_portal: telefono.trim() || null, zona_id: zona || null })
      .eq('id', perfil.id)
      .select('id, nombre, email, telefono_portal, zona_id, creado')
      .single();
    setGuardando(false);
    if (error) return setMensaje({ tipo: 'error', texto: mensajeDeError(error) });
    onPerfil(data as PerfilPaciente);
    setMensaje({ tipo: 'ok', texto: 'Tus datos quedaron actualizados.' });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <form onSubmit={guardar} className="bg-white rounded-2xl border border-hpc/10 p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-hpc">
          <UserRound size={20} className="text-dorado" aria-hidden="true" /> Mis datos
        </h2>
        <label className="block">
          <span className="text-sm font-medium text-tinta">Nombre y apellido</span>
          <input required maxLength={120} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} className={claseInput} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-tinta">WhatsApp</span>
          <input type="tel" maxLength={30} autoComplete="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={claseInput} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-tinta">Zona</span>
          <select value={zona} onChange={(e) => setZona(e.target.value)} className={claseInput}>
            <option value="">Prefiero no decir</option>
            {zonas.map((z) => (
              <option key={z.id} value={String(z.id)}>{z.nombre}</option>
            ))}
          </select>
        </label>
        <p className="text-sm text-tinta/70">
          Correo: <strong className="break-all">{sesion.user.email}</strong>
          {conGoogle && <span className="block text-xs text-tinta/55">Ingresás con tu cuenta de Google.</span>}
        </p>
        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
        <Boton cargando={guardando} icono={<CheckCircle2 size={18} aria-hidden="true" />}>
          Guardar cambios
        </Boton>
      </form>

      <div className="space-y-6">
        {!conGoogle && <Contrasena cliente={cliente} email={sesion.user.email ?? ''} tieneContrasena={tieneContrasena} />}
        <BarraSesion email={sesion.user.email ?? ''} onSalir={onSalir} />
        <BorrarCuenta cliente={cliente} />
      </div>
    </div>
  );
}

/** Contraseña opcional: así no hace falta esperar un código cada vez. */
function Contrasena({ cliente, email, tieneContrasena }: { cliente: SupabaseClient; email: string; tieneContrasena: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setMensaje(null);
    if (nueva.length < 8) return setMensaje({ tipo: 'error', texto: 'La contraseña tiene que tener al menos 8 caracteres.' });
    if (nueva !== repetida) return setMensaje({ tipo: 'error', texto: 'Las dos contraseñas no coinciden.' });
    setGuardando(true);
    const { error } = await cliente.auth.updateUser({ password: nueva, data: { tiene_contrasena: true } });
    setGuardando(false);
    if (error) return setMensaje({ tipo: 'error', texto: mensajeDeError(error) });
    setNueva('');
    setRepetida('');
    setAbierta(false);
    setMensaje({ tipo: 'ok', texto: 'Listo: la próxima vez podés entrar con tu correo y tu contraseña.' });
  }

  return (
    <div className="bg-white rounded-2xl border border-hpc/10 p-6 space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-hpc">
        <KeyRound size={18} className="text-dorado" aria-hidden="true" /> Contraseña
      </h2>
      {!abierta ? (
        <>
          <p className="text-sm text-tinta/70">
            {tieneContrasena
              ? 'Ya tenés una contraseña. Si querés, la podés cambiar.'
              : 'Es opcional: con una contraseña entrás sin esperar el código por correo.'}
          </p>
          {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
          <button type="button" onClick={() => { setAbierta(true); setMensaje(null); }} className="text-sm font-semibold text-hpc underline underline-offset-4">
            {tieneContrasena ? 'Cambiar contraseña' : 'Crear una contraseña'}
          </button>
        </>
      ) : (
        <form onSubmit={guardar} className="space-y-4">
          <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
          <label className="block">
            <span className="text-sm font-medium text-tinta">Nueva contraseña</span>
            <input type="password" autoComplete="new-password" required minLength={8} value={nueva} onChange={(e) => setNueva(e.target.value)} className={claseInput} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-tinta">Repetila</span>
            <input type="password" autoComplete="new-password" required value={repetida} onChange={(e) => setRepetida(e.target.value)} className={claseInput} />
          </label>
          {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 rounded-xl bg-hpc px-5 py-3 text-sm font-semibold text-crema hover:bg-hpc-oscuro disabled:opacity-60">
              {guardando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <KeyRound size={18} aria-hidden="true" />}
              Guardar contraseña
            </button>
            <button type="button" onClick={() => setAbierta(false)} className="text-sm text-hpc underline underline-offset-4">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Borrar la cuenta en dos pasos (sin ventanas emergentes del navegador): hay que escribir BORRAR. */
function BorrarCuenta({ cliente }: { cliente: SupabaseClient }) {
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState('');

  async function borrar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBorrando(true);
    // La función de la base borra perfil, registros de ánimo y avisos personales, y por último el usuario.
    const { error } = await cliente.rpc('borrar_mi_cuenta');
    if (error) {
      setBorrando(false);
      return setError(mensajeDeError(error));
    }
    // El usuario ya no existe: se cierra la sesión del navegador (local, sin pedirle nada al servidor).
    await cliente.auth.signOut({ scope: 'local' });
    window.location.hash = '#inicio';
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-red-800">
        <Trash2 size={18} aria-hidden="true" /> Borrar mi cuenta
      </h2>
      {!abierto ? (
        <>
          <p className="text-sm text-tinta/70">
            Se borran tu perfil, tus registros de ánimo y tus avisos. No afecta la información de tu atención que la
            Fundación deba conservar por ley.
          </p>
          <button type="button" onClick={() => setAbierto(true)} className="text-sm font-semibold text-red-800 underline underline-offset-4">
            Quiero borrar mi cuenta
          </button>
        </>
      ) : (
        <form onSubmit={borrar} className="space-y-3">
          <label className="block">
            <span className="text-sm text-tinta">Para confirmar, escribí <strong>BORRAR</strong></span>
            <input value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className={claseInput} autoComplete="off" />
          </label>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={confirmacion.trim().toUpperCase() !== 'BORRAR' || borrando}
              className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {borrando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Trash2 size={18} aria-hidden="true" />}
              Borrar definitivamente
            </button>
            <button type="button" onClick={() => { setAbierto(false); setConfirmacion(''); }} className="text-sm text-hpc underline underline-offset-4">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ============================================================================
// Piezas chicas
// ============================================================================

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function BarraSesion({ email, onSalir }: { email: string; onSalir: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-hpc-claro px-4 py-3 text-sm">
      <span className="text-hpc">
        Ingresaste como <strong className="break-all">{email}</strong>
      </span>
      <button type="button" onClick={onSalir} className="inline-flex items-center gap-1.5 text-hpc underline underline-offset-4">
        <LogOut size={16} aria-hidden="true" />
        Salir
      </button>
    </div>
  );
}

function Casilla({ marcada, onCambiar, children }: { marcada: boolean; onCambiar: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={marcada} onChange={(e) => onCambiar(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#0e4f55]" />
      <span className="text-tinta/85">{children}</span>
    </label>
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
