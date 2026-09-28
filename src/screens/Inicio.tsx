// src/screens/Inicio.tsx
// Pantalla de entrada: qué es HPC y un acceso rápido según lo que la persona busca.
// Los accesos replican el menú del bot, así la experiencia es la misma en la app y en WhatsApp.

import { ArrowRight, HeartHandshake, GraduationCap, UserCheck, Users, Wind } from 'lucide-react';
import { BotonWhatsApp } from '../components/BotonWhatsApp';
import { enlacePorMotivo } from '../lib/whatsapp';

const ACCESOS = [
  { href: '#servicios', icono: HeartHandshake, titulo: 'Busco tratamiento', texto: 'Terapia individual, programa DBT y talleres.' },
  { href: '#equipo', icono: Users, titulo: 'Conocé al equipo', texto: 'Psicólogos y psiquiatras por especialidad y zona.' },
  { href: '#formacion', icono: GraduationCap, titulo: 'Soy profesional', texto: 'Formaciones, cursos, membresía y equipo.' },
  { href: '#recursos', icono: Wind, titulo: 'Recursos', texto: 'Un ejercicio de respiración y material gratuito.' },
] as const;

export function Inicio() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-hpc text-crema p-7 md:p-10">
        <div aria-hidden="true" className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-dorado/20" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-dorado">
          Fundación Habilidades para el Cambio
        </p>
        <h1 className="relative mt-3 text-3xl md:text-5xl font-semibold leading-tight max-w-2xl">
          Salud mental basada en la evidencia, cerca tuyo.
        </h1>
        <p className="relative mt-4 max-w-xl text-crema/85 leading-relaxed">
          Somos un centro especializado en Terapia Cognitivo-Conductual, terapias contextuales y DBT.
          Atendemos presencial en varias provincias y online en todo el país.
        </p>
        <div className="relative mt-6 flex flex-col sm:flex-row gap-3">
          <BotonWhatsApp motivo="general" texto="Escribinos por WhatsApp" />
          <a
            href="#servicios"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-crema/30 px-5 py-3 text-sm font-semibold hover:bg-hpc-oscuro"
          >
            Ver tratamientos <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section aria-labelledby="que-buscas">
        <h2 id="que-buscas" className="text-2xl font-semibold text-hpc">¿Qué estás buscando?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ACCESOS.map(({ href, icono: Icono, titulo, texto }) => (
            <a
              key={href}
              href={href}
              className="group bg-white rounded-2xl border border-hpc/10 p-5 hover:border-hpc/40 transition-colors"
            >
              <Icono className="text-dorado" size={26} aria-hidden="true" />
              <h3 className="mt-3 text-lg font-semibold text-hpc">{titulo}</h3>
              <p className="mt-1 text-sm text-tinta/70">{texto}</p>
            </a>
          ))}
          <a
            href={enlacePorMotivo('paciente')}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl border border-hpc/10 p-5 hover:border-hpc/40 transition-colors"
          >
            <UserCheck className="text-dorado" size={26} aria-hidden="true" />
            <h3 className="mt-3 text-lg font-semibold text-hpc">Ya soy paciente</h3>
            <p className="mt-1 text-sm text-tinta/70">Turnos, pagos o certificados: escribile al equipo.</p>
          </a>
        </div>
      </section>
    </div>
  );
}
