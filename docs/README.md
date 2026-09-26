# App HPC — Portal de pacientes y profesionales

Aplicación web (PWA) de la **Fundación Habilidades para el Cambio** para automatizar el circuito
paciente ↔ equipo ↔ profesional, integrada con el bot de WhatsApp.

| | |
|---|---|
| Repo de la app | `github.com/BMatias-ux/AplicacionparaHPC` (público) |
| Repo del bot | `github.com/BMatias-ux/bot-hpc` (privado) |
| Deploy actual | `app-hpc.vercel.app` (Vercel, equipo `bmatias-ux`, plan Pro) |
| Dominio | `portal.habilidadesparaelcambio.com.ar` |
| Carpeta local | `C:\Proyectos\app-hpc` |
| Stack | React 19 + Vite 6 + TypeScript + Tailwind 4 · PWA (origen: maqueta de Google AI Studio) |

## Mapa de esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `00-INSTRUCCIONES.md` | Cómo usar y mantener esta carpeta (leer primero, también Claude) |
| `01-especificacion.md` | Qué es la app, módulos, arquitectura y decisiones tomadas |
| `02-bitacora.md` | Registro cronológico de cada sesión de trabajo |
| `03-manual-de-uso.md` | Manual de procedimiento para el equipo (se completa a medida que hay funciones reales) |
| `04-pendientes.md` | Lo que falta, priorizado |
| `05-guia-despliegue.md` | Cómo publicar en el subdominio, paso a paso |
| `06-guia-cuentas.md` | Servicios, cuentas y variables de entorno (sin secretos) |
| `etapas/` | Un archivo por etapa de desarrollo: objetivo, cambios, por qué |
| `historico/` | Prompts y pedidos originales, textuales, con fecha |
