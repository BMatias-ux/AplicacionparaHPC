# 07 · Plan de trabajo — Portal HPC + Bot con convivencia

**Fecha:** 26/09/2026 · **Decisión de base:** 360dialog con coexistencia (D-10), portal en `portal.habilidadesparaelcambio.com.ar`, backend Supabase (D-04, ver abajo).

Los tiempos son de trabajo efectivo de Matías con apoyo de Claude, asumiendo dedicación parcial (media jornada por día).
Las esperas de terceros (Meta, 360dialog, aprobación clínica) van aparte y están marcadas con ⏳.

## Resumen de fases

| Fase | Qué entrega | Duración de trabajo | Esperas ⏳ | Costo nuevo |
|---|---|---|---|---|
| **0. Publicar lo hecho** | Portal v1 en `portal.habilidadesparaelcambio.com.ar` | 1 día | DNS: minutos a horas | $0 |
| **1. Bot en el número del equipo** | Bot + equipo conviviendo en el `+54 9 387 523-3693` | 3–4 días | Alta 360dialog: 1–3 días · aprobación clínica | 360dialog €49/mes desde el alta + Meta por conversación |
| **2. Base de datos y fichas** | Supabase con profesionales y pacientes; fichas públicas por especialidad en el portal | 6–8 días | — | Supabase gratis al inicio (Pro USD 25/mes cuando haga falta) |
| **3. Acceso de profesionales** | Cada profesional entra y mantiene su ficha (foto, cursos, modalidad, cupos) | 6–8 días | — | $0 adicional |
| **4. Turnos y notificaciones** | Agenda del paciente y recordatorio del turno (WhatsApp + notificación en la app) | 8–10 días | Plantilla de WhatsApp aprobada por Meta: 1–2 días | Plantillas de utilidad de Meta (centavos de USD por envío) |
| **5. Admisión y derivación** | Bandeja del equipo: consultas del bot y del portal, asignación al profesional | 6–8 días | — | $0 adicional |

Total de trabajo: **30–40 días efectivos**, unas 8 a 10 semanas de calendario a dedicación parcial. Las fases 1 y 2
pueden ir en paralelo (una es bot, la otra es portal), lo que acorta el calendario.

## Costos mensuales proyectados (para Laura)

| Concepto | Cuándo empieza | Monto |
|---|---|---|
| 360dialog, plan Regular, 1 número | Fase 1, el día que se da de alta el canal | €49/mes (~USD 55) |
| Meta, conversaciones de WhatsApp | Ya existe hoy con el bot actual | Variable: las iniciadas por el usuario en la ventana de 24 h son gratis en servicio; las plantillas de utilidad (recordatorios) cuestan centavos por envío. Estimar con el volumen real de la hoja 'Demanda' |
| Supabase | Fase 2 | Gratis hasta 500 MB y 50.000 usuarios activos; Pro USD 25/mes cuando se supere o se necesiten copias de seguridad diarias |
| Vercel | Ya lo paga M Digital (plan Pro) | $0 adicional para HPC |
| Dominio y hosting | Ya los paga HPC en Hostinger | $0 adicional |

**Momento del pago de 360dialog:** no hay que pagar nada para pedir cotización ni para crear la cuenta. Se paga al
**crear el canal** (Fase 1, paso 1.3), que es cuando el número queda vinculado. Recomendación: no crear el canal
hasta tener el Business Portfolio de HPC confirmado y la ventana de corte agendada, así el primer mes no se
desperdicia esperando.

---

## Fase 0 · Publicar lo hecho (1 día)

Objetivo: que `portal.habilidadesparaelcambio.com.ar` esté en el aire con la v1.

| Paso | Qué | Quién | Detalle |
|---|---|---|---|
| 0.1 | Revisar la vista previa del PR #1 en celular y computadora | Matías | Anotar cambios de texto o diseño |
| 0.2 | ✅ Merge del PR #1 a `main` | Matías | Hecho 28/09 |
| 0.3 | ✅ Agregar `portal.habilidadesparaelcambio.com.ar` en Vercel | Claude | Hecho 28/09 |
| 0.4 | ✅ CNAME `portal` en Hostinger | Matías | Hecho 28/09 |
| 0.5 | Verificar HTTPS y que la PWA se instale | Claude | Captura desde el celular |
| 0.6 | Enviar el enlace a Laura con el aviso de urgencias marcado para su aprobación | Matías | ⏳ aprobación clínica |

**El dominio se configura ahora**, en esta fase. No depende de nada más y cada día que pasa la app se sigue
compartiendo con la URL de Vercel.

## Fase 1 · Bot en el número del equipo (3–4 días + esperas)

Objetivo: el bot atiende el primer contacto en el `+54 9 387 523-3693`; cuando una persona del equipo responde
desde su celular, el bot se calla para esa conversación.

| Paso | Qué | Quién | Detalle |
|---|---|---|---|
| 1.1 | Confirmar el **Business Portfolio de Meta** de HPC: a nombre de la Fundación, razón social, dirección, web y teléfono completos | Matías con Laura | Requisito duro de la coexistencia |
| 1.2 | Enviar el pedido de cotización a 360dialog y crear la cuenta | Matías | `historico/2026-09-26-pedido-cotizacion-bsp.md`. ⏳ 1–3 días |
| 1.3 | Adaptar `bot-hpc`: envío por el endpoint de 360dialog, nuevas variables de entorno, manejo de `smb_message_echoes` (pausa por humano), comando `#bot` para devolver la conversación, detección de mensajes del portal | Claude + Matías | 2 días. Se prueba primero en el número actual del bot |
| 1.4 | Corregir `cajaureka` → `cajaeureka` y dejar el aviso de urgencias según lo apruebe Laura | Claude | 1 hora |
| 1.5 | Exportar el historial de WhatsApp del equipo (respaldo) | Equipo HPC | Antes del QR |
| 1.6 | **Ventana de corte** (viernes a la tarde): crear el canal en 360dialog → pago → escanear el QR desde la app del equipo → apuntar el webhook a Vercel | Matías + una persona del equipo con el celular | 1 hora |
| 1.7 | Pruebas cruzadas: escribir desde un número externo, responder desde la app, verificar que el bot se pausa y que la hoja 'Demanda' recibe la consulta | Matías + equipo | Media jornada |
| 1.8 | Capacitación al equipo (15 min) y sección en `03-manual-de-uso.md` | Matías | Cómo retomar/devolver conversaciones, qué significa `#bot`, la app debe abrirse cada 13 días |

Resultado: el número del bot actual se libera (se puede dar de baja de la app de Meta o guardar para pruebas).

## Fase 2 · Base de datos y fichas de profesionales (6–8 días)

Objetivo: los datos dejan de vivir en planillas sueltas y las fichas de profesionales se publican en el portal por
especialidad.

**Decisión D-04, propuesta firme: Supabase.** Postgres con autenticación y Row Level Security incluidos, plan
gratuito para empezar, y es lo que Matías ya usa en GEMA. Alternativas descartadas: Firebase (modelo de datos
menos apto para consultas cruzadas de zona/especialidad/cupos) y seguir en Google Sheets (sin permisos por fila).

| Paso | Qué | Detalle |
|---|---|---|
| 2.1 | ✅ Modelo de datos | Tablas: `profesionales`, `especialidades`, `zonas`, `profesional_zona`, `pacientes`, `consultas` (lo que hoy es la hoja 'Demanda'), `turnos`, `usuarios_roles`. Datos clínicos separados de los datos de contacto |
| 2.2 | ✅ Políticas de acceso (RLS) | Público: sólo campos de ficha publicada. Profesional: su fila. Admisión: consultas y derivaciones. Coordinación: su zona. Admin: todo |
| 2.3 | ✅ Migración inicial de fichas (28/09) | 30 fichas públicas cargadas. La hoja 'Demanda' se incorpora en el paso 2.5 |
| 2.4 | ✅ Fichas públicas en el portal (en producción) | Nueva sección "Equipo": listado por especialidad y zona, ficha con foto, formación, modalidad, población que atiende. Sólo lo que el profesional marcó como público |
| 2.5 | ✅ El bot escribe en Supabase además de la hoja (28/09) | La hoja 'Demanda' queda como respaldo un tiempo |
| 2.6 | Consentimiento y aviso de privacidad | Texto para pacientes y profesionales (Ley 25.326). ⏳ revisión de la Fundación |

## Fase 3 · Acceso de profesionales (6–8 días)

Objetivo: cada profesional entra con su correo y mantiene su ficha.

| Paso | Qué | Detalle |
|---|---|---|
| 3.1 | Decisión D-08 | Propuesta: app aparte en `equipo.habilidadesparaelcambio.com.ar`, mismo repo, otra carpeta. El portal público no carga código de login |
| 3.2 | Ingreso por enlace mágico (Supabase Auth) | Sin contraseñas. Alta por invitación desde admisión |
| 3.3 | Mi ficha | Editar datos, subir foto (Supabase Storage), cursos y formación, modalidad, población, zonas, cupos disponibles, temáticas y exclusiones. Botón "publicar cambios" |
| 3.4 | Mis derivaciones | Lista de casos asignados con estado (recibido, contactado, en tratamiento, cerrado) |
| 3.5 | Migrar la Ficha Profesional actual (HTML + Apps Script) | Deja de usarse el formulario; el enlace del bot pasa a apuntar al alta en la app |

## Fase 4 · Turnos y notificaciones (8–10 días)

Objetivo: el paciente ve sus turnos y recibe un recordatorio.

| Paso | Qué | Detalle |
|---|---|---|
| 4.1 | Ingreso del paciente | Enlace mágico al correo o código por WhatsApp. Sin contraseñas |
| 4.2 | Agenda | El profesional o admisión carga el turno; el paciente lo ve en "Mis turnos" y puede pedir cambio por WhatsApp |
| 4.3 | Recordatorios por **WhatsApp** (canal principal) | Plantilla de utilidad aprobada por Meta ("Hola {{nombre}}, te recordamos tu turno con {{profesional}} el {{fecha}} a las {{hora}}"). Enviada 24 h y 2 h antes por una función programada en Vercel (cron) a través de 360dialog. ⏳ aprobación de la plantilla 1–2 días |
| 4.4 | Notificaciones de la app (**Web Push**, complementario) | Funciona en Android; en iPhone sólo si la PWA está instalada en la pantalla de inicio (iOS 16.4+). Por eso WhatsApp es el canal principal y esto el refuerzo |
| 4.5 | Preferencias | El paciente elige qué recordatorios recibir y por dónde |

## Fase 5 · Admisión y derivación (6–8 días)

Objetivo: el equipo trabaja desde una bandeja y no desde la planilla.

| Paso | Qué | Detalle |
|---|---|---|
| 5.1 | Bandeja de consultas | Todo lo que entra por el bot y el portal, con estado y responsable |
| 5.2 | Sugerencia de profesional | Por zona, modalidad, población, temática, exclusiones y cupos (los datos de la ficha) |
| 5.3 | Derivar | Asigna el caso, avisa al profesional (WhatsApp plantilla o correo), crea el turno |
| 5.4 | Tablero | Demanda vs. oferta por zona, lo que hoy se hace a mano en planillas |

## Qué se decide ahora y qué después

**Ahora (para arrancar Fase 0 y 1):**
- Fecha de la ventana de corte del número (propuesta: el viernes siguiente a tener el alta de 360dialog).
- Quién del equipo tiene el celular con la app Business el día del corte.

**Al terminar la Fase 1:**
- D-04 Supabase (propuesta firme arriba).
- D-08 app de profesionales aparte.
- Texto de consentimiento y privacidad.

## Riesgos principales

| Riesgo | Mitigación |
|---|---|
| El Business Portfolio de HPC no está a nombre de la Fundación o está incompleto | Verificarlo en el paso 1.1, antes de pagar nada |
| La app del equipo se deja de abrir 13 días y la coexistencia se cae | Recordatorio en el manual y alerta si el webhook deja de recibir echoes |
| Recordatorios por WhatsApp rechazados por Meta como marketing | Redactar la plantilla como utilidad pura: sin promociones, sólo datos del turno |
| Datos de salud sin consentimiento | Nada de datos clínicos en el portal hasta el paso 2.6 aprobado |
