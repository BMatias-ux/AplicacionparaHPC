-- Pruebas de la migración 10: una cuenta del equipo crea su propio perfil en Mi espacio.
-- Correr sobre una base con TODAS las migraciones aplicadas (incluida la 10).
\set ON_ERROR_STOP 0
insert into accesos_profesionales (email, nombre, habilitado, es_admin) values ('admin@ejemplo.com', 'Admin Prueba', true, true);
insert into auth.users (id, email, raw_user_meta_data) values ('dddddddd-0000-0000-0000-000000000001', 'admin@ejemplo.com', '{"origen":"profesionales"}');
insert into pacientes (id, nombre, telefono) values ('eeeeeeee-0000-0000-0000-000000000001', 'Paciente cargado por admisión', '5493879999999');

set role authenticated;
set test.uid = 'dddddddd-0000-0000-0000-000000000001';

\echo '--- ESPERADO: es_equipo = t'
select es_equipo();

\echo '--- ESPERADO: alta propia como hacía el portal viejo (sin usuario_id) queda VINCULADA, origen portal'
insert into pacientes (nombre, email, mayor_de_edad) values ('Admin Prueba', 'admin@ejemplo.com', true);
select nombre, origen, usuario_id = auth.uid() as es_mio, consentimiento_at is not null as consentimiento from pacientes where email = 'admin@ejemplo.com';

\echo '--- ESPERADO: mi_paciente_id no es null y el registro de ánimo se guarda (INSERT 0 1)'
select mi_paciente_id() is not null as tiene_perfil;
insert into registros_animo (paciente_id, animo, nota) values (mi_paciente_id(), 3, 'prueba');

\echo '--- ESPERADO: el equipo sigue pudiendo cargar un paciente de OTRA persona sin quedar vinculado'
insert into pacientes (nombre, telefono) values ('Otro paciente', '5493878888888');
select nombre, usuario_id is null as sin_usuario, telefono from pacientes where nombre = 'Otro paciente';

\echo '--- ESPERADO: el equipo sigue pudiendo corregir el teléfono verificado de un paciente ajeno'
update pacientes set telefono = '5493877777777' where id = 'eeeeeeee-0000-0000-0000-000000000001';
select telefono from pacientes where id = 'eeeeeeee-0000-0000-0000-000000000001';

\echo '--- ESPERADO: en su propio perfil, el admin NO puede escribir el teléfono verificado (queda null)'
update pacientes set telefono = '5493876666666' where usuario_id = auth.uid();
select telefono from pacientes where usuario_id = auth.uid();
reset role;
