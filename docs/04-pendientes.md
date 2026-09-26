# 04 · Pendientes

Prioridad: 🔴 bloquea · 🟠 importante · 🟢 mejora

## Decisiones que necesita Matías / la Fundación
- 🔴 Nombre del subdominio: `app.`, `portal.` u otro de `habilidadesparaelcambio.com.ar`.
- 🔴 Número único de WhatsApp: ¿cuál queda? (`+54 9 387 523-3693` del bot vs. `+54 9 11 4060-7020` de la app). Verificar coexistencia con Meta antes de migrar.
- 🟠 Backend y login (D-04). Sin esto, turnos y datos no llegan al equipo.
- 🟠 Qué hace la app en la versión 1: ¿solo información + WhatsApp, o ya turnos reales?

## Etapa 1 — Base publicable
- 🔴 Quitar marco de teléfono y selector Móvil/Expandido; layout responsive (celular / tablet / escritorio).
- 🔴 Reemplazar `mockData.ts`: sacar profesionales, fotos y calificaciones de ejemplo.
- 🔴 Constante única `WHATSAPP_NUMERO` + botones con mensaje prellenado por pantalla.
- 🟠 Paleta e tipografía HPC (`#0e4f55`, `#f5f1e8`, `#c98e3f`, Fraunces + DM Sans).
- 🟠 Habilitar zoom y selección de texto (accesibilidad).
- 🟠 Limpiar dependencias de AI Studio y renombrar el paquete.
- 🟠 PWA: `manifest.webmanifest`, íconos, service worker.
- 🟠 Conectar subdominio en Vercel + DNS en Hostinger (`05-guia-despliegue.md`).

## Bot
- 🟠 Corregir `cajaureka.com.ar` → `cajaeureka.com.ar` en `lib/textos.js` (verificar).
- 🟠 Derivación a una persona: pausar el bot cuando responde alguien del equipo.
- 🟠 Canal monitoreado para alertas de riesgo (plantilla aprobada).

## Más adelante
- 🟢 Panel de admisión sobre la hoja 'Demanda' / Supabase.
- 🟢 Portal del profesional + migrar la Ficha Profesional.
- 🟢 Triage asistido (zona, modalidad, edad, temática, exclusiones).
- 🟢 Empaquetar con Capacitor para Play Store / App Store.
- 🟢 Completar `03-manual-de-uso.md`.
