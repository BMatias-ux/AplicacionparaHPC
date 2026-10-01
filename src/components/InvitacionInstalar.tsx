// src/components/InvitacionInstalar.tsx
// Aviso "Instalá la app" que aparece abajo, sobre la barra de navegación.
//
// - Android / computadora: botón "Instalar" que abre la ventana oficial del navegador.
// - iPhone / iPad: instrucciones (Compartir → Agregar a inicio), porque Safari no tiene botón.
// - Si ya está instalada (se abrió desde el ícono), no aparece.
// - Si la persona lo cierra, no vuelve a aparecer por 14 días (se recuerda en este navegador).

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { esIOS, instalar, puedeInstalar, suscribirInstalacion, yaInstalada } from '../lib/instalacion';

const CLAVE = 'hpc-instalar-cerrado';
const DIAS_SIN_MOSTRAR = 14;

function cerradoHacePoco(): boolean {
  try {
    const guardado = Number(localStorage.getItem(CLAVE) ?? 0);
    return Date.now() - guardado < DIAS_SIN_MOSTRAR * 24 * 60 * 60 * 1000;
  } catch {
    return false; // navegador en modo privado o almacenamiento bloqueado: lo mostramos igual
  }
}

export function InvitacionInstalar() {
  const [disponible, setDisponible] = useState(puedeInstalar);
  const [oculta, setOculta] = useState(() => yaInstalada() || cerradoHacePoco());
  const ios = esIOS();

  useEffect(() => suscribirInstalacion(() => setDisponible(puedeInstalar())), []);

  // Sin botón posible (y no es iPhone) o ya cerrada/instalada: no se muestra nada.
  if (oculta || (!disponible && !ios)) return null;

  const cerrar = () => {
    try {
      localStorage.setItem(CLAVE, String(Date.now()));
    } catch {
      /* si no se puede guardar, sólo se oculta en esta visita */
    }
    setOculta(true);
  };

  return (
    <div
      role="region"
      aria-label="Instalar la aplicación"
      // En celular queda arriba de la barra inferior; en computadora, abajo a la derecha.
      className="fixed z-50 inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] md:inset-x-auto md:right-6 md:bottom-6 md:w-96"
    >
      <div className="flex items-start gap-3 rounded-2xl bg-hpc text-crema p-4 shadow-xl shadow-hpc/25 ring-1 ring-dorado/40">
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-snug">Instalá la app de HPC</p>
          {ios ? (
            <p className="mt-1 text-sm text-crema/85 leading-snug">
              Tocá <Share size={15} className="inline -mt-0.5" aria-label="Compartir" /> <strong>Compartir</strong> y después{' '}
              <strong>“Agregar a inicio”</strong>.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-crema/85 leading-snug">Tenela a mano en tu pantalla de inicio, como cualquier app.</p>
              <button
                type="button"
                onClick={async () => {
                  const acepto = await instalar();
                  if (acepto) setOculta(true);
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-dorado px-4 py-2 text-sm font-semibold text-hpc-oscuro hover:brightness-105"
              >
                <Download size={16} aria-hidden="true" />
                Instalar
              </button>
            </>
          )}
        </div>
        <button type="button" onClick={cerrar} aria-label="Cerrar aviso de instalación" className="p-1 -m-1 text-crema/70 hover:text-crema">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
