// src/components/Respiracion.tsx
// Ejercicio de respiración guiada 4-7-8 (inhalar 4 s, sostener 7 s, exhalar 8 s).
// No guarda ningún dato: todo pasa en la pantalla y se olvida al salir.
//
// Cómo funciona: cada fase agenda la siguiente con setTimeout. El useEffect se vuelve a
// ejecutar cuando cambia la fase, y su "cleanup" (la función que devuelve) cancela el
// temporizador pendiente. Sin ese cleanup, al salir de la pantalla el temporizador seguiría
// corriendo y React avisaría que se actualiza un componente que ya no existe.

import { useEffect, useState } from 'react';

type Fase = 'quieto' | 'inhala' | 'sostene' | 'exhala';

const FASES: Record<Exclude<Fase, 'quieto'>, { texto: string; segundos: number; siguiente: Fase; escala: string }> = {
  inhala: { texto: 'Inhalá', segundos: 4, siguiente: 'sostene', escala: 'scale-125' },
  sostene: { texto: 'Sostené', segundos: 7, siguiente: 'exhala', escala: 'scale-125' },
  exhala: { texto: 'Exhalá', segundos: 8, siguiente: 'inhala', escala: 'scale-90' },
};

const CICLOS = 4; // Una ronda corta; se puede repetir.

export function Respiracion() {
  const [fase, setFase] = useState<Fase>('quieto');
  const [ciclo, setCiclo] = useState(0);

  useEffect(() => {
    if (fase === 'quieto') return;
    const { segundos, siguiente } = FASES[fase];
    const id = window.setTimeout(() => {
      if (fase === 'exhala') {
        // Terminó un ciclo completo.
        if (ciclo + 1 >= CICLOS) {
          setFase('quieto');
          setCiclo(0);
          return;
        }
        setCiclo((c) => c + 1);
      }
      setFase(siguiente);
    }, segundos * 1000);
    return () => window.clearTimeout(id);
  }, [fase, ciclo]);

  const activa = fase !== 'quieto';
  const datos = activa ? FASES[fase] : null;

  return (
    <div className="bg-white rounded-2xl border border-hpc/10 p-6 text-center">
      <h2 className="text-2xl font-semibold text-hpc">Respiración 4-7-8</h2>
      <p className="mt-2 text-sm text-tinta/70 max-w-md mx-auto">
        Inhalá en 4 segundos, sostené 7 y exhalá lento en 8. Son {CICLOS} ciclos, poco más de un minuto.
      </p>

      <div className="my-10 flex items-center justify-center" aria-live="polite">
        <div
          style={{ transitionDuration: `${datos ? datos.segundos : 1}s` }}
          className={`w-40 h-40 rounded-full flex items-center justify-center font-display text-2xl text-crema transition-transform ease-in-out ${
            activa ? 'bg-hpc' : 'bg-hpc/40'
          } ${datos ? datos.escala : 'scale-100'}`}
        >
          {datos ? datos.texto : 'Listo'}
        </div>
      </div>

      {activa && <p className="text-sm text-tinta/60 mb-4">Ciclo {ciclo + 1} de {CICLOS}</p>}

      <button
        type="button"
        onClick={() => {
          if (activa) {
            setFase('quieto');
            setCiclo(0);
          } else {
            setFase('inhala');
          }
        }}
        className="rounded-xl bg-hpc px-6 py-3 text-sm font-semibold text-crema hover:bg-hpc-oscuro"
      >
        {activa ? 'Detener' : 'Comenzar'}
      </button>
    </div>
  );
}
