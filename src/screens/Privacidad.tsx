// src/screens/Privacidad.tsx
// Aviso de privacidad y consentimiento (paso 2.6, Ley 25.326 de Protección de Datos Personales).
//
// Qué exige la ley y dónde está cubierto en esta página:
//   - Art. 6 (informar antes de recolectar): finalidad, destinatarios, responsable y domicilio,
//     si responder es obligatorio, consecuencias y derechos → secciones 1 a 8.
//   - Art. 5 (consentimiento libre, expreso e informado): el bot lo pide con botones
//     "Acepto / No acepto" antes de preguntar cualquier dato (bot-hpc: lib/consentimiento.js).
//   - Art. 7 y 8 (datos sensibles y de salud): sección 3.
//   - Disposición DNPDP 10/2008: las dos leyendas del final (derecho de acceso y órgano de
//     control). El órgano de control hoy es la Agencia de Acceso a la Información Pública (AAIP).
//
// ⚠️ Texto redactado como borrador técnico: la Fundación lo revisa con su asesoría legal.
// Si se cambia algo acá, revisar que el aviso corto del bot siga coincidiendo.

import { ShieldCheck, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';
import { EMAIL_CONSULTAS, WHATSAPP_VISIBLE, RESPONSABLE_DATOS } from '../config';

const ULTIMA_ACTUALIZACION = '28 de septiembre de 2026';

/** El correo con un punto de corte opcional después de la @ (<wbr>), para que en pantallas
 *  angostas se parta ahí y no a mitad de palabra. */
function CorreoConsultas() {
  const [usuario, dominio] = EMAIL_CONSULTAS.split('@');
  return (
    <a href={`mailto:${EMAIL_CONSULTAS}`} className="underline decoration-dorado/50 underline-offset-4 break-words">
      {usuario}@<wbr />
      {dominio}
    </a>
  );
}

// Cada bloque es una sección del aviso. Separar el contenido del diseño hace que editar
// el texto no obligue a tocar el marcado.
interface Bloque {
  id: string;
  titulo: string;
  parrafos: string[];
  lista?: string[];
}

const BLOQUES: Bloque[] = [
  {
    id: 'que-datos',
    titulo: '2. Qué datos recolectamos',
    parrafos: [
      'Cuando nos escribís por WhatsApp, un asistente automático te pide algunos datos para que el equipo pueda responderte. Según lo que consultes, pueden ser:',
    ],
    lista: [
      'Consultas por tratamiento: nombre y apellido, edad de la persona que va a recibir la atención, zona, modalidad preferida (presencial u online), disponibilidad horaria, el motivo de consulta y la respuesta a una pregunta sobre si estás atravesando una situación de riesgo.',
      'Consultas por formaciones, cursos o membresía: nombre y apellido y, si querés dejarlos, un correo electrónico y otro teléfono de contacto.',
      'En todos los casos: tu número de WhatsApp, los mensajes de la conversación y la fecha y hora en que aceptaste este aviso.',
    ],
  },
  {
    id: 'salud',
    titulo: '3. Datos de salud',
    parrafos: [
      'El motivo de consulta y la pregunta sobre riesgo son datos de salud, que la ley considera datos sensibles. Los tratamos con secreto profesional y sólo los ven el equipo de admisión y el profesional al que se deriva tu consulta.',
      'Nadie está obligado a darnos datos sensibles. Si preferís no contar el motivo por escrito, podés responder que preferís hablarlo en la entrevista y lo conversás directamente con el profesional.',
      'Si en la conversación aparecen señales de que tu vida o la de otra persona puede estar en riesgo, el equipo recibe un aviso prioritario para poder contactarte, aunque todavía no hayas aceptado este aviso. Lo hacemos únicamente para protegerte.',
    ],
  },
  {
    id: 'para-que',
    titulo: '4. Para qué los usamos',
    parrafos: ['Usamos tus datos sólo para:'],
    lista: [
      'Responder tu consulta y darte la información que pediste.',
      'Derivarte al profesional adecuado según zona, modalidad, edad y temática.',
      'Coordinar turnos y comunicarnos con vos sobre tu atención.',
      'Armar estadísticas internas sin datos que te identifiquen, para organizar el equipo.',
    ],
  },
  {
    id: 'que-no',
    titulo: '5. Lo que no hacemos',
    parrafos: [
      'No vendemos ni cedemos tus datos. No los usamos para publicidad ni los compartimos con plataformas de anuncios. No los usamos para fines distintos de los indicados en este aviso sin pedirte un nuevo consentimiento.',
    ],
  },
  {
    id: 'quien',
    titulo: '6. Quién accede y dónde se guardan',
    parrafos: [
      'Dentro de la Fundación acceden el equipo de admisión, la coordinación de tu zona y el profesional que te atienda, cada uno sólo a lo que necesita.',
      'Para funcionar usamos proveedores tecnológicos que guardan o procesan la información por cuenta de la Fundación y no pueden usarla para otros fines:',
    ],
    lista: [
      'Meta (WhatsApp) y, cuando se active, 360dialog: transmisión de los mensajes.',
      'Supabase: base de datos donde se guardan las consultas (servidores en San Pablo, Brasil).',
      'Vercel: servidores donde funcionan el asistente y este portal.',
      'Upstash: memoria temporal de la conversación, que se borra sola a las 24 horas.',
      'Google: planilla de respaldo de las consultas, con acceso restringido al equipo.',
    ],
  },
  {
    id: 'internacional',
    titulo: '7. Transferencia fuera de Argentina',
    parrafos: [
      'Algunos de estos proveedores guardan la información en servidores ubicados fuera de Argentina, por ejemplo en Brasil y en Estados Unidos. Al aceptar este aviso, consentís esa transferencia. Elegimos proveedores que cifran la información y controlan quién puede acceder a ella.',
    ],
  },
  {
    id: 'plazo',
    titulo: '8. Cuánto tiempo los guardamos',
    parrafos: [
      'Guardamos los datos de tu consulta mientras sean necesarios para gestionarla y para tu atención. Podés pedir que los borremos en cualquier momento, salvo que una ley nos obligue a conservarlos. La memoria temporal de la conversación se borra sola a las 24 horas.',
    ],
  },
  {
    id: 'portal',
    titulo: '9. Este portal',
    parrafos: [
      'El portal no te pide datos personales, no tiene formularios y no usa cookies de publicidad ni de seguimiento. Para mostrar las tipografías, tu navegador descarga fuentes de Google Fonts, lo que le informa a Google tu dirección IP. Cuando tocás un botón de WhatsApp, se abre la aplicación con un mensaje ya escrito y rigen las condiciones de este aviso.',
      'Las fichas del equipo muestran sólo la información que cada profesional autorizó a publicar.',
    ],
  },
];

export function Privacidad() {
  return (
    <div className="space-y-8">
      <EncabezadoSeccion
        antetitulo="Protección de datos personales"
        titulo="Aviso de privacidad"
        bajada="Cómo cuidamos la información que nos das cuando nos escribís. Lo pedimos en WhatsApp antes de preguntarte cualquier dato."
      />

      <p className="text-xs text-tinta/60">Última actualización: {ULTIMA_ACTUALIZACION}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] items-start">
        <article className="bg-white rounded-2xl border border-hpc/10 p-6 md:p-8 space-y-8 leading-relaxed text-tinta/85">
          <section aria-labelledby="responsable" className="space-y-3">
            <h2 id="responsable" className="text-xl font-semibold text-hpc">1. Quién es responsable de tus datos</h2>
            <p>
              El responsable de la base de datos es la <strong>{RESPONSABLE_DATOS.nombre}</strong>
              {RESPONSABLE_DATOS.domicilio && <>, con domicilio en {RESPONSABLE_DATOS.domicilio}</>}.
              Para cualquier consulta sobre tus datos, escribinos a{' '}
              <CorreoConsultas />{' '}
              o por WhatsApp al {WHATSAPP_VISIBLE}.
            </p>
          </section>

          {BLOQUES.map((b) => (
            <section key={b.id} aria-labelledby={b.id} className="space-y-3">
              <h2 id={b.id} className="text-xl font-semibold text-hpc">{b.titulo}</h2>
              {b.parrafos.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {b.lista && (
                <ul className="list-disc pl-5 space-y-2">
                  {b.lista.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section aria-labelledby="derechos" className="space-y-3">
            <h2 id="derechos" className="text-xl font-semibold text-hpc">10. Tus derechos</h2>
            <p>En cualquier momento podés pedirnos:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Acceso:</strong> saber qué datos tuyos tenemos. Te respondemos dentro de los 10 días corridos.
              </li>
              <li>
                <strong>Rectificación y actualización:</strong> corregir datos equivocados o desactualizados. Lo hacemos
                dentro de los 5 días hábiles.
              </li>
              <li>
                <strong>Supresión:</strong> que borremos tus datos, salvo que una ley nos obligue a conservarlos.
              </li>
              <li>
                <strong>Retirar tu consentimiento</strong> para usos futuros.
              </li>
            </ul>
            <p>
              Para ejercerlos, escribinos a{' '}
              <CorreoConsultas />{' '}
              desde el correo o el WhatsApp con el que nos contactaste, así podemos confirmar que sos vos. Es gratuito.
            </p>
          </section>

          <section aria-labelledby="cambios" className="space-y-3">
            <h2 id="cambios" className="text-xl font-semibold text-hpc">11. Cambios en este aviso</h2>
            <p>
              Si cambiamos este aviso, publicamos la nueva versión en esta página con su fecha. Si el cambio afecta
              cómo usamos datos que ya nos diste, te vamos a pedir un nuevo consentimiento.
            </p>
          </section>

          {/* Leyendas de la Disposición DNPDP 10/2008, con el órgano de control actual (AAIP). */}
          <section aria-label="Información legal" className="border-t border-hpc/10 pt-6 space-y-3 text-sm text-tinta/70">
            <p>
              El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma
              gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto
              conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.
            </p>
            <p>
              La Agencia de Acceso a la Información Pública, Órgano de Control de la Ley Nº 25.326, tiene la atribución
              de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por
              incumplimiento de las normas vigentes en materia de protección de datos personales.
            </p>
          </section>
        </article>

        {/* En celular el resumen va primero (order-first); en computadora, a la derecha. */}
        <aside className="space-y-4 order-first lg:order-none lg:sticky lg:top-6">
          <div className="rounded-2xl bg-hpc text-crema p-6 space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="text-dorado" size={22} aria-hidden="true" />
              En pocas palabras
            </h2>
            <ul className="space-y-2 text-sm text-crema/85">
              <li>Te pedimos permiso antes de preguntarte cualquier dato.</li>
              <li>Tus datos los ve sólo el equipo que te atiende.</li>
              <li>No los vendemos ni los usamos para publicidad.</li>
              <li>Podés verlos, corregirlos o borrarlos cuando quieras.</li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-hpc/10 p-6 space-y-3 text-sm">
            <h2 className="text-base font-semibold text-hpc">Consultas sobre tus datos</h2>
            <p className="flex items-center gap-2 text-tinta">
              <Mail className="text-dorado shrink-0" size={18} aria-hidden="true" />
              <CorreoConsultas />
            </p>
            <p className="flex items-center gap-2 text-tinta">
              <MessageCircle className="text-whatsapp shrink-0" size={18} aria-hidden="true" />
              {WHATSAPP_VISIBLE}
            </p>
            <a
              href="https://www.argentina.gob.ar/aaip/datospersonales"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-hpc underline underline-offset-4"
            >
              Agencia de Acceso a la Información Pública
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
