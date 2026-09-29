// src/components/Novedades.tsx
// Banners de novedades (ver src/novedades.ts). Mismo lenguaje visual que los banners de
// cursosdepsicologia.com.ar (verde HPC, pastilla dorada, botón dorado), para que el
// ecosistema se vea como uno solo.
//
// La persona puede cerrar un aviso: se recuerda en su navegador (localStorage) para no
// volver a mostrárselo. Si el navegador no deja guardar (modo privado), simplemente
// vuelve a aparecer en la próxima visita: no rompe nada.

import { useState } from 'react';
import { ArrowUpRight, ArrowRight, X } from 'lucide-react';
import { novedadesVigentes, conUtm, type Novedad } from '../novedades';

const CLAVE = 'hpc-novedades-cerradas';

function leerCerradas(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '[]');
  } catch {
    return [];
  }
}

function guardarCerradas(ids: string[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ids));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export function Novedades() {
  const [cerradas, setCerradas] = useState<string[]>(leerCerradas);
  const visibles = novedadesVigentes().filter((n) => !cerradas.includes(n.id));
  if (visibles.length === 0) return null;

  const cerrar = (id: string) => {
    const nuevas = [...cerradas, id];
    setCerradas(nuevas);
    guardarCerradas(nuevas);
  };

  return (
    <div className="space-y-3">
      {visibles.map((n) => (
        <Banner key={n.id} novedad={n} alCerrar={() => cerrar(n.id)} />
      ))}
    </div>
  );
}

function Banner({ novedad: n, alCerrar }: { novedad: Novedad; alCerrar: () => void }) {
  const href = n.externo ? conUtm(n.url, n.campania) : n.url;
  const Flecha = n.externo ? ArrowUpRight : ArrowRight;
  const claro = n.estilo === 'claro';

  return (
    <aside
      aria-label={`${n.etiqueta}: ${n.titulo}`}
      className={`relative overflow-hidden rounded-2xl p-5 pr-12 md:p-6 md:pr-14 ${
        claro ? 'bg-white border border-dorado/40 text-tinta' : 'bg-hpc-oscuro text-crema'
      }`}
    >
      <div
        aria-hidden="true"
        className={`absolute -right-10 -bottom-16 w-48 h-48 rounded-full ${claro ? 'bg-dorado/10' : 'bg-dorado/15'}`}
      />
      <button
        type="button"
        onClick={alCerrar}
        aria-label="Cerrar aviso"
        className={`absolute right-3 top-3 rounded-full p-1.5 ${
          claro ? 'text-tinta/50 hover:bg-hpc/5 hover:text-tinta' : 'text-crema/60 hover:bg-crema/10 hover:text-crema'
        }`}
      >
        <X size={18} aria-hidden="true" />
      </button>

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
              claro ? 'border-dorado/60 text-[#9a6a2c]' : 'border-dorado/60 text-dorado'
            }`}
          >
            {n.etiqueta}
          </span>
          <h2 className={`mt-3 text-2xl font-semibold leading-tight ${claro ? 'text-hpc' : ''}`}>{n.titulo}</h2>
          <p className={`mt-2 text-sm leading-relaxed ${claro ? 'text-tinta/75' : 'text-crema/80'}`}>{n.texto}</p>
        </div>
        <a
          href={href}
          {...(n.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={`relative inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full px-5 py-3 text-sm font-semibold hover:brightness-110 md:self-center ${
            claro ? 'bg-hpc text-crema' : 'bg-dorado text-hpc-oscuro'
          }`}
        >
          {n.cta}
          <Flecha size={16} aria-hidden="true" />
          {n.externo && <span className="sr-only">(se abre en otra pestaña)</span>}
        </a>
      </div>
    </aside>
  );
}
