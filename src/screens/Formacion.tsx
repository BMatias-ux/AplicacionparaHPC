// src/screens/Formacion.tsx
// Propuestas para profesionales. Es también el lugar donde, en una etapa futura,
// va a estar el botón "Ingresar" al acceso independiente para profesionales.

import { Lock } from 'lucide-react';
import { SERVICIOS_PROFESIONALES } from '../content';
import { TarjetaServicio } from '../components/TarjetaServicio';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';

export function Formacion() {
  return (
    <div className="space-y-8">
      <EncabezadoSeccion
        antetitulo="Para profesionales"
        titulo="Formación y equipo"
        bajada="Formación clínica basada en la evidencia para psicólogos, profesionales de la salud mental y estudiantes avanzados."
      />

      <div className="grid gap-4 md:grid-cols-2 items-start">
        {SERVICIOS_PROFESIONALES.map((s) => (
          <TarjetaServicio key={s.id} servicio={s} />
        ))}
      </div>

      {/* Anticipo del acceso para profesionales (Etapa futura). No es un login: sólo avisa. */}
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-hpc/25 p-5 text-sm text-tinta/70">
        <Lock size={18} className="mt-0.5 shrink-0 text-dorado" aria-hidden="true" />
        <p>
          <span className="font-semibold text-hpc">Próximamente: acceso para profesionales de la red.</span>{' '}
          Un espacio propio para ver derivaciones, cupos y mantener tu ficha actualizada.
        </p>
      </div>
    </div>
  );
}
