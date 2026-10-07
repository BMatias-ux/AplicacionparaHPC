// src/components/Anclaje54321.tsx
// Ejercicio de anclaje con los sentidos "5-4-3-2-1": ayuda a volver al presente cuando la
// ansiedad sube. Se avanza de a un paso; no guarda nada.
//
// Por qué un paso por pantalla y no una lista: en un momento de ansiedad cuesta leer mucho
// texto junto. Mostrar una sola consigna grande hace que sea fácil de seguir.

import { useState } from 'react';
import { Eye, Hand, Ear, Wind, Sparkles } from 'lucide-react';

const PASOS = [
  { numero: 5, sentido: 'ves', consigna: 'Nombrá cinco cosas que puedas ver a tu alrededor.', icono: Eye },
  { numero: 4, sentido: 'podés tocar', consigna: 'Notá cuatro cosas que puedas tocar: la ropa, la silla, el piso bajo tus pies.', icono: Hand },
  { numero: 3, sentido: 'oís', consigna: 'Prestá atención a tres sonidos, cercanos o lejanos.', icono: Ear },
  { numero: 2, sentido: 'olés', consigna: 'Buscá dos olores. Si no encontrás, recordá dos que te gusten.', icono: Wind },
  { numero: 1, sentido: 'saboreás', consigna: 'Notá un sabor en tu boca, o tomá un sorbo de agua.', icono: Sparkles },
] as const;

export function Anclaje54321() {
  // -1 = todavía no empezó · 0..4 = paso actual · 5 = terminado
  const [paso, setPaso] = useState(-1);
  const actual = paso >= 0 && paso < PASOS.length ? PASOS[paso] : null;

  return (
    <div className="bg-white rounded-2xl border border-hpc/10 p-6 text-center">
      <h2 className="text-2xl font-semibold text-hpc">Anclaje 5-4-3-2-1</h2>
      <p className="mt-2 text-sm text-tinta/70 max-w-md mx-auto">
        Usá tus sentidos para volver al presente. Tomate el tiempo que necesites en cada paso.
      </p>

      <div className="my-8 min-h-40 flex flex-col items-center justify-center gap-3" aria-live="polite">
        {actual ? (
          <>
            <span className="w-20 h-20 rounded-full bg-hpc text-crema flex items-center justify-center font-display text-4xl">
              {actual.numero}
            </span>
            <actual.icono className="text-dorado" size={24} aria-hidden="true" />
            <p className="max-w-sm text-lg text-tinta">{actual.consigna}</p>
            <p className="text-xs text-tinta/50">Paso {paso + 1} de {PASOS.length}</p>
          </>
        ) : paso === PASOS.length ? (
          <p className="max-w-sm text-lg text-hpc">
            Muy bien. Respirá hondo una vez más y notá cómo te sentís ahora.
          </p>
        ) : (
          <p className="max-w-sm text-tinta/60">Cinco pasos cortos, alrededor de dos minutos.</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {actual ? (
          <>
            <button type="button" onClick={() => setPaso(-1)} className="rounded-xl border border-hpc/20 px-5 py-3 text-sm font-semibold text-hpc">
              Detener
            </button>
            <button type="button" onClick={() => setPaso(paso + 1)} className="rounded-xl bg-hpc px-6 py-3 text-sm font-semibold text-crema hover:bg-hpc-oscuro">
              {paso + 1 === PASOS.length ? 'Terminar' : 'Siguiente'}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setPaso(0)} className="rounded-xl bg-hpc px-6 py-3 text-sm font-semibold text-crema hover:bg-hpc-oscuro">
            {paso === PASOS.length ? 'Hacerlo de nuevo' : 'Comenzar'}
          </button>
        )}
      </div>
    </div>
  );
}
