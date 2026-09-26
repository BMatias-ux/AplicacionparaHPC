// src/components/BotonWhatsApp.tsx
// Botón reutilizable que abre WhatsApp con un mensaje prellenado según el motivo.
// target="_blank" abre en otra pestaña; rel="noopener noreferrer" es la práctica segura
// para enlaces externos (la página nueva no puede controlar la nuestra).

import { MessageCircle } from 'lucide-react';
import { enlacePorMotivo, type MotivoWhatsApp } from '../lib/whatsapp';

interface Props {
  motivo: MotivoWhatsApp;
  texto?: string;
  variante?: 'solido' | 'suave';
  ancho?: boolean;
}

export function BotonWhatsApp({ motivo, texto = 'Consultar por WhatsApp', variante = 'solido', ancho = false }: Props) {
  const estilos =
    variante === 'solido'
      ? 'bg-whatsapp text-white hover:brightness-110'
      : 'bg-whatsapp/10 text-whatsapp hover:bg-whatsapp/15';
  return (
    <a
      href={enlacePorMotivo(motivo)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${estilos} ${
        ancho ? 'w-full' : ''
      }`}
    >
      <MessageCircle size={18} aria-hidden="true" />
      {texto}
    </a>
  );
}

/** Botón flotante, sólo en celular (en computadora ya está en la barra lateral). */
export function WhatsAppFlotante() {
  return (
    <a
      href={enlacePorMotivo('general')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="md:hidden fixed right-4 bottom-24 z-40 w-14 h-14 rounded-full bg-whatsapp text-white shadow-lg flex items-center justify-center"
    >
      <MessageCircle size={26} aria-hidden="true" />
    </a>
  );
}
