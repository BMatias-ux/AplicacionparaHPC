// src/App.tsx
// Estructura general: barra lateral (computadora) o encabezado + barra inferior (celular),
// y en el medio la sección activa. Ya no hay marco de teléfono simulado: la app ocupa la
// pantalla real del dispositivo.

import { lazy, Suspense, useEffect, useState } from 'react';
import { seccionDesdeHash, type Seccion } from './navegacion';
import { BarraLateral, BarraInferior, EncabezadoMovil } from './components/Navegacion';
import { WhatsAppFlotante } from './components/BotonWhatsApp';
import { InvitacionInstalar } from './components/InvitacionInstalar';
import { Inicio } from './screens/Inicio';
import { Servicios } from './screens/Servicios';
import { Equipo } from './screens/Equipo';
import { Formacion } from './screens/Formacion';
import { Recursos } from './screens/Recursos';
import { Contacto } from './screens/Contacto';
import { Privacidad } from './screens/Privacidad';

// Carga diferida: el código del acceso de profesionales (incluye el cliente de Supabase,
// ~50 KB) se descarga sólo cuando alguien abre esa sección. El público no lo paga.
const Profesionales = lazy(() => import('./screens/Profesionales').then((m) => ({ default: m.Profesionales })));
// Lo mismo para "Mi espacio" (cuenta del paciente): sólo lo descarga quien entra.
const MiEspacio = lazy(() => import('./screens/MiEspacio').then((m) => ({ default: m.MiEspacio })));

const PANTALLAS: Record<Seccion, React.ComponentType> = {
  inicio: Inicio,
  servicios: Servicios,
  equipo: Equipo,
  formacion: Formacion,
  recursos: Recursos,
  'mi-espacio': MiEspacio,
  contacto: Contacto,
  privacidad: Privacidad,
  profesionales: Profesionales,
};

export default function App() {
  // La sección sale del hash de la URL (ver navegacion.ts).
  const [seccion, setSeccion] = useState<Seccion>(() => seccionDesdeHash(window.location.hash));

  useEffect(() => {
    // "hashchange" se dispara al tocar un enlace #algo y también con el botón "atrás".
    const alCambiar = () => {
      setSeccion(seccionDesdeHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const Pantalla = PANTALLAS[seccion];

  return (
    <div className="min-h-screen md:flex">
      <BarraLateral activa={seccion} />
      <div className="flex-1 min-w-0">
        <EncabezadoMovil activa={seccion} />
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-10 md:py-10">
          <Suspense fallback={<p className="text-tinta/60">Cargando…</p>}>
            <Pantalla />
          </Suspense>
        </main>
        {/* Pie visible también en celular: el enlace al aviso de privacidad tiene que estar
            siempre a mano (Disposición DNPDP 10/2008: "en lugar visible").
            pb-28 en celular deja lugar a la barra inferior y al botón flotante. */}
        <footer className="mx-auto max-w-6xl px-4 pb-28 md:px-10 md:pb-8 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta/60">
          <span>© {new Date().getFullYear()} Fundación Habilidades para el Cambio</span>
          <a href="#privacidad" className="underline underline-offset-4 hover:text-hpc">
            Aviso de privacidad y datos personales
          </a>
          <a href="#profesionales" className="underline underline-offset-4 hover:text-hpc">
            Acceso profesionales
          </a>
        </footer>
      </div>
      <BarraInferior activa={seccion} />
      <WhatsAppFlotante />
      <InvitacionInstalar />
    </div>
  );
}
