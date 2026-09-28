-- 20260928000003_consultas_contacto.sql
-- Paso 2.5: el bot guarda cada consulta en `consultas`.
--
-- El flujo comercial del bot (formaciones, cursos, membresía) pide correo y un
-- teléfono de contacto que puede ser distinto del WhatsApp. La tabla no tenía dónde
-- guardarlos. `telefono` sigue siendo el número de WhatsApp desde el que escribió.
--
-- Idempotente (if not exists): se puede correr dos veces sin error.

alter table consultas add column if not exists correo text;
alter table consultas add column if not exists telefono_contacto text;

-- El canal sólo puede ser uno de estos dos: evita typos que después rompan filtros.
alter table consultas drop constraint if exists consultas_canal_valido;
alter table consultas add constraint consultas_canal_valido check (canal in ('whatsapp', 'portal'));

comment on column consultas.telefono is 'Número de WhatsApp desde el que escribió (formato internacional sin +)';
comment on column consultas.telefono_contacto is 'Teléfono que la persona escribió en el flujo comercial del bot';
comment on column consultas.canal is 'whatsapp: escribió directo · portal: llegó desde el botón del portal';
