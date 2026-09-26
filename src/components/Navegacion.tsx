// src/components/Navegacion.tsx
// Un solo menú, dos formas de mostrarse:
// - Celular (< 768 px): barra inferior fija, como una app.
// - Computadora (>= 768 px, prefijo "md:" de Tailwind): barra lateral a la izquierda.
// Es la misma lista de secciones (navegacion.ts), así nunca quedan desincronizadas.

import { SECCIONES, type Seccion } from '../navegacion';
import { Marca } from './Marca';
import { enlacePorMotivo } from '../lib/whatsapp';
import { MessageCircle } from 'lucide-react';

interface Props {
  activa: Seccion;
}

export function BarraLateral({ activa }: Props) {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-hpc text-crema min-h-screen sticky top-0 h-screen p-6">
      <Marca claro />
      <nav aria-label="Secciones" className="mt-10 flex flex-col gap-1">
        {SECCIONES.map(({ id, etiqueta, icono: Icono }) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={activa === id ? 'page' : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activa === id ? 'bg-crema text-hpc' : 'text-crema/80 hover:bg-hpc-oscuro hover:text-crema'
            }`}
          >
            <Icono size={18} aria-hidden="true" />
            {etiqueta}
          </a>
        ))}
      </nav>
      <a
        href={enlacePorMotivo('general')}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
      >
        <MessageCircle size={18} aria-hidden="true" />
        Escribinos por WhatsApp
      </a>
    </aside>
  );
}

export function BarraInferior({ activa }: Props) {
  return (
    <nav
      aria-label="Secciones"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-hpc/10 grid grid-cols-5 pb-[env(safe-area-inset-bottom)]"
    >
      {SECCIONES.map(({ id, etiqueta, icono: Icono }) => (
        <a
          key={id}
          href={`#${id}`}
          aria-current={activa === id ? 'page' : undefined}
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
            activa === id ? 'text-hpc' : 'text-tinta/50'
          }`}
        >
          <Icono size={22} strokeWidth={activa === id ? 2.4 : 1.8} aria-hidden="true" />
          {etiqueta}
        </a>
      ))}
    </nav>
  );
}

/** Encabezado sólo para celular (en computadora la marca está en la barra lateral). */
export function EncabezadoMovil() {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-crema/95 backdrop-blur border-b border-hpc/10 px-4 py-3">
      <Marca />
    </header>
  );
}
