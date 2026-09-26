// src/screens/Servicios.tsx
// Tratamientos para pacientes + dónde atendemos.

import { MapPin, Laptop } from 'lucide-react';
import { SERVICIOS_CLINICOS, SEDES } from '../content';
import { TarjetaServicio } from '../components/TarjetaServicio';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';

export function Servicios() {
  return (
    <div className="space-y-10">
      <EncabezadoSeccion
        antetitulo="Para pacientes"
        titulo="Tratamientos"
        bajada="Contanos qué necesitás por WhatsApp y el equipo te deriva al profesional más adecuado. Los valores vigentes te los pasamos por ese medio."
      />

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        {SERVICIOS_CLINICOS.map((s) => (
          <TarjetaServicio key={s.id} servicio={s} />
        ))}
      </div>

      <section aria-labelledby="donde" className="bg-white rounded-2xl border border-hpc/10 p-6">
        <h2 id="donde" className="text-2xl font-semibold text-hpc">Dónde atendemos</h2>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-tinta">
          <Laptop size={18} className="text-dorado" aria-hidden="true" />
          Online a todo el país y al exterior.
        </p>
        <h3 className="mt-5 flex items-center gap-2 text-base font-semibold text-tinta font-sans">
          <MapPin size={18} className="text-dorado" aria-hidden="true" />
          Presencial
        </h3>
        <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {SEDES.map(({ zona, lugares }) => (
            <div key={zona}>
              <dt className="text-sm font-semibold text-hpc">{zona}</dt>
              <dd className="text-sm text-tinta/70">{lugares}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-tinta/60">La atención presencial está sujeta a disponibilidad de cada zona.</p>
      </section>
    </div>
  );
}
