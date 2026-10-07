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

## 28/09/2026 (6) — Paso 2.5: el bot guarda las consultas en Supabase

**Hecho (Matías):** merge del PR #7 de `bot-hpc` (360dialog + coexistencia); `npm test` en "Todo OK".
**Hecho (Claude):**
- `bot-hpc`, rama `fase-2-5-consultas-supabase`: `lib/supabase.js` guarda cada consulta en `consultas` con la
  secret key (fetch a la API REST, sin SDK). La hoja 'Demanda' se sigue escribiendo en paralelo como respaldo.
  Nuevo campo `canal` (`whatsapp` | `portal`). 6 pruebas nuevas (19 en total, todas OK).
- Migración `20260928000003_consultas_contacto.sql`: columnas `correo` y `telefono_contacto`, y restricción de
  valores de `canal`. Probada en Postgres local y **aplicada en Supabase** (verificado).
- Variable `SUPABASE_URL` cargada en Vercel (`bot-hpc`).
**Pendiente (Matías):** cargar `SUPABASE_SECRET_KEY` en Vercel (`bot-hpc`, marcada como Sensitive), merge de las dos
ramas y prueba real desde el celular.

## 28/09/2026 (7) — Prueba real del paso 2.5 y corrección

**Resultado:** la consulta de prueba (Cursos, entrada directa) llegó a Supabase con canal, opción, correo y teléfono de
contacto. **Error encontrado:** con el flujo abierto en "nombre", el mensaje del portal se guardó como nombre, porque
el atajo del portal sólo actuaba sin flujo abierto. **Corrección:** `bot-hpc` rama `fix-portal-con-flujo-abierto`,
donde un mensaje del portal siempre arranca una consulta nueva (salvo pausa por riesgo o atención humana). Prueba
nueva que falla sin el arreglo y pasa con él.
**Aclaración:** el portal apunta al número del equipo (+54 9 387 523-3693); el bot sigue en +54 9 387 637-6370 hasta
la ventana de corte (Fase 1.6). Hasta entonces, lo que llega del portal lo responde una persona.
**Reprueba con el arreglo en producción:** flujo abierto + mensaje del portal → el bot fue directo a Cursos y guardó
una sola fila: `canal = portal`, `opcion = cursos`, nombre correcto, estado `nueva`. **Paso 2.5 cerrado.**

## 28/09/2026 (8) — Paso 2.6: aviso de privacidad y consentimiento

**Pedido de Matías:** armar el borrador completo y dejarlo visible y funcionando.
**Hecho (Claude):**
- Portal: nueva sección `#privacidad` (no aparece en el menú; se llega por el pie de página, que ahora se ve también
  en celular, y por Contacto). Cubre el art. 6 de la Ley 25.326 (responsable, qué datos, finalidad, destinatarios,
  proveedores, transferencia internacional, plazo, derechos) y el art. 7/8 (datos de salud), más las dos leyendas de la
  Disposición DNPDP 10/2008 con el órgano de control actual (AAIP).
- Bot (`bot-hpc`, rama `fase-2-6-consentimiento`): antes de pedir cualquier dato, aviso corto con botones
  **Acepto / No acepto** y enlace al aviso completo. Acepto guarda la fecha; No acepto no registra nada y ofrece el
  número del equipo. 11 pruebas nuevas (30 en total).
- Migración `20260928000004_consentimiento.sql`: `consultas.consentimiento_at`. Aplicada en Supabase antes del deploy.
**Fuentes:** Ley 25.326 (Infoleg), Disposición DNPDP 10/2008, página de datos personales de la AAIP.
**Pendiente (Fundación):** revisión legal del texto, domicilio legal del responsable (`src/config.ts`,
`RESPONSABLE_DATOS.domicilio`), inscripción de la base en el Registro Nacional de Bases de Datos de la AAIP.
**Prueba real en producción (10:33):** "No acepto" → el bot confirma que no guarda datos y da el número del equipo;
no quedó ninguna fila. "Acepto" en Programa DBT → flujo clínico completo; una sola fila nueva con
`consentimiento_at` (10:34:19), edad, zona, motivo y riesgo "no". **Paso 2.6 cerrado en lo técnico**; queda la
revisión legal de la Fundación.

## 28/09/2026 (9) — Aviso alineado con la política institucional

**Fuente (Matías):** https://habilidadesparaelcambio.com.ar/politica-de-privacidad/ (vigente desde el 02/09/2026).
**Hecho:** responsable "Fundación para la Salud Mental — Habilidades para el Cambio", domicilio legal Las Heras 335,
Neuquén, CUIT 30-71881628-5 (en `src/config.ts`). Plazos iguales a los institucionales (24 meses consultas sin
tratamiento, 10 años historia clínica), mención de las Leyes 26.529 y 26.657, sección de menores y enlace a la política
institucional, que rige para todos los canales.
**Encontrado:** la política institucional promete que el asistente se identifica como automático y que se puede pedir
hablar con una persona; el bot todavía no hace ninguna de las dos cosas (pendiente anotado).

## 28/09/2026 (10) — "Hablar con una persona"

**Pedido de Matías:** que el bot hable de forma cálida y que "persona", "humano" o "hablar con alguien" lo haga dejar
de responder y avise al equipo. **Hecho** (`bot-hpc`, 40 pruebas): pausa la conversación con el mismo estado de la
coexistencia (`#bot` la devuelve), registra lo que haya si ya aceptó el aviso (prioridad `pide persona`), confirma a la
persona y avisa a `NUMERO_ALERTAS`. El saludo presenta al bot como "asistente virtual" y ofrece escribir *persona*,
porque la política institucional (punto 5) promete que el asistente no simula ser una persona.
**Encontrado:** `NUMERO_ALERTAS` no está configurado en Vercel: las alertas de riesgo y los pedidos quedan sólo en logs.

## 28/09/2026 (11) — Prueba real del aviso al equipo

Desde el número del equipo (+54 9 387 523-3693) se le escribió "Quiero hablar con una persona" al bot: el bot confirmó
el pase y a los segundos llegó al celular de Matías (`NUMERO_ALERTAS`) el aviso "🙋 Pide hablar con una persona" con el
WhatsApp de quien lo pidió. `NUMERO_ALERTAS` acepta varios números separados por coma y se cambia desde Vercel.

## 28/09/2026 (12) — Plantilla de avisos al equipo

**Aprobado por Matías:** texto de la plantilla. **Hecho (Claude, desde el navegador):** plantilla `alerta_equipo`
(Utilidad, Spanish ARG, validez 12 hs en lugar de los 10 minutos por defecto) enviada a revisión en el Administrador de
WhatsApp de la cuenta actual del bot. El bot (`bot-hpc`, 44 pruebas) manda los avisos de riesgo y de "persona" con la
plantilla y, si Meta la rechaza, como texto. `NUMERO_ALERTAS`: Matías, Laura Flynn y el 011 de la Fundación.
**Primera consulta real de riesgo** (12:03) avisada a tiempo; el equipo la contactó.

## 29/09/2026 — Novedades en el portal (banner del curso "Criar con límites")

**Pedido de Matías:** que el portal sea un canal de comunicación del ecosistema: un aviso al entrar que lleve al
nuevo curso de cursosdepsicologia.com.ar. **Hecho:** `src/novedades.ts` (lista editable de avisos, con activar/
desactivar y fechas desde/hasta) y `src/components/Novedades.tsx` (banner con el estilo de los banners de
cursosdepsicologia.com.ar, se puede cerrar y se recuerda en el navegador). Enlaces externos con UTM
(`utm_source=portal-hpc&utm_medium=banner&utm_campaign=...`) para medir las visitas. Queda preparado, desactivado, el
aviso "asistente de WhatsApp" para prender el día del corte. Segundo aviso: promo de Formaciones Anuales (50% off en las primeras tres cuotas y matrícula bonificada), en variante clara. Publicado primero como vista previa para el equipo.

## 07/10/2026 — Etapa A de "Mi espacio": cuentas de pacientes

**Pedido de Matías:** que el portal sea de autogestión para cada paciente: crearse una cuenta con su correo (cualquiera)
o con Google, y tener un espacio privado con turnos, avisos, prestaciones y ejercicios. Registro abierto, para
promocionarlo en redes. Turnos y prestaciones más adelante (Etapa B, con acceso a Medexis).
**Hecho (Claude, rama `mi-espacio-pacientes`):**
- Migración 09: registro abierto salvo para la sección Profesionales (`origen = 'profesionales'` sigue exigiendo correo
  habilitado); vinculación de fichas sólo con acceso habilitado (y automática al habilitar una cuenta existente);
  `pacientes` con permisos propios y teléfono verificado protegido; `registros_animo` privado; `avisos`; `borrar_mi_cuenta()`.
- Pantalla `#mi-espacio`: ingreso (Google detrás de `VITE_GOOGLE_ACTIVO`, código, contraseña), completar perfil con
  18+ y aceptación del aviso, pestañas Inicio / Ánimo / Ejercicios / Turnos (próximamente) / Mis datos.
- "Mi espacio" ocupa en el celular el lugar de "Formación" en la barra inferior; invitación en Inicio.
- Profesionales: el código se pide con `origen: 'profesionales'`; una cuenta sin ficha ve un aviso que la manda a Mi espacio.
- Aviso de privacidad: punto 2 bis (cuenta) y ajustes en 3, 6, 8 y 10. Service worker v7.
- Pruebas: `supabase/tests/30_prueba_cuentas_pacientes.sql` en Postgres 16 local, todo como lo esperado; `00_stub`
  ahora imita `auth.users` y `storage`. Capturas en celular y computadora con datos simulados.
**Encontrado:** `consultas.opcion` es texto libre sin restricción en las migraciones del repo, así que el bot puede
guardar `persona` / `hablar_con_persona` sin error (pendiente del 06/10 en `bot-hpc`).
**Pendiente:** ver `09-cuentas-pacientes.md` (orden de puesta en marcha, Google, aprobación del aviso, AAIP).

## 07/10/2026 (2) — Corrección: perfil de Mi espacio en cuentas del equipo

**Reporte de Matías:** con su cuenta (administrador) el espacio pedía crearse de nuevo al volver y el registro de ánimo
fallaba. **Causa:** el trigger de la migración 09 salteaba las reglas de paciente para el equipo y el perfil quedaba sin
`usuario_id`. **Hecho:** migración 10, `usuario_id` explícito en el alta desde el portal, prueba 31 (sin errores) y
regresión de las pruebas 20 y 30 (todo como lo esperado). Service worker v8. Limpieza de filas sueltas: ver `09-cuentas-pacientes.md`.
