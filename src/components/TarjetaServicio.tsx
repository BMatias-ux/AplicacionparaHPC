// src/components/TarjetaServicio.tsx
// Tarjeta de un servicio. Muestra la bajada siempre y el detalle al tocar "Ver más",
// para que la pantalla no sea un muro de texto en el celular.
// Usa <details>/<summary> del navegador: funciona sin JavaScript y es accesible por teclado.

import { ChevronDown, ExternalLink } from 'lucide-react';
import type { Servicio } from '../content';
import { BotonWhatsApp } from './BotonWhatsApp';

export function TarjetaServicio({ servicio }: { servicio: Servicio }) {
  const { titulo, bajada, detalle, puntos, aviso, motivo, enlace } = servicio;
  return (
    <article className="bg-white rounded-2xl border border-hpc/10 p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-semibold text-hpc">{titulo}</h3>
        <p className="mt-1 text-sm text-tinta/70">{bajada}</p>
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none flex items-center gap-1 text-sm font-semibold text-dorado">
          Ver más
          <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-tinta/80">
          {detalle.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {puntos && (
            <ul className="space-y-1.5 pl-4 list-disc marker:text-dorado">
              {puntos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {aviso && <p className="rounded-xl bg-crema p-3 text-tinta/80">{aviso}</p>}
        </div>
      </details>

      <div className="flex flex-col gap-2">
        <BotonWhatsApp motivo={motivo} ancho />
        {enlace && (
          <a
            href={enlace.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-hpc/20 px-5 py-3 text-sm font-semibold text-hpc hover:bg-hpc-claro"
          >
            {enlace.texto}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}
