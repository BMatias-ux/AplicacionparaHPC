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

## 28/09/2026 — Fase 0 cerrada (merge) y Fase 1 paso 1.3 (bot)

**Hecho:** PR #1 del portal mergeado a `main` (Fase 0.2). En `bot-hpc`, PR #7 con soporte 360dialog, pausa
automática por echo (`smb_message_echoes`), comando `#bot`, atajos del portal, corrección `cajaeureka` y prueba de
mesa (`npm test`, 13 comprobaciones OK). Compatible hacia atrás: sin `D360_API_KEY` funciona como hoy.
Se detectó que el merge del PR #1 se hizo antes de los últimos 4 commits de docs de la rama; se incorporaron a `main` hoy.
**Pendiente:** dominio `portal` (0.3–0.4), Business Portfolio de HPC (1.1), cuenta 360dialog (1.2), merge PR #7.

## 28/09/2026 (2) — Dominio `portal` en producción (Fase 0.3 y 0.4)

**Hecho:** dominio agregado al proyecto `app-hpc` en Vercel (verificado sin TXT). Matías creó el CNAME `portal` en
Hostinger apuntando a `1d47bbe66a4308d1.vercel-dns-017.com`. Comprobado: DNS resuelve, Vercel "Valid Configuration",
`/`, `/manifest.webmanifest`, `/sw.js` e íconos responden 200 por HTTPS.
**Pendiente de Fase 0:** 0.5 prueba de instalación en celular, 0.6 envío a Laura con el aviso de urgencias.

## 28/09/2026 (3) — Fase 2: base de datos y fichas

**Hecho:** esquema de Supabase con permisos por fila, vista pública que aplica la autorización de cada profesional,
trigger de campos protegidos, pruebas de permisos en Postgres local, importador de la planilla "HPC · Fichas
Profesionales 2026" (sin datos personales en git) y sección "Equipo" en el portal con filtros. Detalle en
`etapas/etapa-03-base-de-datos-y-fichas.md`. Se corrigieron dos problemas encontrados al probar: la clave de
`usuarios_roles` no admitía roles sin zona, y un profesional podía darse de baja a sí mismo.
**Pendiente:** crear el proyecto de Supabase, variables en Vercel, importar la planilla.

## 28/09/2026 (4) — Supabase en producción

**Decisión de Matías:** usar su cuenta personal de Supabase (HPC no tiene). Se creó una organización aparte (D-13).
**Hecho (Claude, desde el navegador de Matías):** organización "Fundación HPC" (Free), proyecto `hpc` en São Paulo con
contraseña generada por Supabase y "Enable automatic RLS" activado; migraciones ejecutadas en el SQL Editor (bajadas
del repo, idénticas a las de la rama). Verificado: 9 zonas, 3 especialidades, 7 poblaciones, 15 tablas todas con RLS,
28 políticas, vista pública. Prueba de permisos con la clave pública y dos fichas temporales: la vista mostró sólo la
autorizada y sin foto; tablas privadas y consultas, 0 filas. Datos de prueba borrados. Variables cargadas en Vercel.
**Pendiente:** merge del PR #2, importar la planilla de fichas, guardar la contraseña de la base.

## 28/09/2026 (5) — Fichas importadas (Fase 2.3)

**Hecho (Matías):** merge del PR #2 (deploy de producción `b41e303` en READY), exportación de la planilla "HPC · Fichas
Profesionales 2026" a CSV, `node scripts/importar-fichas.mjs` (33 profesionales tras deduplicar por correo) y ejecución
de `datos/importacion.sql` en el SQL Editor ("Success").
**Verificado (Claude, con la clave pública):** 30 fichas visibles (las 3 restantes marcaron "No publicar"): 28 de
Psicología y 2 de Psiquiatría; todas con presentación, temáticas y población; ninguna con foto (las fotos pasan a
Storage en la Fase 3). Por zona: Córdoba 10, CABA 4, Tucumán 4, Santa Fe 3, Neuquén 2, Salta 2, Buenos Aires Sur 1,
Oeste 1, Norte 1, sin zona 2 ("Otra / a definir"). Tablas privadas (`profesionales`, `profesionales_privado`,
exclusiones, pacientes, consultas): 0 filas con la clave pública.
**A revisar con Laura:** Córdoba aparece con 10 fichas cuando históricamente eran 1–2; las 2 fichas sin zona.
