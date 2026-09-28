-- Pruebas de permisos (RLS). Correr DESPUÉS de las migraciones, en una base de prueba.
-- Cada consulta indica el resultado esperado en su título.
\set ON_ERROR_STOP 1
-- Datos de prueba (como admin del sistema)
insert into profesionales (id, nombre_publico, especialidad_id, zona_id, presentacion, foto_url, online, autorizacion, activo, usuario_id) values
 ('00000000-0000-0000-0000-000000000001','Lic. Completa','psicologia','caba','bio A','https://foto/a',true,'completo',true,'aaaaaaaa-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002','Lic. SinFoto','psicologia','ba_oeste','bio B','https://foto/b',true,'sin_foto',true,null),
 ('00000000-0000-0000-0000-000000000003','Lic. SoloNombre','psiquiatria','caba','bio C','https://foto/c',true,'solo_nombre',true,null),
 ('00000000-0000-0000-0000-000000000004','Lic. NoPublicar','psicologia','caba','bio D',null,true,'no_publicar',true,null),
 ('00000000-0000-0000-0000-000000000005','Lic. Inactiva','psicologia','caba','bio E',null,true,'completo',false,null);
insert into profesionales_privado (profesional_id, nombre_completo, telefono) values ('00000000-0000-0000-0000-000000000001','Completa Real','5491100000000');
insert into tematicas (nombre) values ('Ansiedad'); insert into profesional_tematica values ('00000000-0000-0000-0000-000000000001', 1);
insert into consultas (telefono, motivo) values ('5493870000000','motivo sensible');
insert into usuarios_roles (usuario_id, rol) values ('bbbbbbbb-0000-0000-0000-000000000002','admision');

\echo '--- ANON (portal sin login)'
set role anon; set test.uid = '';
select nombre_publico, foto_url is not null as foto, presentacion is not null as bio, tematicas from fichas_publicas order by 1;
select count(*) as "anon ve tabla profesionales (esperado 0)" from profesionales;
select count(*) as "anon ve privado (esperado 0)" from profesionales_privado;
select count(*) as "anon ve consultas (esperado 0)" from consultas;
select count(*) as "anon ve zonas (esperado 9)" from zonas;
reset role;

\echo '--- PROFESIONAL (Lic. Completa logueada)'
set role authenticated; set test.uid = 'aaaaaaaa-0000-0000-0000-000000000001';
select count(*) as "ve profesionales (esperado 1: la suya)" from profesionales;
select count(*) as "ve su privado (esperado 1)" from profesionales_privado;
select count(*) as "ve consultas (esperado 0)" from consultas;
update profesionales set presentacion = 'bio editada' where id = '00000000-0000-0000-0000-000000000001';
update profesionales set presentacion = 'hackeo' where id = '00000000-0000-0000-0000-000000000002';
reset role;
select id::text like '%1' as es_la_suya, presentacion from profesionales where id in ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002') order by 1 desc;

\echo '--- ADMISION'
set role authenticated; set test.uid = 'bbbbbbbb-0000-0000-0000-000000000002';
select count(*) as "admision ve profesionales (esperado 5)" from profesionales;
select count(*) as "admision ve consultas (esperado 1)" from consultas;
reset role;
\echo '--- PROFESIONAL intenta darse de baja/alta (esperado: error)'
set role authenticated; set test.uid = 'aaaaaaaa-0000-0000-0000-000000000001';
\set ON_ERROR_STOP 0
update profesionales set activo = false where id = '00000000-0000-0000-0000-000000000001';
\set ON_ERROR_STOP 1
update profesionales set autorizacion = 'sin_foto' where id = '00000000-0000-0000-0000-000000000001';
reset role;
select activo, autorizacion from profesionales where id = '00000000-0000-0000-0000-000000000001';
