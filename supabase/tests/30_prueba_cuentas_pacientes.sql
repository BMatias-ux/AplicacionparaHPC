-- Pruebas de la migración 09 (cuentas de pacientes). Correr DESPUÉS de 20_prueba_acceso_profesionales.sql.
-- Cada bloque dice el resultado esperado. Uso: ver supabase/README.md
\set ON_ERROR_STOP 0

\echo '--- ESPERADO: alta OK de paciente con código (sin origen) y con Google (metadatos de Google)'
insert into auth.users (id, email, raw_user_meta_data) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'paciente.uno@ejemplo.com', '{"origen":"pacientes"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'paciente.dos@gmail.com', '{"full_name":"Paciente Dos","iss":"https://accounts.google.com"}');
select email from auth.users where id::text like 'bbbbbbbb%' order by email;

\echo '--- ESPERADO: alta OK de un aspirante (cargado sin habilitar) como paciente, SIN vincular ni rol'
insert into auth.users (id, email) values ('bbbbbbbb-0000-0000-0000-000000000003', 'aspirante@ejemplo.com');
select count(*) as roles_aspirante from usuarios_roles where usuario_id = 'bbbbbbbb-0000-0000-0000-000000000003';

\echo '--- ESPERADO: al habilitarlo, se vincula solo: rol profesional = 1'
update accesos_profesionales set habilitado = true where email = 'aspirante@ejemplo.com';
select count(*) as roles_aspirante from usuarios_roles where usuario_id = 'bbbbbbbb-0000-0000-0000-000000000003' and rol = 'profesional';
update accesos_profesionales set habilitado = false where email = 'aspirante@ejemplo.com';

-- Un paciente del bot con su WhatsApp verificado (lo carga el bot con la service_role).
insert into pacientes (id, nombre, telefono, origen) values ('cccccccc-0000-0000-0000-000000000009', 'Persona del bot', '5493870000000', 'bot');

set role authenticated;
set test.uid = 'bbbbbbbb-0000-0000-0000-000000000001';

\echo '--- ESPERADO: ERROR RLS (sin declarar mayor de edad no crea perfil)'
insert into pacientes (nombre) values ('Paciente Uno');

\echo '--- ESPERADO: INSERT OK; telefono queda NULL aunque lo mande, origen portal, consentimiento con fecha'
insert into pacientes (nombre, telefono, telefono_portal, mayor_de_edad, usuario_id, origen)
  values ('Paciente Uno', '5493870000000', '387 555-1111', true, 'bbbbbbbb-0000-0000-0000-000000000002', 'bot');
select nombre, telefono, telefono_portal, origen, usuario_id = auth.uid() as es_mio, consentimiento_at is not null as con_consentimiento from pacientes;

\echo '--- ESPERADO: ERROR (un segundo perfil para el mismo usuario)'
insert into pacientes (nombre, mayor_de_edad) values ('Otro perfil', true);

\echo '--- ESPERADO: 1 fila (sólo ve su perfil, no el del bot)'
select count(*) from pacientes;

\echo '--- ESPERADO: UPDATE 1 y telefono sigue NULL (no puede escribir el verificado)'
update pacientes set nombre = 'Paciente Uno Editado', telefono = '5493870000000' where usuario_id = auth.uid();
select nombre, telefono from pacientes;

\echo '--- ESPERADO: INSERT OK (registro de ánimo propio) y ERROR check (ánimo 9)'
insert into registros_animo (paciente_id, animo, emociones, nota) values (mi_paciente_id(), 4, '{tranquilidad}', 'Buen día');
insert into registros_animo (paciente_id, animo) values (mi_paciente_id(), 9);

\echo '--- ESPERADO: ERROR RLS (registro de ánimo a nombre del paciente del bot)'
insert into registros_animo (paciente_id, animo) values ('cccccccc-0000-0000-0000-000000000009', 3);

\echo '--- ESPERADO: 1 aviso (bienvenida) y ERROR RLS al intentar crear uno'
select titulo from avisos;
insert into avisos (titulo) values ('Aviso trucho');

-- Paciente Dos (Google) no ve nada del Uno.
set test.uid = 'bbbbbbbb-0000-0000-0000-000000000002';
\echo '--- ESPERADO: 0 perfiles y 0 registros de ánimo ajenos'
select (select count(*) from pacientes) as perfiles, (select count(*) from registros_animo) as animo;

\echo '--- ESPERADO: Uno ve un aviso personal y Dos no'
reset role;
insert into avisos (titulo, paciente_id) select 'Sólo para Uno', id from pacientes where usuario_id = 'bbbbbbbb-0000-0000-0000-000000000001';
set role authenticated;
select count(*) as avisos_de_dos from avisos;
set test.uid = 'bbbbbbbb-0000-0000-0000-000000000001';
select count(*) as avisos_de_uno from avisos;

\echo '--- ESPERADO: anon no ve registros de ánimo (ERROR permiso o 0)'
reset role;
set role anon;
set test.uid = '';
select count(*) from registros_animo;

\echo '--- ESPERADO: la profesional Uno (del equipo) NO puede borrar su cuenta desde acá: ERROR CUENTA_DEL_EQUIPO'
reset role;
set role authenticated;
set test.uid = 'aaaaaaaa-0000-0000-0000-000000000001';
select borrar_mi_cuenta();

\echo '--- ESPERADO: Uno borra su cuenta: desaparecen perfil, ánimo, aviso personal y usuario'
set test.uid = 'bbbbbbbb-0000-0000-0000-000000000001';
select borrar_mi_cuenta();
reset role;
select (select count(*) from pacientes where nombre like 'Paciente Uno%') as perfil,
       (select count(*) from registros_animo) as animo,
       (select count(*) from avisos where titulo = 'Sólo para Uno') as aviso_personal,
       (select count(*) from auth.users where id = 'bbbbbbbb-0000-0000-0000-000000000001') as usuario,
       (select count(*) from pacientes where telefono = '5493870000000') as paciente_del_bot_intacto;

\echo '--- ESPERADO: la sección Profesionales sigue rechazando correos no habilitados'
insert into auth.users (email, raw_user_meta_data) values ('otro.intruso@ejemplo.com', '{"origen":"profesionales"}');
