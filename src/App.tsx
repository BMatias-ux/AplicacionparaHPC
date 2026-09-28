// src/App.tsx
// Estructura general: barra lateral (computadora) o encabezado + barra inferior (celular),
// y en el medio la sección activa. Ya no hay marco de teléfono simulado: la app ocupa la
// pantalla real del dispositivo.

import { useEffect, useState } from 'react';
import { seccionDesdeHash, type Seccion } from './navegacion';
import { BarraLateral, BarraInferior, EncabezadoMovil } from './components/Navegacion';
import { WhatsAppFlotante } from './components/BotonWhatsApp';
import { Inicio } from './screens/Inicio';
import { Servicios } from './screens/Servicios';
import { Equipo } from './screens/Equipo';
import { Formacion } from './screens/Formacion';
import { Recursos } from './screens/Recursos';
import { Contacto } from './screens/Contacto';

const PANTALLAS: Record<Seccion, () => React.JSX.Element> = {
  inicio: Inicio,
  servicios: Servicios,
  equipo: Equipo,
  formacion: Formacion,
  recursos: Recursos,
  contacto: Contacto,
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
        <EncabezadoMovil />
        {/* pb-28 en celular deja lugar a la barra inferior y al botón flotante */}
        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-10 md:py-10 md:pb-12">
          <Pantalla />
        </main>
        <footer className="hidden md:block mx-auto max-w-6xl px-10 pb-8 text-xs text-tinta/50">
          © {new Date().getFullYear()} Fundación Habilidades para el Cambio
        </footer>
      </div>
      <BarraInferior activa={seccion} />
      <WhatsAppFlotante />
    </div>
  );
}
