# 06 · Guía de cuentas y servicios

⚠️ Acá se anota **dónde** está cada cosa, nunca el valor de un secreto.

| Servicio | Cuenta / equipo | Uso |
|---|---|---|
| GitHub | `BMatias-ux` | Repos `AplicacionparaHPC` (público) y `bot-hpc` (privado) |
| Vercel | equipo `bmatias-ux` (Pro, Gmail personal) | Proyectos `app-hpc` y `bot-hpc` |
| Hostinger | plan Business (vence 18/06/2027) | DNS de `habilidadesparaelcambio.com.ar` (WordPress), `.org`, `cursosdepsicologia.com.ar`, `cajaeureka.com.ar` |
| Meta / WhatsApp Cloud API | app "MensajesHPC", usuario del sistema "Bot Mensajes HPC" | Número del bot (IDs en `.env.example` del bot) |
| Upstash Redis | conectado al proyecto `bot-hpc` en Vercel | Estado de cada conversación (24 h) |
| Google Sheets + Apps Script | hoja 'Demanda' | Registro de consultas del bot |
| Google AI Studio | — | Origen de la maqueta de la app |

## Variables de entorno

**App (`app-hpc`):** hoy ninguna necesaria. El `.env.example` de AI Studio pide `GEMINI_API_KEY` y `APP_URL`,
pero el front no las usa. **No cargar una API key en variables `VITE_*`**: todo lo que empieza con `VITE_` queda visible en el navegador.

**Bot (`bot-hpc`):** `WHATSAPP_TOKEN`, `META_APP_SECRET`, `VERIFY_TOKEN`, `PHONE_NUMBER_ID`, `WABA_ID`, `META_APP_ID`,
`GRAPH_VERSION`, `KV_REST_API_URL` / `KV_REST_API_TOKEN`, `NUMERO_ALERTAS`, `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_TOKEN`.
Los valores están en Vercel → proyecto `bot-hpc` → Settings → Environment Variables.
