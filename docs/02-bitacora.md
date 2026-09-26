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

## 26/09/2026 — Coexistencia del bot con el equipo

**Pedido:** aclarar que el bot debe convivir con los agentes que hoy usan el WhatsApp del equipo; traer el proyecto
del bot que está en Drive. Pregunta: ¿seguir por dominio o por diseño?

**Hecho:** localizado el documento de Drive y resumido en `etapas/etapa-02-bot-coexistencia.md`, junto con lo
verificado en la documentación de Meta: la coexistencia existe pero sólo la habilitan Tech Providers o proveedores
(BSP) vía Embedded Signup; el webhook `smb_message_echoes` permite pausar el bot cuando responde una persona.
Tres caminos planteados (A Tech Provider, B proveedor, C sin coexistencia).

**Quedó pendiente:** decidir A o B; merge del PR #1; CNAME `portal`.

## 26/09/2026 (2) — Decisión: camino B (proveedor)

**Decisión de Matías:** camino B; M Digital no tiene verificación de negocio en Meta (D-10).
**Hecho:** verificado el alta con coexistencia en 360dialog (QR desde la app, Business Portfolio de HPC con datos
completos, app abierta cada 13 días, €49/mes por número + Meta sin recargo, webhook propio con `smb_message_echoes`).
Estimados los cambios en el bot (endpoint y cabecera de envío + manejo de echoes). Redactado el pedido de cotización.
**Pendiente:** enviar cotizaciones; confirmar Business Portfolio de HPC; merge PR #1; CNAME `portal`.

## 26/09/2026 (3) — Evaluación de Jelou

**Pedido:** revisar la cuenta de Jelou de Matías (apps.jelou.ai) y su documentación para ver si sirve para la convivencia bot + equipo.
**Hecho:** revisada la cuenta (sin canales) y la documentación. Jelou tiene coexistencia nativa con pausa automática del bot
cuando responde un asesor desde la app; plan Builder USD 25/mes. El costo es rehacer el bot dentro de Jelou (Brain Studio /
Functions) porque no reenvía los mensajes a un webhook externo. Comparación con 360dialog en el archivo de la etapa 2.
**Pendiente:** consultar a Jelou (Argentina, plan, verificación del portafolio) y decidir plataforma.

## 26/09/2026 (4) — Decisión final y plan de trabajo

**Decisión de Matías:** 360dialog con coexistencia (Vapi descartado: es sólo voz; Jelou descartado: obliga a rehacer el bot).
**Pedido:** plan por fases con tiempos y costos para proyectárselo a Laura; cuándo pagar 360dialog; cuándo configurar el
dominio; base de pacientes y profesionales; recordatorios de turno; fichas por especialidad; acceso de profesionales.
**Hecho:** `07-plan-de-trabajo.md` con 6 fases (0 a 5), pasos, responsables, esperas, costos mensuales y riesgos. D-04
(Supabase) pasa a propuesta firme; D-11 recordatorios por WhatsApp. El dominio se configura en la Fase 0, ahora.
360dialog se paga al crear el canal, en la ventana de corte de la Fase 1.
