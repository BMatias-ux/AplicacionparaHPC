// src/lib/enlaceCorreo.ts
// Toma la sesión que trae el ENLACE del correo de Supabase ("Sign in" / Magic Link).
//
// Al tocar el enlace, Supabase vuelve al portal así:
//   https://portal.../#access_token=...&refresh_token=...&type=magiclink
// o, si el enlace venció:  https://portal.../#error=access_denied&error_description=...
//
// El portal usa el "#" para elegir la sección (navegacion.ts), así que guardamos los tokens,
// dejamos la dirección en #profesionales sin recargar (replaceState) y, cuando se abre esa
// sección, cliente.ts usa estos tokens para abrir la sesión.
// Este archivo NO importa Supabase: se ejecuta al cargar la página y no debe sumar peso.

export interface TokensDeCorreo {
  access_token: string;
  refresh_token: string;
}

let tokens: TokensDeCorreo | null = null;
let errorDeEnlace: string | null = null;

const hash = window.location.hash.replace(/^#/, '');
if (/access_token=|error_description=/.test(hash)) {
  const datos = new URLSearchParams(hash);
  const access_token = datos.get('access_token');
  const refresh_token = datos.get('refresh_token');
  if (access_token && refresh_token) {
    tokens = { access_token, refresh_token };
  } else {
    errorDeEnlace = 'El enlace del correo venció o ya fue usado. Pedí un código nuevo.';
  }
  // Limpia los tokens de la barra de direcciones (y del historial) sin disparar "hashchange".
  history.replaceState(null, '', `${window.location.pathname}#profesionales`);
}

/** Devuelve los tokens una sola vez (después quedan descartados). */
export function tomarTokensDeCorreo(): TokensDeCorreo | null {
  const t = tokens;
  tokens = null;
  return t;
}

/** Mensaje si el enlace vino con error (vencido o usado). Se muestra una sola vez. */
export function tomarErrorDeEnlace(): string | null {
  const e = errorDeEnlace;
  errorDeEnlace = null;
  return e;
}
