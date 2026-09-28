# 02 · Bitácora

## 25/09/2026 — Arranque del proyecto y diagnóstico

**Pedido:** mejorar la app `app-hpc` (portal del paciente), publicarla bajo `habilidadesparaelcambio.com.ar`,
evaluar Play Store / App Store vs. web, integrarla con el bot de WhatsApp (mismo número que el equipo, derivación
a una persona) y documentar todo en esta carpeta como en GreenMed y Greca. Pedido textual en `historico/2026-09-25-pedido-inicial.md`.

**Hecho:**
- Revisión de los dos repos (`AplicacionparaHPC`, `bot-hpc`). Diagnóstico en `etapas/etapa-00-diagnostico.md`.
- Explicado por qué se ve mal en la computadora: marco de teléfono simulado en `App.tsx`.
- Comparadas las opciones de publicación (PWA / Capacitor / nativa) y sus costos.
- Creada esta carpeta `docs/`.

**Decidido (propuesto, a confirmar):** D-01 PWA primero, D-02 subdominio, D-03 quitar el marco. Ver `01-especificacion.md`.

**Quedó pendiente:** nombre del subdominio, número único de WhatsApp, backend/login. Ver `04-pendientes.md`.

## 25/09/2026 (2) — Etapa 1: portal informativo

**Decisiones de Matías:** subdominio `portal.habilidadesparaelcambio.com.ar`; WhatsApp único `+54 9 387 523-3693`;
v1 = información + WhatsApp; proyectar acceso independiente para profesionales e integración con Mercado Pago.
Pedido textual en `historico/2026-09-25-decisiones-etapa-1.md`.

**Hecho:** rama `etapa-1-portal-informativo` con la app reescrita. Detalle en `etapas/etapa-01-portal-informativo.md`.
Proyecciones de profesionales y Mercado Pago en `01-especificacion.md`. Decisiones D-01 a D-09 actualizadas.
Se agregó `.gitattributes` (LF) en `main`.

**Quedó pendiente:** merge a `main`, CNAME en Hostinger, aprobación clínica del aviso de urgencias, logo oficial.

## 28/09/2026 — Fase 0 cerrada (merge) y Fase 1 paso 1.3 (bot)

**Hecho:** PR #1 del portal mergeado a `main` (Fase 0.2). En `bot-hpc`, PR #7 con soporte 360dialog, pausa
automática por echo (`smb_message_echoes`), comando `#bot`, atajos del portal, corrección `cajaeureka` y prueba de
mesa (`npm test`, 13 comprobaciones OK). Compatible hacia atrás: sin `D360_API_KEY` funciona como hoy.
**Pendiente:** dominio `portal` (0.3–0.4), Business Portfolio de HPC (1.1), cuenta 360dialog (1.2), merge PR #7.
