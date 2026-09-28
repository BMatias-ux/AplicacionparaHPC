// src/lib/supabase.ts
// Lectura de las fichas públicas desde Supabase.
//
// Usamos la API REST que Supabase expone automáticamente (PostgREST) con fetch nativo,
// sin instalar el SDK: para una sola lectura pública alcanza y el portal sigue liviano.
//   GET {SUPABASE_URL}/rest/v1/fichas_publicas?select=*&order=nombre_publico
//   Cabecera: apikey: {ANON_KEY}
//
// ¿Es seguro poner la anon key en el navegador? Sí: está hecha para eso. Lo que protege
// los datos no es esconder la clave sino las políticas RLS de la base: con la anon key
// sólo se puede leer la vista fichas_publicas y los catálogos (ver supabase/migrations).
// La que NUNCA puede ir al navegador es la service_role key.
//
// Variables (Vercel → Settings → Environment Variables, y .env.local para desarrollo):
//   VITE_SUPABASE_URL       https://xxxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY  eyJ...
// El prefijo VITE_ es obligatorio: Vite sólo expone al navegador las variables que lo tienen.

export interface FichaPublica {
  id: string;
  nombre_publico: string;
  especialidad: string;
  especialidad_id: string;
  zona: string | null;
  zona_id: string | null;
  provincia: string | null;
  online: boolean;
  presencial: boolean;
  foto_url: string | null;
  presentacion: string | null;
  biografia: string | null;
  propuesta_valor: string | null;
  frase: string | null;
  idiomas: string[];
  tematicas: string[];
  enfoques: string[];
  poblaciones: string[];
}

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true si el portal tiene configurada la conexión a Supabase. */
export const supabaseConfigurado = Boolean(URL_BASE && ANON_KEY);

export async function leerFichasPublicas(senal?: AbortSignal): Promise<FichaPublica[]> {
  if (!supabaseConfigurado) return [];
  const respuesta = await fetch(`${URL_BASE}/rest/v1/fichas_publicas?select=*&order=nombre_publico`, {
    headers: { apikey: ANON_KEY!, Authorization: `Bearer ${ANON_KEY}` },
    signal: senal,
  });
  if (!respuesta.ok) {
    throw new Error(`Supabase respondió ${respuesta.status}`);
  }
  return respuesta.json();
}
