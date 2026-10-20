# 10 · Docentes de las formaciones anuales

Módulo nuevo del portal (20/10/2026): registro de docentes, cronograma de clases, cumplimiento y encuesta de los
alumnos. Migración `supabase/migrations/20261020000011_docentes.sql`, pruebas `supabase/tests/40_prueba_docentes.sql`.

## Por qué

El viernes 16/10/2026 se suspendió por tercera vez una clase de la Formación en Trauma: la docente que se había anotado
para cubrirla canceló, y ya había cancelado otra clase un sábado anterior. El cronograma vivía en un documento de Word
de Laura Solivellas y nadie tenía el historial a mano. Laura Flynn pidió:

- un registro de docentes y de quién da cada clase;
- ser estrictos: **quien cancela una vez, queda afuera**;
- contactar individualmente a quienes se comprometieron y no ventilar lo interno en el grupo de docentes;
- que los alumnos sigan valorando a los docentes con la encuesta de calidad.

## Decisiones (Matías, 20/10/2026)

- **D-17 · Regla de 1 cancelación**: cuando una clase se marca como cancelada (por coordinación o porque el/la docente
  avisó desde el portal), la base registra la incidencia y **propone** la baja. Un/a administrador/a la confirma o la
  rechaza escribiendo el motivo (queda registrado como excepción). Nada se da de baja solo.
- **D-18 · Los docentes entran al portal** con el mismo ingreso de `#profesionales` (correo + código, después
  contraseña). Ven sólo sus clases, las confirman, cargan el enlace al material y pueden avisar que no pueden dar una
  clase. No necesitan ficha profesional.
- **Encuesta por clase** en el portal (`#encuesta?c=CODIGO`), con las mismas preguntas y escalas que la del sitio .org,
  pero atada a la clase y al docente. La encuesta del .org escribía el nombre del docente a mano y así no se podía
  sumar por docente.

## Cómo funciona

| Parte | Quién | Dónde |
|---|---|---|
| Cronograma por mes, asignar docentes, marcar dictada / cancelada, enlaces de encuesta, pedir confirmación por WhatsApp | Administradores (Matías, Laura Flynn, Laura Solivellas) | `#profesionales` → pestaña **Docentes** → Cronograma |
| Registro de docentes: datos, CV, notas internas, próximas clases, historial de cumplimiento, comentarios de alumnos, ranking por puntaje | Administradores | Pestaña **Docentes** → Docentes |
| Bajas para resolver | Administradores | Arriba de todo en la pestaña Docentes |
| Mis clases: confirmar, material, "no puedo dar esta clase", promedio de la encuesta (desde 3 respuestas) | Cada docente | `#profesionales` → **Mis clases** |
| Encuesta | Alumnos, sin cuenta | `#encuesta` (general) o `#encuesta?c=CODIGO` (una clase) |

Estados de una clase: *Sin confirmar* → *Confirmada* → *Dictada*; o *Cancelada (avisó)*, *Cancelada sin aviso*
(estas dos aplican la regla) y *Suspendida por HPC* (no cuenta contra el docente). Sin docente = **vacante**.

Al **confirmar una baja**: la persona pierde el acceso al instante y sus clases futuras quedan vacantes con la nota
"Reasignar". Sacarla del grupo de WhatsApp de docentes sigue siendo manual.

Anonimato de la encuesta: no se pide nombre ni correo; la base guarda sólo la fecha (sin hora); el/la docente ve
promedios desde 3 respuestas y no ve los comentarios.

## Puesta en marcha

1. Mergear el PR y esperar el deploy de Vercel.
2. Supabase → SQL Editor → pegar `supabase/migrations/20261020000011_docentes.sql` → Run.
3. Supabase → SQL Editor → pegar `datos/carga-cronograma-docentes.sql` (no está en GitHub: lo genera Claude desde el
   documento de Laura S.) → Run. Carga 19 docentes y 100 clases (octubre 2026 a junio 2027).
4. En la pestaña Docentes: completar correo y WhatsApp de cada docente (no estaban en el documento).
5. Marcar las clases de octubre que ya pasaron (botón **Se dictó**, o Editar → estado).
6. Pasar el enlace de cada clase a sus alumnos (botón **Enlace de la encuesta**) o el enlace general.
7. Cuando el portal tenga respuestas, reemplazar la encuesta del sitio .org por un enlace a `#encuesta`.

## Pendientes

- Confirmar qué día de Trauma Abril (15 y 16/10) dio cada docente: el documento no lo decía.
- Verificar apellidos que aparecían escritos de dos formas (ver notas de cada docente).
- Las respuestas anteriores de la encuesta del .org siguen en su hoja de Google (cuenta de HPC): no se migran.
- A futuro: recordatorio automático por WhatsApp a los docentes 7 días antes de cada clase.
