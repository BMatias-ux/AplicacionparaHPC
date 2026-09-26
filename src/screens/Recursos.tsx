// src/screens/Recursos.tsx
// Material de libre acceso. En esta versión no se guarda nada de la persona.

import { ExternalLink } from 'lucide-react';
import { Respiracion } from '../components/Respiracion';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';
import { SITIOS } from '../config';

const ENLACES = [
  { titulo: 'Talleres gratuitos', texto: 'Actividades abiertas a la comunidad, con inscripción por formulario.', url: SITIOS.talleresGratis },
  { titulo: 'Caja Eureka', texto: 'Recursos y herramientas para familias con chicos pequeños.', url: SITIOS.cajaEureka },
  { titulo: 'Cursos de Psicología', texto: 'Cursos online con certificado.', url: SITIOS.cursos },
  { titulo: 'La Fundación', texto: 'Proyectos y marco institucional.', url: SITIOS.fundacion },
];

export function Recursos() {
  return (
    <div className="space-y-8">
      <EncabezadoSeccion antetitulo="Libre acceso" titulo="Recursos" />
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <Respiracion />
        <ul className="grid gap-3">
          {ENLACES.map(({ titulo, texto, url }) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-4 bg-white rounded-2xl border border-hpc/10 p-5 hover:border-hpc/40"
              >
                <span>
                  <span className="block text-lg font-semibold text-hpc font-display">{titulo}</span>
                  <span className="block mt-1 text-sm text-tinta/70">{texto}</span>
                </span>
                <ExternalLink size={18} className="shrink-0 text-dorado mt-1" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
