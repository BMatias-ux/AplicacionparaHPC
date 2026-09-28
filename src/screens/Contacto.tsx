// src/screens/Contacto.tsx
// Canales de contacto + aviso de emergencia.

import { Mail, Clock, MessageCircle, LifeBuoy } from 'lucide-react';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';
import { BotonWhatsApp } from '../components/BotonWhatsApp';
import { EMAIL_CONSULTAS, HORARIO_ATENCION, WHATSAPP_VISIBLE } from '../config';

export function Contacto() {
  return (
    <div className="space-y-8">
      <EncabezadoSeccion
        antetitulo="Hablemos"
        titulo="Contacto"
        bajada="La forma más rápida es WhatsApp: un asistente te pide unos datos y una persona del equipo te responde."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-2xl border border-hpc/10 p-6 space-y-4">
          <p className="flex items-center gap-3 text-tinta">
            <MessageCircle className="text-whatsapp" size={20} aria-hidden="true" />
            <span>
              WhatsApp <strong className="text-hpc">{WHATSAPP_VISIBLE}</strong>
            </span>
          </p>
          <p className="flex items-center gap-3 text-tinta">
            <Mail className="text-dorado" size={20} aria-hidden="true" />
            <a href={`mailto:${EMAIL_CONSULTAS}`} className="underline decoration-dorado/50 underline-offset-4 break-all">
              {EMAIL_CONSULTAS}
            </a>
          </p>
          <p className="flex items-center gap-3 text-tinta">
            <Clock className="text-dorado" size={20} aria-hidden="true" />
            {HORARIO_ATENCION}
          </p>
          <BotonWhatsApp motivo="general" texto="Escribinos por WhatsApp" ancho />
          <p className="text-xs text-tinta/60">
            Fuera de horario podés dejar tu consulta: te respondemos a primera hora del próximo día hábil.
          </p>
          <p className="text-xs text-tinta/60">
            Antes de pedirte datos, el asistente te pide tu consentimiento.{' '}
            <a href="#privacidad" className="underline underline-offset-4 hover:text-hpc">
              Cómo cuidamos tus datos
            </a>
            .
          </p>
        </div>

        {/* ⚠️ Texto pendiente de aprobación clínica (mismo criterio que el bot). Ver docs/04-pendientes.md */}
        <aside aria-labelledby="urgencias" className="rounded-2xl bg-hpc text-crema p-6">
          <h2 id="urgencias" className="flex items-center gap-2 text-xl font-semibold">
            <LifeBuoy className="text-dorado" size={22} aria-hidden="true" />
            Si estás en una urgencia
          </h2>
          <p className="mt-3 text-sm text-crema/85 leading-relaxed">
            Este portal y nuestro WhatsApp no son un servicio de emergencias. Si tu vida o la de otra persona corre
            riesgo, llamá al <strong>911</strong> o acercate a la guardia más cercana.
          </p>
          <p className="mt-3 text-sm text-crema/85 leading-relaxed">
            Asistencia en crisis: <strong>135</strong> (línea gratuita desde CABA y Gran Buenos Aires) o{' '}
            <strong>(011) 5275-1135</strong> desde todo el país.
          </p>
        </aside>
      </div>
    </div>
  );
}
