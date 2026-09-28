# 01 · Especificación

## Objetivo

Una aplicación que automatice los procesos de la Fundación con **pacientes** y con **profesionales**,
conectada al **bot de WhatsApp** que ya atiende la primera consulta. El paciente entra por WhatsApp o
por la app; el equipo deriva; el profesional recibe el caso.

## Usuarios

| Rol | Qué necesita |
|---|---|
| Paciente / consultante | Pedir turno, ver sus turnos, hablar con el equipo por WhatsApp, recursos y actividades |
| Equipo de admisión | Ver las consultas que entran (bot + app), derivar, seguir el estado, recibir alertas de riesgo |
| Profesional | Ver sus casos asignados, cupos, disponibilidad, mantener su ficha |
| Coordinación / dirección | Tablero de demanda vs. oferta por zona (ya existe como análisis manual) |

## Módulos y hoja de ruta

> El plan detallado por fases, con tiempos y costos, está en `07-plan-de-trabajo.md`.

| Versión | Módulo | Estado |
|---|---|---|
| v1 | **Portal informativo** + contacto por WhatsApp (sin registro ni datos) | Etapa 1, en revisión |
| v2 | **Acceso para profesionales** (independiente del portal público) | Proyectado, ver abajo |
| v2/v3 | **Pagos con Mercado Pago** | Proyectado, ver abajo |
| futuro | Panel de admisión, triage, portal del paciente con turnos | A definir |

Detalle de los módulos:

1. **Portal del paciente** — en v1 es informativo. La maqueta original (onboarding, turnos, mis datos) se retiró; vuelve cuando haya backend.
2. **Contacto por WhatsApp** — botón a WhatsApp con el bot, con mensaje prellenado según la pantalla (ver *Integración con el bot*).
3. **Panel de admisión** — bandeja de consultas (hoy viven en la hoja 'Demanda' que llena el bot) con estados y derivación.
4. **Portal del profesional** — casos asignados y la ficha profesional (hoy es un formulario HTML + Apps Script).
5. **Triage** — sugerir profesionales según zona, modalidad, edad, temática y exclusiones (los datos ya se relevan con la Ficha Profesional).

## Arquitectura

- **Tipo:** aplicación web instalable (**PWA**), responsive (celular y computadora). Publicación en tiendas
  queda para más adelante con **Capacitor**, reutilizando el mismo código. Ver decisión D-01.
- **Frontend:** React + Vite + TypeScript + Tailwind v4.
- **Hosting:** Vercel (equipo `bmatias-ux`), en `portal.habilidadesparaelcambio.com.ar`.
- **Datos:** v1 no guarda nada de nadie. Para v2 hace falta backend con autenticación.
  Candidato: **Supabase** (Postgres + Auth + Row Level Security), que ya se usa en GEMA. A decidir (D-04).
- **Bot:** repo aparte (`bot-hpc`), función serverless en Vercel + WhatsApp Cloud API + Upstash Redis + Apps Script → hoja 'Demanda'.

## Integración con el bot de WhatsApp

Tres niveles, de menor a mayor esfuerzo:

1. **Enlace directo (inmediato).** Botón "Escribinos por WhatsApp" → `https://wa.me/<numero>?text=<mensaje>`.
   El mensaje prellenado dispara el menú del bot (cualquier mensaje lo hace). Se puede mandar un texto
   distinto por pantalla (ej. "Hola, quiero pedir un turno" desde Turnos).
2. **Datos compartidos.** La app lee/escribe la misma base que el bot (hoy la hoja 'Demanda'; a futuro Supabase),
   para que una consulta iniciada en WhatsApp aparezca en el panel y viceversa.
3. **Derivación a una persona (handoff).** El bot atiende, junta datos y en algún punto pasa la conversación a
   una persona del equipo. El bot ya tiene un estado `pausado` (usado por el protocolo de riesgo) que sirve de base:
   al derivar, se pausa el bot para ese número y contesta la persona.

### El número de WhatsApp: punto clave

El pedido es que el bot funcione **sobre el mismo número que usa el equipo**. Históricamente un número en la
Cloud API no podía seguir usándose en la app WhatsApp Business. Meta habilitó la **coexistencia**
(mismo número en la app Business y en la Cloud API), lo que permitiría que el bot conteste y el equipo
siga respondiendo desde el celular. **Verificar en la documentación vigente de Meta** antes de migrar:
requisitos, países habilitados, qué se sincroniza y cómo avisa el webhook cuando responde una persona
(eso es lo que permitiría pausar el bot automáticamente). No se toca el número hasta confirmarlo.

## Proyección: acceso independiente para profesionales

Objetivo: que cada profesional de la red tenga su propio ingreso, separado del portal público.

- **Dónde:** o una sección con login dentro del portal (`portal.../#/profesionales`), o una app aparte en otro
  subdominio (ej. `equipo.habilidadesparaelcambio.com.ar`). Recomendación: **app aparte**, porque el público y el equipo
  no comparten nada de la interfaz y así un error en una no expone a la otra. A decidir (D-08).
- **Login:** Supabase Auth con enlace mágico por correo (sin contraseñas que olvidar).
- **Roles:** `profesional` (ve sólo lo suyo), `admision` (ve y deriva todas las consultas), `coordinacion` (ve su zona), `admin`.
  Se aplica con Row Level Security en la base, no sólo escondiendo botones.
- **Qué ve el profesional:** su ficha (hoy formulario HTML + Apps Script → migraría a esta base), sus cupos y
  disponibilidad, las derivaciones que le asignaron y su estado.
- **Datos de partida:** la hoja "HPC · Fichas Profesionales 2026" y la hoja 'Demanda' del bot.

## Proyección: integración con Mercado Pago

Casos de uso posibles (a priorizar con la Fundación): entrevista de admisión DBT, sesiones, grupos mensuales,
formaciones anuales y membresía.

- **Producto de Mercado Pago:** *Checkout Pro* para cobros puntuales (link de pago o botón) y *suscripciones* para
  cuotas mensuales (grupos DBT, membresía). Verificar en la documentación vigente de Mercado Pago antes de construir.
- **Arquitectura:** el precio **nunca** sale del navegador. Una función en Vercel crea la preferencia de pago con el
  Access Token (variable de entorno), Mercado Pago avisa por **webhook** cuando se aprueba, y la función registra el pago
  en la base (Supabase). La confirmación de la pantalla de "gracias" no cuenta como pago: sólo el webhook.
- **Requisito previo:** backend (D-04). Sin base de datos no hay dónde registrar a quién corresponde cada pago.
- **Precios en un solo lugar:** hoy viven en el bot (`lib/textos.js`). Al integrar pagos, conviene moverlos a la base y
  que el bot, la app y los links de pago lean de ahí.
- Base técnica: el material de Mercado Pago que Matías ya viene armando para integraciones Node.js + Vercel + Supabase.

## Decisiones

| ID | Fecha | Decisión | Por qué | Estado |
|---|---|---|---|---|
| D-01 | 25/09/2026 | Web app (PWA) primero; tiendas después con Capacitor | Sin revisión de tiendas, cambios al instante, profesionales usan computadora, mismo código sirve para empaquetar | Aprobada |
| D-02 | 25/09/2026 | Publicar en **`portal.habilidadesparaelcambio.com.ar`** | El raíz es el WordPress del sitio institucional | Aprobada |
| D-03 | 25/09/2026 | Quitar el marco de teléfono y el selector Móvil/Expandido; layout responsive real | Es un simulador de presentación de AI Studio, no una app | Hecha (Etapa 1) |
| D-04 | 28/09/2026 | Backend y autenticación: **Supabase** | Postgres + Auth + RLS, gratis al inicio, ya usado en GEMA. Esquema en `supabase/` | Aprobada (Fase 2 en curso) |
| D-13 | 28/09/2026 | Supabase en una **organización propia "Fundación HPC"** dentro de la cuenta de Matías, plan Free | HPC no tiene cuenta; facturación separada para trasladar el costo; el proyecto se puede transferir a una cuenta de HPC sin cambiar URL ni claves | Aprobada |
| D-12 | 28/09/2026 | Fichas públicas salen de la planilla del formulario nuevo, filtradas por la autorización de cada profesional; la vista de la base aplica esa regla | Único origen con consentimiento explícito | Aprobada |
| D-05 | 25/09/2026 | Número único de WhatsApp: **+54 9 387 523-3693** (el del bot) | Unifica bot, app y equipo | Aprobada; la coexistencia con la app Business sigue a verificar con Meta |
| D-06 | 25/09/2026 | La app **no muestra precios**; se informan por WhatsApp | Cambian seguido y ya viven en el bot: dos copias = una desactualizada | Hecha (Etapa 1) |
| D-07 | 25/09/2026 | No listar presencial en **Zona Norte ni Salta** | Sin profesionales cargados al corte de sept. 2026 y hubo reclamo por publicidad de Salta | Hecha; revisar al sumar equipo |
| D-08 | — | Acceso de profesionales: ¿dentro del portal o app aparte? | Ver *Proyección* | Pendiente |
| D-09 | 25/09/2026 | v1 = información + WhatsApp, sin registro ni datos personales | Decisión de Matías; evita guardar datos de salud sin backend | Aprobada |
| D-10 | 26/09/2026 | Coexistencia del bot con el equipo a través de **360dialog** (proveedor), no como Tech Provider ni con Jelou | M Digital no tiene verificación de negocio en Meta; 360dialog conserva el bot propio en Vercel (Jelou obligaba a rehacerlo adentro; Vapi es sólo voz) | Aprobada |
| D-11 | 26/09/2026 | Recordatorios de turno por **WhatsApp (plantilla de utilidad)** como canal principal; Web Push como refuerzo | En iPhone el push sólo funciona con la PWA instalada; WhatsApp llega siempre | Propuesta |

## Marco legal a tener presente

Datos de salud = datos sensibles (Ley 25.326 de Protección de Datos Personales; Ley 26.529 de Derechos del Paciente).
Implica: consentimiento informado, acceso restringido por rol, no guardar datos clínicos en el dispositivo sin protección,
no mandar datos clínicos a plataformas de anuncios. No es asesoramiento legal: validar con quien corresponda en la Fundación.

### D-14 · Consentimiento antes de pedir datos (28/09/2026)
El bot pide "Acepto / No acepto" antes de la primera pregunta, en todos los flujos (clínico y comercial). Sin
"Acepto" no se registra nada. El aviso completo vive en el portal (`#privacidad`) y el bot lo enlaza. Excepción: el
protocolo de riesgo registra la alerta aunque no haya consentimiento, para proteger la vida; está dicho en el aviso.
