# 04 · Pendientes

Prioridad: 🔴 bloquea · 🟠 importante · 🟢 mejora · ✅ hecho

## Etapa 1 — Portal informativo (cerrar)
- ✅ PR #1 mergeado a `main` (28/09).
- 🔴 Agregar el CNAME `portal` en Hostinger (valor que muestra Vercel, ver `05-guia-despliegue.md`).
- 🟠 **Aprobación clínica** del aviso de urgencias en Contacto (911, 135, (011) 5275-1135). Mismo pendiente que el bot.
- 🟠 Logo oficial en SVG para reemplazar la "H" provisoria (`src/components/Marca.tsx`, `public/icons/`).
- 🟢 Confirmar que las descripciones de Caja Eureka y la Fundación en Recursos son correctas.
- ✅ Marco de teléfono quitado, layout responsive, contenido real, WhatsApp único, identidad HPC, PWA, accesibilidad, limpieza de dependencias.

## Bot
- ✅ `cajaeureka` corregido (PR #7).
- ✅ Mensajes del portal saltan el menú (PR #7).
- 🟠 Verificar con Meta la **coexistencia** (mismo número en la app WhatsApp Business y en la Cloud API) antes de migrar el número del equipo.
- 🟠 Canal monitoreado para alertas de riesgo (plantilla aprobada).

## v2 — Acceso para profesionales
- 🔴 D-04: elegir backend (propuesta: Supabase).
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
