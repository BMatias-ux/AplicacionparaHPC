// src/lib/whatsapp.ts
// Arma los enlaces a WhatsApp con un mensaje ya escrito.
//
// Por qué wa.me: es el formato oficial de "click to chat". En el celular abre la app de
// WhatsApp; en la computadora abre WhatsApp Web o la app de escritorio.
// Cualquier mensaje que llegue al número dispara el menú del bot, así que el texto
// prellenado sirve para que el equipo sepa de dónde vino la persona y qué buscaba.

import { WHATSAPP_NUMERO } from '../config';

/** Marca que se agrega al final de cada mensaje, para saber que vino del portal. */
const FIRMA_PORTAL = '(Escribo desde el portal web)';

/**
 * Devuelve la URL de WhatsApp con el mensaje codificado.
 * encodeURIComponent convierte espacios, tildes y saltos de línea a un formato válido para una URL.
 */
export function enlaceWhatsApp(mensaje: string): string {
  const texto = `${mensaje}\n\n${FIRMA_PORTAL}`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
}

/** Mensajes prellenados por motivo. Se usan desde los botones de la app. */
export const MENSAJES = {
  general: 'Hola, quisiera hacer una consulta.',
  terapia: 'Hola, quisiera información sobre terapia individual.',
  dbt: 'Hola, quisiera información sobre el programa DBT.',
  talleres: 'Hola, quisiera información sobre los talleres de habilidades DBT.',
  formaciones: 'Hola, quisiera información sobre las formaciones anuales.',
  cursos: 'Hola, tengo una consulta sobre los cursos online.',
  membresia: 'Hola, quisiera información sobre la membresía.',
  paciente: 'Hola, ya soy paciente y tengo una consulta.',
  profesional: 'Hola, soy profesional de la salud mental y quisiera sumarme al equipo.',
} as const;

export type MotivoWhatsApp = keyof typeof MENSAJES;

export function enlacePorMotivo(motivo: MotivoWhatsApp): string {
  return enlaceWhatsApp(MENSAJES[motivo]);
}
