# 08 · Instructivo: inscribir la base de datos en la AAIP

**Quién:** la Fundación, como responsable de la base (Ley 25.326, art. 21). Lo hace quien tenga la **clave fiscal
nivel 2 o superior** de la Fundación (CUIT 30-71881628-5), o un apoderado autorizado en Trámites a Distancia (TAD).
**Costo:** gratuito. **Vencimiento:** no vence; sólo se modifica si cambian los datos declarados.
**Consultas:** registrobasesdedatos@aaip.gob.ar

## Paso 1 · Inscribir a la Fundación como responsable (una sola vez)

1. Entrar a **Trámites a Distancia**: https://tramitesadistancia.gob.ar con la clave fiscal de la Fundación.
2. Buscar el trámite **"Inscripción del Responsable al Registro Nacional de Bases de Datos"**.
3. En "identificación del responsable" elegir **privado**.
4. Completar el formulario y adjuntar el **estatuto** de la Fundación (y el poder, si lo hace un apoderado).
5. Confirmar. Llega por correo el **código de registro del responsable**: guardarlo, se usa en el paso 2.

Guía oficial: https://www.argentina.gob.ar/servicio/inscribir-un-responsable-de-bases-de-datos-personales-privadas

## Paso 2 · Inscribir cada base de datos

1. En TAD, buscar **"Inscripción de bases de datos privadas"**
   (https://tramitesadistancia.gob.ar/tramitesadistancia/detalle-tipo?id=1864).
2. Cargar el código de registro del responsable del paso 1.
3. Completar el formulario. Datos para tener a mano (salen del aviso de privacidad del portal y de la política
   institucional):
   - **Nombre de la base:** "Consultas y admisión de pacientes" (y, si se decide inscribirla aparte,
     "Profesionales de la red").
   - **Finalidad:** responder consultas, derivar al profesional adecuado, coordinar turnos, estadísticas internas
     anonimizadas.
   - **Datos que contiene:** identificatorios (nombre, teléfono, correo, edad, zona) y **datos sensibles de salud**
     (motivo de consulta, pregunta de riesgo).
   - **Origen:** la propia persona, por WhatsApp (con consentimiento expreso registrado con fecha y hora).
   - **Cesiones:** al profesional de la red al que se deriva; a autoridades cuando lo exija la ley.
   - **Transferencia internacional:** sí — Supabase (Brasil), Vercel, Meta, Google, Upstash (EE. UU.), como
     encargados del tratamiento.
   - **Plazo de conservación:** 24 meses las consultas sin tratamiento; 10 años la historia clínica (Ley 26.529).
   - **Seguridad:** acceso por rol (RLS), conexiones cifradas, claves individuales, datos sensibles separados.
4. Confirmar y esperar la notificación de aprobación por correo.

Guía oficial: https://www.argentina.gob.ar/registrar-bases-de-datos-personales-privadas

## Después

- Si cambia algo declarado (nuevos proveedores, nuevas finalidades, la app de profesionales de la Fase 3),
  presentar la modificación en TAD.
- Agregar el número de inscripción al aviso de privacidad (`src/screens/Privacidad.tsx`).
