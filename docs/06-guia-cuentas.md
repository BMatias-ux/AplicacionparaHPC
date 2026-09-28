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
| Supabase | organización **Fundación HPC** (plan Free) dentro de la cuenta personal de Matías; proyecto `hpc`, región São Paulo (`sa-east-1`), ref `hflkgvufvczqkhipicuf` | Base de datos: profesionales, pacientes, consultas. Facturación separada de M Digital; transferible a una cuenta de HPC |
| Google AI Studio | — | Origen de la maqueta de la app |

## Variables de entorno

**App (`app-hpc`):** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (la *publishable key*, pública por diseño) en Production, Preview y Development. La contraseña de la base y la *secret key* de Supabase NO van en la app: la contraseña está en el gestor de contraseñas de Matías y la secret key sólo se usará en el bot (paso 2.5).

Antes (hasta 28/09): ninguna. El `.env.example` de AI Studio pide `GEMINI_API_KEY` y `APP_URL`,
pero el front no las usa. **No cargar una API key en variables `VITE_*`**: todo lo que empieza con `VITE_` queda visible en el navegador.

**Bot (`bot-hpc`):** `WHATSAPP_TOKEN`, `META_APP_SECRET`, `VERIFY_TOKEN`, `PHONE_NUMBER_ID`, `WABA_ID`, `META_APP_ID`,
`GRAPH_VERSION`, `KV_REST_API_URL` / `KV_REST_API_TOKEN`, `NUMERO_ALERTAS`, `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_TOKEN`.
Los valores están en Vercel → proyecto `bot-hpc` → Settings → Environment Variables.
