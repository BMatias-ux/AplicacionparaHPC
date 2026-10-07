-- Pruebas de la migración 05 (acceso de profesionales). Cada bloque dice lo esperado.
\set ON_ERROR_STOP 0
-- Datos de prueba: una ficha importada con correo, y un correo habilitado sin ficha.
insert into profesionales (id, nombre_publico, especialidad_id, zona_id) values
  ('11111111-1111-1111-1111-111111111111', 'Lic. Prueba Uno', 'psicologia', 'salta'),
  ('22222222-2222-2222-2222-222222222222', 'Lic. Prueba Dos', 'psicologia', 'caba');
insert into profesionales_privado (profesional_id, nombre_completo, email) values
  ('11111111-1111-1111-1111-111111111111', 'Prueba Uno', 'Uno@Ejemplo.com'),
  ('22222222-2222-2222-2222-222222222222', 'Prueba Dos', 'dos@ejemplo.com');
-- Simula la precarga de la migración (los datos de prueba se cargaron después).
insert into accesos_profesionales (email, nombre, profesional_id, habilitado)
  select lower(email), nombre_completo, profesional_id, true from profesionales_privado on conflict do nothing;
insert into accesos_profesionales (email, nombre, zona_id, habilitado) values ('nueva@ejemplo.com', 'Lic. Nueva Persona', 'neuquen', true);
-- Cargado pero NO habilitado (aspirante): no debe poder ingresar.
insert into accesos_profesionales (email, nombre) values ('aspirante@ejemplo.com', 'Aspirante');

-- Desde la migración 09 el registro es abierto para pacientes: el rechazo aplica sólo al
-- ingreso desde la sección Profesionales, que manda origen = 'profesionales' en los metadatos.
\echo '--- ESPERADO: ERROR CORREO_NO_HABILITADO (cargado pero sin habilitar)'
insert into auth.users (email, raw_user_meta_data) values ('aspirante@ejemplo.com', '{"origen":"profesionales"}');

\echo '--- ESPERADO: ERROR CORREO_NO_HABILITADO'
insert into auth.users (email, raw_user_meta_data) values ('intruso@ejemplo.com', '{"origen":"profesionales"}');

\echo '--- ESPERADO: alta OK y vinculada a Prueba Uno (mayúsculas no importan)'
insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000001', 'uno@ejemplo.com');
select nombre_publico, usuario_id is not null as vinculada from profesionales where id = '11111111-1111-1111-1111-111111111111';

\echo '--- ESPERADO: alta OK, ficha nueva "Lic. Nueva Persona" en neuquen, no_publicar'
insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000002', 'nueva@ejemplo.com');
select nombre_publico, zona_id, autorizacion from profesionales where usuario_id = 'aaaaaaaa-0000-0000-0000-000000000002';
select rol from usuarios_roles where usuario_id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- Ahora actuamos como la profesional Uno
set role authenticated;
set test.uid = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '--- ESPERADO: UPDATE 1 (edita su presentación)'
update profesionales set presentacion = 'Hola' where id = '11111111-1111-1111-1111-111111111111';
\echo '--- ESPERADO: UPDATE 0 (no puede editar la de Dos)'
update profesionales set presentacion = 'hack' where id = '22222222-2222-2222-2222-222222222222';
\echo '--- ESPERADO: ERROR (no puede darse de baja)'
update profesionales set activo = false where id = '11111111-1111-1111-1111-111111111111';
\echo '--- ESPERADO: INSERT OK (horario propio)'
insert into profesional_horarios (profesional_id, dia, desde, hasta, modalidad) values ('11111111-1111-1111-1111-111111111111', 1, '14:00', '18:00', 'online');
\echo '--- ESPERADO: ERROR RLS (horario ajeno)'
insert into profesional_horarios (profesional_id, dia, desde, hasta, modalidad) values ('22222222-2222-2222-2222-222222222222', 1, '14:00', '18:00', 'online');
\echo '--- ESPERADO: ERROR franja_valida'
insert into profesional_horarios (profesional_id, dia, desde, hasta, modalidad) values ('11111111-1111-1111-1111-111111111111', 1, '18:00', '14:00', 'online');
\echo '--- ESPERADO: UPDATE 1 y origen sin cambiar (ficha_2026)'
update profesionales_privado set telefono = '387', origen = 'trucho' where profesional_id = '11111111-1111-1111-1111-111111111111';
select telefono, origen from profesionales_privado where profesional_id = '11111111-1111-1111-1111-111111111111';
\echo '--- ESPERADO: 0 filas (no ve privados ajenos)'
select count(*) from profesionales_privado where profesional_id = '22222222-2222-2222-2222-222222222222';
\echo '--- ESPERADO: 0 (no ve la lista de accesos)'
select count(*) from accesos_profesionales;
\echo '--- ESPERADO: 0 (si se deshabilita, deja de ver su ficha)'
reset role;
update accesos_profesionales set habilitado = false where email = 'uno@ejemplo.com';
set role authenticated;
select count(*) from profesionales;
reset role;
