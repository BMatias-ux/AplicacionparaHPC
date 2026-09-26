# Etapa 2 · Bot en el número del equipo (coexistencia)

**Fecha de apertura:** 26/09/2026 · **Estado:** camino B decidido; pidiendo cotizaciones

## Pedido

Que el bot de respuestas conviva con las personas del equipo que hoy atienden el WhatsApp
`+54 9 387 523-3693` desde la app WhatsApp Business: el bot contesta primero y, en algún punto,
deriva la conversación a una persona, que sigue respondiendo desde su celular.

## Documento de origen (Drive)

"Proyecto · bot de respuestas y asistente virtual sobre la API de WhatsApp"
(hoja de cálculo, 2/9/2026, carpeta HPC en Drive de Matías):
https://docs.google.com/spreadsheets/d/1dK0Uuic76Md5yfHfJnLSxfeftGylQVyK7brzuCt1A4U

Qué dice, resumido:
- Objetivo: responder en segundos las 24 hs, recolectar los datos que hoy se piden a mano, clasificar
  por zona y motivo, y derivar a una persona.
- Stack propuesto entonces: WhatsApp Cloud API + n8n + Google Sheets 'Demanda'. Tres etapas: (1) menú y
  recolección, (2) medición hacia Meta (API de conversiones), (3) asistente en lenguaje natural con las
  plantillas de la hoja 'Mensajes' como única fuente de verdad.
- **Advertencia escrita en ese documento:** "El número tiene que migrar de la app WhatsApp Business a la API
  (o usar un número nuevo y redirigir). Con la API se pierde la app en el celular: el equipo responde desde
  una bandeja". Es decir, el plan original asumía que **no** había coexistencia.
- Archivos relacionados: hoja 'HPC · Demanda (bot de WhatsApp)' (donde hoy escribe el bot), modelo de costos
  'BotWhatsAppHPCCostosyPlan', y 'metabusinessagenthpc.md' (configuración del Business Agent de Meta).

## Qué se construyó después

El bot ya existe y está en producción: repo `bot-hpc` (Vercel, Cloud API, Redis, hoja 'Demanda'), con la
etapa 1 del plan cubierta (menú, flujos clínico/comercial/directo, riesgo, horario). Se hizo en Node sobre
Vercel en lugar de n8n. Hoy corre en un **número distinto** al del equipo.

## Lo que verificamos sobre la coexistencia (26/09/2026)

Meta sí permite usar el mismo número en la app WhatsApp Business y en la Cloud API ("coexistence").
Según la documentación de Meta para desarrolladores (fuente al pie), las condiciones son:

| Punto | Detalle |
|---|---|
| Quién puede habilitarla | **Sólo Solution Partners o Tech Providers**, con *Embedded Signup*. Una app de desarrollador directa (como "MensajesHPC" hoy) **no** puede activarla por su cuenta |
| App del celular | WhatsApp Business versión 2.24.17 o superior |
| Qué se sincroniza | Chats 1 a 1 (hasta 180 días de historial si el negocio lo autoriza) y los contactos. No: grupos, difusiones, llamadas, mensajes temporales |
| Cómo se entera el bot de que respondió una persona | Webhook `smb_message_echoes`: cada mensaje enviado desde la app llega al webhook. **Es justo lo que necesitamos para pausar el bot automáticamente** |
| Límite | 20 mensajes por segundo (sobra para HPC) |
| Embedded Signup | Versión 4; la v2 deja de funcionar el 15/10/2026 |

## Tres caminos posibles

| Camino | Qué implica | A favor | En contra |
|---|---|---|---|
| **A. Registrar a M Digital como Tech Provider** en Meta y usar Embedded Signup con el bot actual | Verificación de negocio de M Digital en Meta, solicitud de Tech Provider, implementar Embedded Signup v4 | El bot sigue siendo nuestro, sin costo por proveedor. Sirve también para futuros clientes (Estefanía Rodríguez, etc.) | Trámite con Meta de duración incierta; más código (onboarding). Hay que confirmar si el rol de Tech Provider está abierto a una agencia del tamaño de M Digital |
| **B. Usar un proveedor (BSP)** que ya ofrezca coexistencia (ej. 360dialog, YCloud, y otros) y apuntar su webhook al bot en Vercel | Cuenta en el proveedor, migrar el número a través de él | Se activa en días; el bot casi no cambia (cambia la URL a la que envía mensajes) | Costo mensual del proveedor además de las tarifas de Meta; dependencia de un tercero |
| **C. Sin coexistencia**: el número del equipo pasa entero a la API y las personas responden desde una bandeja web | Construir o contratar una bandeja (inbox) | Es lo que preveía el plan original | El equipo pierde la app en el celular: cambio de hábito fuerte. Es el camino que el pedido actual quiere evitar |

**Decisión (Matías, 26/09/2026): camino B.** M Digital no tiene la verificación de negocio en Meta, requisito
previo para ser Tech Provider (D-10). El bot sigue en su número actual hasta migrar.

## Camino B en detalle (lo verificado el 26/09)

Tomamos 360dialog como referencia porque documenta la coexistencia públicamente; hay que cotizar al menos un
segundo proveedor.

**Cómo es el alta con coexistencia (360dialog):**
1. Desde el panel del proveedor: "Add channel" → plan → número → confirmar "Sí, uso la app Business".
2. En el celular del equipo llega un mensaje con un **código QR**; se escanea desde la app WhatsApp Business.
3. Se elige si compartir historial de chats y contactos (opcional, recomendado).
4. Requisitos: app WhatsApp Business actualizada; el **Business Portfolio (Meta) tiene que ser de HPC**, con
   razón social, dirección, sitio web y teléfono completos. La verificación de negocio de Meta **no figura como
   obligatoria** para coexistencia (sí para nombre visible y tilde azul).
5. Después del alta, la app del celular tiene que abrirse al menos **cada 13 días** o la conexión se cae.

**Precio de referencia (360dialog, plan Regular):** €49 por número por mes + las tarifas de mensajes de Meta
sin recargo. El plan Premium (€99) suma bandeja y verificación asistida. Los mensajes enviados desde la app del
celular no se cobran.

**Qué cambia en el bot (`bot-hpc`) al pasar por un proveedor:**
- El envío de mensajes: hoy `api/webhook.js` llama a `graph.facebook.com/<versión>/<PHONE_NUMBER_ID>/messages`
  con `Authorization: Bearer`. Con 360dialog pasa a ser el endpoint del proveedor con su propia API key en la
  cabecera. Es un cambio de dos líneas en `enviar()` más dos variables de entorno.
- El webhook: se registra en el panel del proveedor apuntando a la URL de Vercel. La verificación por
  `x-hub-signature-256` puede no aplicar igual; confirmar con el proveedor cómo autentica sus llamadas.
- Nuevo: manejar `smb_message_echoes` (cuando responde una persona desde la app) → marcar el número como
  atendido por humano y silenciar el bot.

**Qué NO cambia:** los flujos, textos, Redis, la hoja 'Demanda', el protocolo de riesgo.

**Riesgos a cerrar antes de migrar:**
- El Business Portfolio de HPC: ¿existe y está a nombre de la Fundación, con datos completos? Es el requisito duro.
- Backup: exportar el historial del WhatsApp del equipo antes de escanear el QR.
- Ventana de corte: hacerlo un viernes a la tarde, con el bot en modo "sólo menú" hasta validar que las
  respuestas del equipo llegan como `smb_message_echoes`.

## Cambios que el bot necesita en cualquier camino

1. Escuchar el webhook `smb_message_echoes` y, cuando una persona del equipo responde a un número, marcar ese
   número como `atendido_por_humano` (reutilizando el estado `pausado` que ya existe para el protocolo de riesgo).
2. Definir cuándo el bot vuelve a tomar la conversación (propuesta: nunca en la misma conversación; a las 24 hs
   sin actividad, el estado vence solo, igual que hoy).
3. Un comando para el equipo (por ejemplo, escribir `#bot` desde la app) para devolverle la conversación al bot.
4. Detectar los mensajes que vienen del portal ("(Escribo desde el portal web)") y saltear el menú.

## Fuentes

- Meta for Developers, "Onboard WhatsApp Business app users" (coexistence):
  https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users
- 360dialog, "Coexistence": https://docs.360dialog.com/docs/resources/phone-numbers/coexistence
