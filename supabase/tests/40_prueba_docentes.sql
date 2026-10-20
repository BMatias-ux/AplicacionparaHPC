-- Pruebas de la migración 11 (docentes, clases, regla de cancelación y encuesta).
-- Correr sobre una base con TODAS las migraciones aplicadas. Cada bloque dice lo esperado.
-- Los nombres son ficticios.
\set ON_ERROR_STOP 0

-- Datos: una administradora, dos docentes con correo, una sin correo, y clases.
insert into accesos_profesionales (email, nombre, habilitado, es_admin) values ('admin@ejemplo.com', 'Admin Prueba', true, true);
insert into auth.users (id, email, raw_user_meta_data) values ('dddddddd-0000-0000-0000-0000000000a1', 'admin@ejemplo.com', '{"origen":"profesionales"}');

insert into docentes (id, nombre, email) values
  ('d0000000-0000-0000-0000-000000000001', 'Docente Cumplidora', 'cumple@ejemplo.com'),
  ('d0000000-0000-0000-0000-000000000002', 'Docente Que Cancela', 'cancela@ejemplo.com'),
  ('d0000000-0000-0000-0000-000000000003', 'Docente Sin Correo', null);

insert into clases (id, formacion_id, mes, fecha, turno, docente_id, codigo_encuesta) values
  ('c0000000-0000-0000-0000-000000000001', 'trauma-agosto-2026', date_trunc('month', current_date)::date, current_date - 1, 'manana', 'd0000000-0000-0000-0000-000000000001', 'codigo0001'),
  ('c0000000-0000-0000-0000-000000000002', 'trauma-agosto-2026', date_trunc('month', current_date + 40)::date, current_date + 40, 'tarde',  'd0000000-0000-0000-0000-000000000002', 'codigo0002'),
  ('c0000000-0000-0000-0000-000000000003', 'trauma-agosto-2026', date_trunc('month', current_date + 70)::date, current_date + 70, 'tarde',  'd0000000-0000-0000-0000-000000000002', 'codigo0003'),
  ('c0000000-0000-0000-0000-000000000004', 'dbt-agosto-2026',    date_trunc('month', current_date + 40)::date, null,              'manana', null,                                  'codigo0004');

\echo '--- ESPERADO: un docente cargado entra por Profesionales (INSERT 0 1)'
insert into auth.users (id, email, raw_user_meta_data) values ('dddddddd-0000-0000-0000-0000000000b1', 'Cancela@Ejemplo.com', '{"origen":"profesionales"}');
\echo '--- ESPERADO: ERROR CORREO_NO_HABILITADO (ni profesional ni docente)'
insert into auth.users (email, raw_user_meta_data) values ('nadie@ejemplo.com', '{"origen":"profesionales"}');
\echo '--- ESPERADO: entrar como docente NO crea ficha profesional (0)'
select count(*) from profesionales where usuario_id = 'dddddddd-0000-0000-0000-0000000000b1';

-- ===== Como docente =====
set role authenticated;
set test.uid = 'dddddddd-0000-0000-0000-0000000000b1';
set test.email = 'cancela@ejemplo.com';

\echo '--- ESPERADO: mi_perfil_docente = Docente Que Cancela, activo'
select nombre, estado from mi_perfil_docente();
\echo '--- ESPERADO: mis_clases = 2 filas (sólo las suyas, sin notas)'
select formacion, turno, estado from mis_clases();
\echo '--- ESPERADO: no puede leer la tabla docentes (0 filas) ni clases (0 filas)'
select count(*) from docentes;
select count(*) from clases;
\echo '--- ESPERADO: no puede cambiarse el estado (UPDATE 0)'
update docentes set estado = 'activo', baja_propuesta = false;
\echo '--- ESPERADO: confirma su clase OK'
select confirmar_mi_clase('c0000000-0000-0000-0000-000000000002');
\echo '--- ESPERADO: ERROR CLASE_NO_DISPONIBLE (clase de otra docente)'
select confirmar_mi_clase('c0000000-0000-0000-0000-000000000001');
\echo '--- ESPERADO: ERROR ENLACE_INVALIDO'
select cargar_material_mi_clase('c0000000-0000-0000-0000-000000000002', 'javascript:alert(1)');
\echo '--- ESPERADO: material OK'
select cargar_material_mi_clase('c0000000-0000-0000-0000-000000000002', 'https://drive.google.com/x');
\echo '--- ESPERADO: avisa que no puede -> OK'
select no_puedo_dar_mi_clase('c0000000-0000-0000-0000-000000000002', 'Viaje');
reset role;

\echo '--- ESPERADO: clase 2 cancelada_aviso; docente en observacion con baja_propuesta = t; 1 incidencia'
select estado, notas from clases where id = 'c0000000-0000-0000-0000-000000000002';
select estado, baja_propuesta from docentes where id = 'd0000000-0000-0000-0000-000000000002';
select tipo, detalle from docente_incidencias where docente_id = 'd0000000-0000-0000-0000-000000000002';  -- detalle: Avisó desde el portal: Viaje

-- ===== Encuesta (sin cuenta) =====
set role anon;
reset test.uid; reset test.email;
\echo '--- ESPERADO: encuesta_clase(codigo0001) devuelve Trauma Agosto 2026 / Docente Cumplidora'
select formacion, turno, docentes from encuesta_clase('codigo0001');
\echo '--- ESPERADO: la clase cancelada NO se puede evaluar (0 filas)'
select count(*) from encuesta_clase('codigo0002');
\echo '--- ESPERADO: clases recientes de Trauma Agosto = 1 (la de ayer)'
select count(*) from encuesta_clases_recientes('trauma-agosto-2026');
\echo '--- ESPERADO: 3 respuestas OK'
select responder_encuesta('codigo0001', 5,5,4,5, 5,4,4,5, 5, 'Muy clara', null);
select responder_encuesta('codigo0001', 4,4,4,4, 4,4,4,4, 4, null, 'Más ejemplos');
select responder_encuesta('codigo0001', 5,5,5,5, 5,5,5,5, 5, '', '');
\echo '--- ESPERADO: ERROR (puntaje fuera de rango)'
select responder_encuesta('codigo0001', 9,5,5,5, 5,5,5,5, 5, null, null);
\echo '--- ESPERADO: ERROR CLASE_NO_ENCONTRADA'
select responder_encuesta('noexiste', 5,5,5,5, 5,5,5,5, 5, null, null);
\echo '--- ESPERADO: anon no lee respuestas ni docentes (ERROR permiso)'
select count(*) from encuesta_respuestas;
select count(*) from docentes;
reset role;

-- ===== Como la docente cumplidora (resultados propios) =====
insert into auth.users (id, email, raw_user_meta_data) values ('dddddddd-0000-0000-0000-0000000000c1', 'cumple@ejemplo.com', '{"origen":"profesionales"}');
set role authenticated;
set test.uid = 'dddddddd-0000-0000-0000-0000000000c1';
set test.email = 'cumple@ejemplo.com';
\echo '--- ESPERADO: 3 respuestas, promedio_docente 4.58, general 4.67'
select * from mis_resultados_encuesta();
reset role;

-- ===== Como administradora =====
set role authenticated;
set test.uid = 'dddddddd-0000-0000-0000-0000000000a1';
set test.email = 'admin@ejemplo.com';
\echo '--- ESPERADO: resumen: Cumplidora 3 respuestas 4.58; Que Cancela 1 cancelación, baja_propuesta t'
select nombre, estado, baja_propuesta, clases_proximas, cancelaciones, respuestas_encuesta, promedio_docente from docentes_resumen order by nombre;
\echo '--- ESPERADO: ERROR FALTA_MOTIVO'
select resolver_baja_docente('d0000000-0000-0000-0000-000000000002', true, '');
\echo '--- ESPERADO: baja confirmada OK'
select resolver_baja_docente('d0000000-0000-0000-0000-000000000002', true, 'Canceló la clase (regla de 1 cancelación)');
\echo '--- ESPERADO: docente en baja; su clase futura (codigo0003) queda VACANTE y programada'
select estado, baja_propuesta, motivo_baja, fecha_baja is not null as con_fecha from docentes where id = 'd0000000-0000-0000-0000-000000000002';
select docente_id is null as vacante, estado, notas from clases where id = 'c0000000-0000-0000-0000-000000000003';
\echo '--- ESPERADO: la clase cancelada conserva a la docente (historial)'
select docente_id is not null as conserva from clases where id = 'c0000000-0000-0000-0000-000000000002';

\echo '--- ESPERADO: cancelación marcada por el admin -> propone baja de Cumplidora; excepción la deja activa'
update clases set estado = 'cancelada_sin_aviso' where id = 'c0000000-0000-0000-0000-000000000001';
select estado, baja_propuesta from docentes where id = 'd0000000-0000-0000-0000-000000000001';
select resolver_baja_docente('d0000000-0000-0000-0000-000000000001', false, 'Emergencia médica documentada');
select estado, baja_propuesta from docentes where id = 'd0000000-0000-0000-0000-000000000001';
select tipo from docente_incidencias where docente_id = 'd0000000-0000-0000-0000-000000000001' order by id;
\echo '--- ESPERADO: suspendida por HPC NO genera incidencia (sigue 2 incidencias)'
update clases set estado = 'suspendida_hpc' where id = 'c0000000-0000-0000-0000-000000000004';
select count(*) from docente_incidencias where docente_id = 'd0000000-0000-0000-0000-000000000001';
reset role;

-- ===== La docente dada de baja pierde el acceso =====
set role authenticated;
set test.uid = 'dddddddd-0000-0000-0000-0000000000b1';
set test.email = 'cancela@ejemplo.com';
\echo '--- ESPERADO: mi_docente_id null y mis_clases vacío'
select mi_docente_id() is null as sin_acceso;
select count(*) from mis_clases();
reset role;
\echo '--- ESPERADO: ERROR CORREO_NO_HABILITADO (docente de baja no puede crear cuenta nueva)'
delete from auth.users where email = 'Cancela@Ejemplo.com';
insert into auth.users (email, raw_user_meta_data) values ('cancela@ejemplo.com', '{"origen":"profesionales"}');
