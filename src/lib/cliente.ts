// src/lib/cliente.ts
// Cliente oficial de Supabase (@supabase/supabase-js) para la parte CON LOGIN del portal
// (secciones Profesionales y Mi espacio; comparten la misma sesión). La parte pública sigue usando fetch simple (lib/supabase.ts)
// para que quien sólo mira el portal no descargue nada extra... salvo que entre a esta sección:
// el cliente se carga recién cuando se abre (ver import() dinámico en Profesionales.tsx).
//
// Cómo funciona el ingreso (sin contraseñas):
//   1. signInWithOtp({ email })  -> Supabase manda un correo con un código de 6 dígitos.
//   2. verifyOtp({ email, token, type: 'email' }) -> si el código es correcto, queda la sesión abierta.
// La sesión se guarda en el navegador (localStorage) y se renueva sola: el profesional
// no tiene que volver a pedir código cada vez que entra.
//
// Seguridad: la anon key es pública por diseño. Que cada profesional vea y edite SOLO su ficha
// lo garantizan las políticas RLS de la base (migración 20261001000005), no este código.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { tomarTokensDeCorreo } from './enlaceCorreo';

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let cliente: SupabaseClient | null = null;

/** Devuelve el cliente (lo crea una sola vez). null si faltan las variables de entorno. */
export function obtenerCliente(): SupabaseClient | null {
  if (!URL_BASE || !ANON_KEY) return null;
  if (!cliente) {
    cliente = createClient(URL_BASE, ANON_KEY, {
      // detectSessionInUrl: false -> la sesión del enlace del correo la toma enlaceCorreo.ts (ver ese archivo).
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'hpc-portal-sesion', detectSessionInUrl: false },
    });
  }
  return cliente;
}

/** Si se llegó desde el enlace del correo, abre esa sesión. Llamar antes de getSession(). */
export async function aplicarSesionDeCorreo(c: SupabaseClient): Promise<string | null> {
  const t = tomarTokensDeCorreo();
  if (!t) return null;
  const { error } = await c.auth.setSession(t);
  return error ? 'El enlace del correo venció o ya fue usado. Pedí un código nuevo.' : null;
}

/** Traduce los errores de Supabase a mensajes que una persona entiende. */
export function mensajeDeError(error: unknown): string {
  const texto = error instanceof Error ? error.message : String(error ?? '');
  if (/CORREO_NO_HABILITADO|Database error saving new user/i.test(texto)) {
    return 'Este correo no está habilitado. Usá el mismo correo con el que te registraste en la Fundación, o escribile a coordinación para que lo agreguen.';
  }
  if (/CUENTA_DEL_EQUIPO/i.test(texto)) {
    return 'Esta cuenta es del equipo profesional: la baja se hace desde administración. Escribile a coordinación.';
  }
  if (/Invalid login credentials/i.test(texto)) {
    return 'Correo o contraseña incorrectos. Si todavía no creaste tu contraseña, o no la recordás, ingresá con un código por correo.';
  }
  if (/should be different/i.test(texto)) {
    return 'La contraseña nueva tiene que ser distinta de la anterior.';
  }
  if (/Password should be|weak/i.test(texto)) {
    return 'La contraseña es muy débil. Usá al menos 8 caracteres combinando letras y números.';
  }
  if (/reauthenticat/i.test(texto)) {
    return 'Por seguridad, salí e ingresá de nuevo con un código antes de cambiar la contraseña.';
  }
  if (/expired|invalid/i.test(texto) && /otp|token/i.test(texto)) {
    return 'El código no es correcto o ya venció. Pedí uno nuevo.';
  }
  if (/rate limit|security purposes|seconds/i.test(texto)) {
    return 'Ya pediste un código hace muy poco. Esperá un minuto y volvé a intentar.';
  }
  if (/Failed to fetch|NetworkError/i.test(texto)) {
    return 'No hay conexión. Revisá internet y volvé a intentar.';
  }
  return 'Algo salió mal. Volvé a intentar en un momento; si sigue pasando, avisá a coordinación.';
}

// ---------- Tipos de "Mi espacio" (pacientes) ----------

/** Perfil del paciente. El teléfono verificado (de WhatsApp) no se lee ni se escribe desde acá. */
export interface PerfilPaciente {
  id: string;
  nombre: string;
  email: string | null;
  telefono_portal: string | null;
  zona_id: string | null;
  creado: string;
}

export interface RegistroAnimo {
  id: number;
  fecha: string;
  animo: number; // 1 = muy mal ... 5 = muy bien
  emociones: string[];
  nota: string | null;
}

export interface AvisoPaciente {
  id: number;
  titulo: string;
  cuerpo: string | null;
  enlace: string | null;
  texto_enlace: string | null;
  paciente_id: string | null;
  desde: string;
}

// ---------- Tipos de lo que lee/escribe la pantalla ----------

export type Autorizacion = 'completo' | 'sin_foto' | 'solo_nombre' | 'no_publicar';
export type Modalidad = 'presencial' | 'online';

export interface Ficha {
  id: string;
  nombre_publico: string;
  especialidad_id: string;
  zona_id: string | null;
  presentacion: string | null;
  biografia: string | null;
  propuesta_valor: string | null;
  frase: string | null;
  foto_url: string | null;
  online: boolean;
  presencial: boolean;
  edad_minima: number | null;
  edad_maxima: number | null;
  idiomas: string[];
  autorizacion: Autorizacion;
  actualizado: string;
}

export interface FichaPrivada {
  profesional_id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  matricula_nacional: string | null;
  matricula_provincial: string | null;
  titulo: string | null;
  universidad: string | null;
  direccion: string | null;
  localidad: string | null;
  autoriza_direccion: boolean;
  tiempo_espera: string | null;
  otras_exclusiones: string | null;
}

export interface Horario {
  id?: number;
  dia: number; // 1 = lunes ... 7 = domingo
  desde: string; // "14:00"
  hasta: string;
  modalidad: Modalidad;
  sede: string | null;
}

export interface ItemCatalogo {
  id: string | number;
  nombre: string;
}
