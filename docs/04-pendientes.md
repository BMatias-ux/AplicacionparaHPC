# 04 · Pendientes

Prioridad: 🔴 bloquea · 🟠 importante · 🟢 mejora · ✅ hecho

## Fase 0 / Etapa 1 — Portal informativo
- ✅ PR #1 mergeado a `main` (28/09).
- ✅ Dominio `portal.habilidadesparaelcambio.com.ar` en producción (28/09): CNAME en Hostinger → `1d47bbe66a4308d1.vercel-dns-017.com`, Vercel "Valid Configuration".
- 🟠 Enviar el enlace a Laura con el aviso de urgencias para su aprobación (Fase 0.6).
- 🟠 **Aprobación clínica** del aviso de urgencias en Contacto (911, 135, (011) 5275-1135). Mismo pendiente que el bot.
- 🟠 Logo oficial en SVG para reemplazar la "H" provisoria (`src/components/Marca.tsx`, `public/icons/`).
- 🟢 Confirmar que las descripciones de Caja Eureka y la Fundación en Recursos son correctas.
- ✅ Marco de teléfono quitado, layout responsive, contenido real, WhatsApp único, identidad HPC, PWA, accesibilidad, limpieza de dependencias.

## Bot
- ✅ `cajaeureka` corregido (PR #7).
- ✅ Mensajes del portal saltan el menú (PR #7).
- ✅ D-10 decidido: **360dialog con coexistencia**. Plan en `07-plan-de-trabajo.md` (Fase 1).
- 🔴 Fase 1.1: confirmar Business Portfolio de Meta de HPC (a nombre de la Fundación, datos completos).
- 🔴 Fase 1.2: enviar cotización / crear cuenta en 360dialog (sin pagar hasta la ventana de corte).
- 🔴 Confirmar que el Business Portfolio de Meta de HPC existe a nombre de la Fundación y tiene datos completos.
- ✅ Bot adaptado a 360dialog + pausa por humano + `#bot` + atajos del portal: `bot-hpc` PR #7 mergeado (28/09).
- 🟠 Canal monitoreado para alertas de riesgo (plantilla aprobada).

## Fase 2 — Base de datos y fichas
- ✅ Esquema, permisos, importador y sección Equipo: PR `etapa-2-supabase-fichas` (28/09).
- ✅ Proyecto Supabase `hpc` creado en la organización **Fundación HPC** (Free, São Paulo), migraciones aplicadas y verificadas; variables en Vercel (28/09). D-13.
- ✅ Merge del PR #2: sección Equipo en producción (28/09).
- 🟠 Guardar la contraseña de la base en el gestor de contraseñas (si no se copió al crear, resetearla en Settings → Database).
- 🟢 Pasar la organización a plan Pro (~USD 25/mes) antes de cargar datos de pacientes (Fase 4): backups diarios y sin pausa por inactividad.
- ✅ Planilla de fichas importada: 30 fichas públicas, 3 sin publicar (28/09).
- 🟠 Revisar con Laura las zonas: Córdoba figura con 10 fichas (históricamente 1–2) y 2 fichas tienen zona "Otra / a definir" (salen sin zona).
- 🟢 Borrar la carpeta local `datos\` cuando ya no haga falta (tiene datos personales; está fuera de git).
- ✅ Paso 2.5: el bot guarda cada consulta en Supabase (y en la hoja, como respaldo). Probado en real el 28/09.
- 🟠 Paso 2.6: aviso de privacidad y consentimiento (pacientes y profesionales).

## Fase 3 — Acceso para profesionales
- ✅ D-04: Supabase (28/09).
- 🔴 D-08: ¿sección del portal o app aparte en otro subdominio?
- 🟠 Modelo de datos: profesionales, zonas, cupos, derivaciones, roles.
- 🟠 Migrar la Ficha Profesional (hoy HTML + Apps Script) a la base.

## Mercado Pago
- 🟠 Definir con la Fundación qué se cobra primero (admisión DBT, formaciones, membresía…).
- 🟠 Precios en la base como única fuente (bot, app y pagos leen de ahí).
- 🟢 Checkout Pro para cobros puntuales; suscripciones para cuotas mensuales.

## Más adelante
- 🟢 Panel de admisión sobre la hoja 'Demanda' / Supabase.
- 🟢 Triage asistido (zona, modalidad, edad, temática, exclusiones).
- 🟢 Empaquetar con Capacitor para Play Store / App Store.
- 🟢 Completar `03-manual-de-uso.md` a medida que haya funciones reales.
