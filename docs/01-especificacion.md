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

## Módulos (propuesta, a validar)

1. **Portal del paciente** — lo que hoy existe como maqueta: onboarding, inicio, turnos, actividades, mis datos, más.
2. **Contacto por WhatsApp** — botón a WhatsApp con el bot, con mensaje prellenado según la pantalla (ver *Integración con el bot*).
3. **Panel de admisión** — bandeja de consultas (hoy viven en la hoja 'Demanda' que llena el bot) con estados y derivación.
4. **Portal del profesional** — casos asignados y la ficha profesional (hoy es un formulario HTML + Apps Script).
5. **Triage** — sugerir profesionales según zona, modalidad, edad, temática y exclusiones (los datos ya se relevan con la Ficha Profesional).

## Arquitectura

- **Tipo:** aplicación web instalable (**PWA**), responsive (celular y computadora). Publicación en tiendas
  queda para más adelante con **Capacitor**, reutilizando el mismo código. Ver decisión D-01.
- **Frontend:** React + Vite + TypeScript + Tailwind (lo que ya generó AI Studio).
- **Hosting:** Vercel (equipo `bmatias-ux`), en un subdominio de `habilidadesparaelcambio.com.ar`.
- **Datos:** hoy todo se guarda en `localStorage` del navegador (maqueta). Para datos reales hace falta
  backend con autenticación. Candidato: **Supabase** (Postgres + Auth + Row Level Security), que ya se usa en GEMA. A decidir (D-04).
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

## Decisiones

| ID | Fecha | Decisión | Por qué | Estado |
|---|---|---|---|---|
| D-01 | 25/09/2026 | Web app (PWA) primero; tiendas después con Capacitor | Sin revisión de tiendas, cambios al instante, profesionales usan computadora, mismo código sirve para empaquetar | Propuesta |
| D-02 | 25/09/2026 | Publicar en un **subdominio** (`app.` o `portal.`), no en el dominio raíz | El raíz es el WordPress del sitio institucional | Propuesta |
| D-03 | 25/09/2026 | Quitar el marco de teléfono y el selector Móvil/Expandido; layout responsive real | Es un simulador de presentación de AI Studio, no una app | Propuesta |
| D-04 | — | Backend y autenticación (Supabase u otro) | Datos de salud: no pueden vivir en `localStorage` | Pendiente |
| D-05 | — | Un solo número de WhatsApp (equipo + bot) vía coexistencia | Pedido de Matías; requiere verificar con Meta | Pendiente |

## Marco legal a tener presente

Datos de salud = datos sensibles (Ley 25.326 de Protección de Datos Personales; Ley 26.529 de Derechos del Paciente).
Implica: consentimiento informado, acceso restringido por rol, no guardar datos clínicos en el dispositivo sin protección,
no mandar datos clínicos a plataformas de anuncios. No es asesoramiento legal: validar con quien corresponda en la Fundación.
