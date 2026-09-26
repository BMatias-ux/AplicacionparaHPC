# 04 · Pendientes

Prioridad: 🔴 bloquea · 🟠 importante · 🟢 mejora · ✅ hecho

## Etapa 1 — Portal informativo (cerrar)
- 🔴 Revisar la vista previa de Vercel de la rama `etapa-1-portal-informativo` y hacer el merge a `main`.
- 🔴 Agregar el CNAME `portal` en Hostinger (valor que muestra Vercel, ver `05-guia-despliegue.md`).
- 🟠 **Aprobación clínica** del aviso de urgencias en Contacto (911, 135, (011) 5275-1135). Mismo pendiente que el bot.
- 🟠 Logo oficial en SVG para reemplazar la "H" provisoria (`src/components/Marca.tsx`, `public/icons/`).
- 🟢 Confirmar que las descripciones de Caja Eureka y la Fundación en Recursos son correctas.
- ✅ Marco de teléfono quitado, layout responsive, contenido real, WhatsApp único, identidad HPC, PWA, accesibilidad, limpieza de dependencias.

## Bot
- 🟠 Corregir `cajaureka.com.ar` → `cajaeureka.com.ar` en `lib/textos.js`.
- 🟠 Mensajes que llegan desde el portal: hoy muestran el menú igual. A futuro, detectar "(Escribo desde el portal web)" + el motivo y saltear el menú.
- 🟠 Derivación a una persona: pausar el bot cuando responde alguien del equipo.
- 🔴 Coexistencia verificada (ver `etapas/etapa-02-bot-coexistencia.md`): requiere Tech Provider o un proveedor (BSP). **Decidir camino A o B.**
- 🟠 Pedir alta de Tech Provider en Meta para M Digital y cotización a 2 proveedores con coexistencia.
- 🟠 Implementar en el bot la escucha de `smb_message_echoes` → pausa automática cuando responde una persona.
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
