-- =============================================================================
-- HPC · Docentes de las formaciones anuales: registro, clases, cumplimiento y encuesta
-- =============================================================================
-- Origen: el viernes 16/10/2026 se suspendió por tercera vez una clase de la Formación en Trauma
-- porque la docente asignada canceló (ya había cancelado otra un sábado). Laura Flynn pidió:
--   - un registro de docentes y de quién da cada clase (hasta ahora era un documento de Word de
--     Laura Solivellas),
--   - ser estrictos: "la gente que ya canceló una vez, chau",
--   - que los alumnos sigan valorando a los docentes con la encuesta de calidad.
--
-- Decisiones de Matías (20/10/2026):
--   - Regla: 1 cancelación = el sistema PROPONE la baja y un/a administrador/a la confirma
--     (o la rechaza dejando el motivo). Nada se da de baja solo.
--   - Los docentes también entran al portal (mismo ingreso por código que "Mi ficha") para ver
--     sus clases, confirmarlas y cargar el enlace a la presentación y la guía.
--
-- Qué agrega:
--   1. formaciones: cada cohorte (DBT Abril 2026, Trauma Agosto 2026...).
--   2. docentes: el registro. Estado activo / en observación / baja, y la marca "baja propuesta".
--   3. clases: una fila por formación, fecha y turno, con docente (vacía = VACANTE) y co-docente.
--   4. docente_incidencias: el historial de cumplimiento (cancelaciones, material tarde...).
--   5. La regla: al marcar una clase como cancelada, se registra la incidencia y se propone la baja.
--   6. encuesta_respuestas: la encuesta de los alumnos, una respuesta por clase, anónima.
--      Cada clase tiene su código: el enlace ya trae formación, fecha y docente (se acabó el
--      nombre del docente escrito a mano, que no se podía sumar).
--   7. Acceso de docentes al portal + funciones que usa la pantalla.
--
-- Cómo se aplica: Supabase → SQL Editor → New query → pegar todo → Run. Es re-ejecutable.
-- La carga del cronograma (nombres y clases) NO va en este archivo: va aparte (datos/), igual que
-- las fichas, para que los nombres no queden en GitHub.
-- =============================================================================

-- ---------- Tipos ----------

do $$ begin
  create type estado_docente as enum ('activo', 'observacion', 'baja');
exception when duplicate_object then null; end $$;

do $$ begin
  -- 'unico' = encuentro de un solo bloque (por ejemplo Trauma Abril, que se dicta en días y no en turnos).
  create type turno_clase as enum ('manana', 'tarde', 'unico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_clase as enum (
    'programada',            -- asignada, el/la docente todavía no confirmó
    'confirmada',            -- el/la docente confirmó desde el portal (o la confirmó coordinación)
    'dictada',               -- se dio
    'cancelada_aviso',       -- el/la docente canceló avisando
    'cancelada_sin_aviso',   -- el/la docente no se presentó o avisó sobre la hora
    'suspendida_hpc'         -- la suspendió la Fundación (no cuenta contra el/la docente)
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_incidencia as enum ('cancelacion_aviso', 'cancelacion_sin_aviso', 'material_tarde', 'llegada_tarde', 'otro', 'excepcion_aprobada');
exception when duplicate_object then null; end $$;

-- ---------- 1. Formaciones (cohortes) ----------

create table if not exists formaciones (
  id        text primary key,                 -- 'dbt-abril-2026'
  nombre    text not null,                    -- 'DBT Abril 2026' (como la llama el equipo)
  programa  text not null,                    -- 'Terapia Dialéctico Conductual (DBT)' (como en la web)
  cohorte   text not null,                    -- 'Abril 2026'
  activa    boolean not null default true,
  orden     smallint not null default 0
);

alter table formaciones enable row level security;
-- El catálogo es público: lo necesita la encuesta, que se responde sin cuenta.
drop policy if exists "todos leen formaciones" on formaciones;
create policy "todos leen formaciones" on formaciones for select using (true);
drop policy if exists "admin gestiona formaciones" on formaciones;
create policy "admin gestiona formaciones" on formaciones for all
  using (tiene_rol('admin')) with check (tiene_rol('admin'));

-- ---------- 2. Docentes ----------

create table if not exists docentes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (char_length(nombre) between 2 and 120),
  email           text unique,                  -- con este correo entra al portal
  telefono        text,                         -- WhatsApp, para el contacto individual
  temas           text,                         -- formaciones / temas que puede dar
  cv_url          text check (cv_url is null or cv_url ~ '^https://'),
  estado          estado_docente not null default 'activo',
  baja_propuesta  boolean not null default false,  -- la puso la regla; la resuelve un admin
  motivo_baja     text,
  fecha_baja      date,
  notas           text,                         -- internas (nunca las ve el/la docente)
  creado          timestamptz not null default now(),
  actualizado     timestamptz not null default now(),
  constraint docentes_email_minusculas check (email is null or email = lower(trim(email)))
);

drop trigger if exists docentes_actualizado on docentes;
create trigger docentes_actualizado before update on docentes
  for each row execute function marcar_actualizado();

-- El id del docente conectado. Se busca por el correo de la sesión (verificado por el código),
-- y sólo si no está de baja: dar de baja corta el acceso en el momento.
create or replace function mi_docente_id() returns uuid
language sql stable security definer set search_path = public as $$
  select d.id
  from docentes d
  where d.email is not null
    and d.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and d.estado <> 'baja'
  limit 1;
$$;

alter table docentes enable row level security;
drop policy if exists "admin gestiona docentes" on docentes;
create policy "admin gestiona docentes" on docentes for all
  using (tiene_rol('admin')) with check (tiene_rol('admin'));
drop policy if exists "equipo lee docentes" on docentes;
create policy "equipo lee docentes" on docentes for select using (es_equipo());
-- El/la docente no lee la tabla (tiene notas internas): ve su nombre con mi_perfil_docente().

-- ---------- 3. Clases ----------

create table if not exists clases (
  id              uuid primary key default gen_random_uuid(),
  formacion_id    text not null references formaciones(id),
  mes             date not null,                -- primer día del mes (para el cronograma)
  fecha           date,                         -- null = todavía sin fecha
  turno           turno_clase not null,
  docente_id      uuid references docentes(id) on delete set null,   -- null = VACANTE
  co_docente_id   uuid references docentes(id) on delete set null,
  temas           text,
  estado          estado_clase not null default 'programada',
  confirmada_at   timestamptz,
  material_url    text check (material_url is null or material_url ~ '^https://'),
  material_at     timestamptz,
  notas           text,                         -- internas
  codigo_encuesta text not null unique default substr(md5(gen_random_uuid()::text), 1, 10),
  creado          timestamptz not null default now(),
  actualizado     timestamptz not null default now(),
  constraint clases_mes_primer_dia check (extract(day from mes) = 1),
  constraint clases_fecha_en_mes check (fecha is null or date_trunc('month', fecha)::date = mes),
  constraint clases_codocente_distinto check (co_docente_id is null or co_docente_id <> docente_id)
);
create index if not exists clases_mes on clases (mes, formacion_id);
create index if not exists clases_docente on clases (docente_id);
create index if not exists clases_codocente on clases (co_docente_id);

drop trigger if exists clases_actualizado on clases;
create trigger clases_actualizado before update on clases
  for each row execute function marcar_actualizado();

alter table clases enable row level security;
drop policy if exists "admin gestiona clases" on clases;
create policy "admin gestiona clases" on clases for all
  using (tiene_rol('admin')) with check (tiene_rol('admin'));
drop policy if exists "equipo lee clases" on clases;
create policy "equipo lee clases" on clases for select using (es_equipo());
-- El/la docente ve sus clases con mis_clases() (sin las notas internas) y las modifica sólo con
-- las funciones de abajo: confirmar, cargar material, avisar que no puede.

-- ---------- 4. Incidencias (historial de cumplimiento) ----------

create table if not exists docente_incidencias (
  id          bigint generated always as identity primary key,
  docente_id  uuid not null references docentes(id) on delete cascade,
  clase_id    uuid references clases(id) on delete set null,
  tipo        tipo_incidencia not null,
  fecha       date not null default current_date,
  detalle     text,
  registrado_por uuid default auth.uid(),
  creado      timestamptz not null default now()
);
create index if not exists incidencias_docente on docente_incidencias (docente_id, fecha desc);

alter table docente_incidencias enable row level security;
drop policy if exists "admin gestiona incidencias" on docente_incidencias;
create policy "admin gestiona incidencias" on docente_incidencias for all
  using (tiene_rol('admin')) with check (tiene_rol('admin'));
drop policy if exists "equipo lee incidencias" on docente_incidencias;
create policy "equipo lee incidencias" on docente_incidencias for select using (es_equipo());

-- ---------- 5. La regla: 1 cancelación = baja propuesta ----------

create or replace function clases_regla_cancelacion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  tipo tipo_incidencia;
  d uuid;
begin
  if new.estado in ('cancelada_aviso', 'cancelada_sin_aviso')
     and (tg_op = 'INSERT' or old.estado is distinct from new.estado) then
    tipo := case new.estado when 'cancelada_aviso' then 'cancelacion_aviso' else 'cancelacion_sin_aviso' end;
    foreach d in array array_remove(array[new.docente_id, new.co_docente_id], null) loop
      insert into docente_incidencias (docente_id, clase_id, tipo, fecha, detalle)
      values (d, new.id, tipo, coalesce(new.fecha, current_date), null);
      update docentes
         set baja_propuesta = true,
             estado = case when estado = 'activo' then 'observacion'::estado_docente else estado end
       where id = d and estado <> 'baja';
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists clases_cancelacion on clases;
create trigger clases_cancelacion after insert or update of estado on clases
  for each row execute function clases_regla_cancelacion();

-- Un/a administrador/a resuelve la baja propuesta.
--   confirmar = true  -> baja: pierde el acceso y sus clases futuras quedan VACANTES.
--   confirmar = false -> sigue activo/a; queda registrada la excepción con el motivo (obligatorio).
create or replace function resolver_baja_docente(p_docente uuid, p_confirmar boolean, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if not tiene_rol('admin') then raise exception 'SIN_PERMISO'; end if;
  if p_motivo is null or char_length(trim(p_motivo)) < 3 then raise exception 'FALTA_MOTIVO'; end if;

  if p_confirmar then
    update docentes
       set estado = 'baja', baja_propuesta = false, motivo_baja = trim(p_motivo), fecha_baja = hoy
     where id = p_docente;
    -- Clases que todavía no pasaron: quedan vacantes para reasignar.
    update clases
       set docente_id = case when docente_id = p_docente then co_docente_id else docente_id end,
           co_docente_id = null,
           estado = 'programada', confirmada_at = null,
           notas = concat_ws(' · ', notas, 'Reasignar: el/la docente anterior fue dado/a de baja')
     where (docente_id = p_docente or co_docente_id = p_docente)
       and estado in ('programada', 'confirmada')
       and coalesce(fecha, (mes + interval '1 month - 1 day')::date) >= hoy;
  else
    update docentes set estado = 'activo', baja_propuesta = false where id = p_docente;
    insert into docente_incidencias (docente_id, tipo, detalle)
    values (p_docente, 'excepcion_aprobada', trim(p_motivo));
  end if;
end $$;

-- ---------- 6. Encuesta de los alumnos ----------

create table if not exists encuesta_respuestas (
  id                       bigint generated always as identity primary key,
  clase_id                 uuid not null references clases(id) on delete cascade,
  -- Desempeño del/de la docente (1 = muy bajo ... 5 = excelente)
  docente_claridad         smallint not null check (docente_claridad between 1 and 5),
  docente_dominio          smallint not null check (docente_dominio between 1 and 5),
  docente_respuestas       smallint not null check (docente_respuestas between 1 and 5),
  docente_organizacion     smallint not null check (docente_organizacion between 1 and 5),
  -- Contenido de la clase
  contenido_relevancia     smallint not null check (contenido_relevancia between 1 and 5),
  contenido_profundidad    smallint not null check (contenido_profundidad between 1 and 5),
  contenido_material       smallint not null check (contenido_material between 1 and 5),
  contenido_aplicabilidad  smallint not null check (contenido_aplicabilidad between 1 and 5),
  satisfaccion_general     smallint not null check (satisfaccion_general between 1 and 5),
  lo_mejor                 text check (lo_mejor is null or char_length(lo_mejor) <= 2000),
  sugerencias              text check (sugerencias is null or char_length(sugerencias) <= 2000),
  -- Anónima: sólo la FECHA (sin hora), para que en grupos chicos no se pueda deducir quién respondió.
  fecha                    date not null default current_date
);
create index if not exists encuesta_clase on encuesta_respuestas (clase_id);

alter table encuesta_respuestas enable row level security;
drop policy if exists "equipo lee encuesta" on encuesta_respuestas;
create policy "equipo lee encuesta" on encuesta_respuestas for select using (es_equipo());
drop policy if exists "admin borra encuesta" on encuesta_respuestas;
create policy "admin borra encuesta" on encuesta_respuestas for delete using (tiene_rol('admin'));
-- Nadie inserta directo: se responde con responder_encuesta() (valida el código de la clase).

-- Datos de una clase para la encuesta (sin login). Sólo lo que el alumno ya sabe: formación,
-- fecha, turno y nombre del/de la docente.
create or replace function encuesta_clase(p_codigo text)
returns table (codigo text, formacion text, programa text, fecha date, mes date, turno turno_clase, docentes text)
language sql stable security definer set search_path = public as $$
  select c.codigo_encuesta, f.nombre, f.programa, c.fecha, c.mes, c.turno,
         concat_ws(' y ', d1.nombre, d2.nombre)
  from clases c
  join formaciones f on f.id = c.formacion_id
  left join docentes d1 on d1.id = c.docente_id
  left join docentes d2 on d2.id = c.co_docente_id
  where c.codigo_encuesta = p_codigo
    and c.docente_id is not null
    and c.estado in ('programada', 'confirmada', 'dictada');
$$;

-- Para el enlace general (sin código): clases de una formación de los últimos 45 días, para elegir.
create or replace function encuesta_clases_recientes(p_formacion text)
returns table (codigo text, formacion text, programa text, fecha date, mes date, turno turno_clase, docentes text)
language sql stable security definer set search_path = public as $$
  select c.codigo_encuesta, f.nombre, f.programa, c.fecha, c.mes, c.turno,
         concat_ws(' y ', d1.nombre, d2.nombre)
  from clases c
  join formaciones f on f.id = c.formacion_id
  left join docentes d1 on d1.id = c.docente_id
  left join docentes d2 on d2.id = c.co_docente_id
  where c.formacion_id = p_formacion
    and c.docente_id is not null
    and c.estado in ('programada', 'confirmada', 'dictada')
    and c.fecha is not null
    and c.fecha between current_date - 45 and current_date
  order by c.fecha desc, c.turno;
$$;

create or replace function responder_encuesta(
  p_codigo text,
  p_claridad int, p_dominio int, p_respuestas int, p_organizacion int,
  p_relevancia int, p_profundidad int, p_material int, p_aplicabilidad int,
  p_general int, p_lo_mejor text, p_sugerencias text
) returns void language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
begin
  select id into cid from clases
  where codigo_encuesta = p_codigo and docente_id is not null
    and estado in ('programada', 'confirmada', 'dictada');
  if cid is null then raise exception 'CLASE_NO_ENCONTRADA'; end if;
  insert into encuesta_respuestas (
    clase_id, docente_claridad, docente_dominio, docente_respuestas, docente_organizacion,
    contenido_relevancia, contenido_profundidad, contenido_material, contenido_aplicabilidad,
    satisfaccion_general, lo_mejor, sugerencias)
  values (cid, p_claridad, p_dominio, p_respuestas, p_organizacion,
          p_relevancia, p_profundidad, p_material, p_aplicabilidad,
          p_general, nullif(trim(p_lo_mejor), ''), nullif(trim(p_sugerencias), ''));
end $$;

-- ---------- 7. Resumen por docente (para el panel y para decidir a quién darle clases) ----------
-- security_invoker: respeta los permisos de quien consulta (sólo el equipo ve algo).

-- Subconsultas separadas (y no un join de todo) para que las filas no se multipliquen entre sí.
drop view if exists docentes_resumen;
create view docentes_resumen with (security_invoker = true) as
select
  d.id,
  d.nombre,
  d.estado,
  d.baja_propuesta,
  coalesce(cl.proximas, 0)          as clases_proximas,
  coalesce(cl.dictadas, 0)          as clases_dictadas,
  coalesce(cl.sin_confirmar, 0)     as sin_confirmar_14_dias,
  coalesce(inc.cancelaciones, 0)    as cancelaciones,
  coalesce(enc.respuestas, 0)       as respuestas_encuesta,
  enc.promedio_docente,
  enc.promedio_general
from docentes d
left join lateral (
  select
    count(*) filter (where c.estado in ('programada', 'confirmada')
                       and coalesce(c.fecha, (c.mes + interval '1 month - 1 day')::date) >= current_date) as proximas,
    count(*) filter (where c.estado = 'dictada') as dictadas,
    count(*) filter (where c.estado = 'programada' and c.fecha between current_date and current_date + 14) as sin_confirmar
  from clases c where d.id in (c.docente_id, c.co_docente_id)
) cl on true
left join lateral (
  select count(*) as cancelaciones from docente_incidencias i
  where i.docente_id = d.id and i.tipo in ('cancelacion_aviso', 'cancelacion_sin_aviso')
) inc on true
left join lateral (
  select count(*) as respuestas,
         round(avg((e.docente_claridad + e.docente_dominio + e.docente_respuestas + e.docente_organizacion) / 4.0), 2) as promedio_docente,
         round(avg(e.satisfaccion_general), 2) as promedio_general
  from encuesta_respuestas e join clases c on c.id = e.clase_id
  where d.id in (c.docente_id, c.co_docente_id)
) enc on true;

-- ---------- 8. Acceso de docentes al portal ----------

-- El ingreso de la sección Profesionales (origen = 'profesionales') ahora acepta también a los
-- docentes cargados y no dados de baja. Todo lo demás queda igual que en la migración 09.
create or replace function auth_validar_correo_habilitado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'origen', '') = 'profesionales'
     and not exists (
       select 1 from public.accesos_profesionales
       where email = lower(trim(new.email)) and habilitado
     )
     and not exists (
       select 1 from public.docentes
       where email = lower(trim(new.email)) and estado <> 'baja'
     ) then
    raise exception 'CORREO_NO_HABILITADO';
  end if;
  return new;
end $$;

-- Nombre y estado propios (sin notas internas).
create or replace function mi_perfil_docente()
returns table (id uuid, nombre text, estado estado_docente)
language sql stable security definer set search_path = public as $$
  select d.id, d.nombre, d.estado from docentes d where d.id = mi_docente_id();
$$;

-- Las clases del/de la docente conectado/a (sin notas internas).
create or replace function mis_clases()
returns table (id uuid, formacion text, programa text, mes date, fecha date, turno turno_clase,
               temas text, estado estado_clase, confirmada_at timestamptz, material_url text,
               co_docente text, codigo_encuesta text)
language sql stable security definer set search_path = public as $$
  select c.id, f.nombre, f.programa, c.mes, c.fecha, c.turno, c.temas, c.estado, c.confirmada_at,
         c.material_url,
         (select nombre from docentes x
           where x.id = case when c.docente_id = mi_docente_id() then c.co_docente_id else c.docente_id end),
         c.codigo_encuesta
  from clases c
  join formaciones f on f.id = c.formacion_id
  where mi_docente_id() is not null
    and mi_docente_id() in (c.docente_id, c.co_docente_id)
  order by c.mes, c.fecha nulls last, c.turno;
$$;

create or replace function confirmar_mi_clase(p_clase uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update clases set estado = 'confirmada', confirmada_at = now()
   where id = p_clase and mi_docente_id() in (docente_id, co_docente_id) and estado = 'programada';
  if not found then raise exception 'CLASE_NO_DISPONIBLE'; end if;
end $$;

create or replace function cargar_material_mi_clase(p_clase uuid, p_url text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_url is not null and p_url !~ '^https://' then raise exception 'ENLACE_INVALIDO'; end if;
  update clases set material_url = nullif(trim(p_url), ''), material_at = now()
   where id = p_clase and mi_docente_id() in (docente_id, co_docente_id)
     and estado in ('programada', 'confirmada', 'dictada');
  if not found then raise exception 'CLASE_NO_DISPONIBLE'; end if;
end $$;

-- "No puedo dar esta clase": cuenta como cancelación con aviso (aplica la regla) y avisa al equipo
-- porque la clase aparece cancelada en el panel. Cuanto antes avise, antes se consigue reemplazo.
create or replace function no_puedo_dar_mi_clase(p_clase uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update clases
     set estado = 'cancelada_aviso',
         notas = concat_ws(' · ', notas, 'Aviso del/de la docente: ' || coalesce(nullif(trim(p_motivo), ''), 'sin motivo'))
   where id = p_clase and mi_docente_id() in (docente_id, co_docente_id) and estado in ('programada', 'confirmada');
  if not found then raise exception 'CLASE_NO_DISPONIBLE'; end if;
  -- La incidencia la creó el trigger: se le agrega el motivo que dio el/la docente.
  update docente_incidencias
     set detalle = 'Avisó desde el portal: ' || coalesce(nullif(trim(p_motivo), ''), 'sin motivo')
   where clase_id = p_clase and docente_id = mi_docente_id() and tipo = 'cancelacion_aviso';
end $$;

-- Resultados de la encuesta del/de la docente conectado/a. Sólo promedios y sólo con 3 respuestas
-- o más (con menos se podría saber quién respondió qué). Los comentarios no se muestran.
create or replace function mis_resultados_encuesta()
returns table (respuestas bigint, promedio_docente numeric, promedio_general numeric)
language sql stable security definer set search_path = public as $$
  select count(*),
         case when count(*) >= 3 then round(avg((e.docente_claridad + e.docente_dominio + e.docente_respuestas + e.docente_organizacion) / 4.0), 2) end,
         case when count(*) >= 3 then round(avg(e.satisfaccion_general), 2) end
  from encuesta_respuestas e
  join clases c on c.id = e.clase_id
  where mi_docente_id() is not null and mi_docente_id() in (c.docente_id, c.co_docente_id);
$$;

-- ---------- 9. Permisos de tabla y de funciones ----------

revoke all on docentes, clases, docente_incidencias, encuesta_respuestas from anon;
revoke all on docentes_resumen from anon;
grant select on formaciones to anon, authenticated;
grant select, insert, update, delete on formaciones, docentes, clases, docente_incidencias to authenticated;
grant select, delete on encuesta_respuestas to authenticated;
grant select on docentes_resumen to authenticated;

revoke all on function resolver_baja_docente(uuid, boolean, text) from public, anon;
grant execute on function resolver_baja_docente(uuid, boolean, text) to authenticated;
revoke all on function mi_perfil_docente(), mis_clases(), confirmar_mi_clase(uuid),
  cargar_material_mi_clase(uuid, text), no_puedo_dar_mi_clase(uuid, text), mis_resultados_encuesta() from public, anon;
grant execute on function mi_docente_id(), mi_perfil_docente(), mis_clases(), confirmar_mi_clase(uuid),
  cargar_material_mi_clase(uuid, text), no_puedo_dar_mi_clase(uuid, text), mis_resultados_encuesta() to authenticated;
-- La encuesta se responde sin cuenta.
grant execute on function encuesta_clase(text), encuesta_clases_recientes(text),
  responder_encuesta(text, int, int, int, int, int, int, int, int, int, text, text) to anon, authenticated;

-- ---------- 10. Formaciones en curso (cohortes del cronograma de Laura S., octubre 2026) ----------

insert into formaciones (id, nombre, programa, cohorte, orden) values
  ('dbt-abril-2026',     'DBT Abril 2026',     'Terapia Dialéctico Conductual (DBT)',                    'Abril 2026', 1),
  ('dbt-agosto-2026',    'DBT Agosto 2026',    'Terapia Dialéctico Conductual (DBT)',                    'Agosto 2026', 2),
  ('infanto-abril-2026', 'Infanto Abril 2026', 'Terapias Conductuales y Contextuales Infantojuveniles',  'Abril 2026', 3),
  ('infanto-agosto-2026','Infanto Agosto 2026','Terapias Conductuales y Contextuales Infantojuveniles',  'Agosto 2026', 4),
  ('act-abril-2026',     'ACT Abril 2026',     'ACT y FAP: Terapias Contextuales Aplicadas',             'Abril 2026', 5),
  ('act-fap-agosto-2026','ACT-FAP Agosto 2026','ACT y FAP: Terapias Contextuales Aplicadas',             'Agosto 2026', 6),
  ('tcc-abril-2026',     'TCC Abril 2026',     'Terapias Cognitivo-Conductuales y Contextuales',         'Abril 2026', 7),
  ('tcc-agosto-2026',    'TCC Agosto 2026',    'Terapias Cognitivo-Conductuales y Contextuales',         'Agosto 2026', 8),
  ('trauma-abril-2026',  'Trauma Abril 2026',  'Trauma y Regulación Emocional',                          'Abril 2026', 9),
  ('trauma-agosto-2026', 'Trauma Agosto 2026', 'Trauma y Regulación Emocional',                          'Agosto 2026', 10)
on conflict (id) do nothing;

-- ---------- Control ----------
select 'formaciones' as que, count(*) from formaciones
union all select 'docentes', count(*) from docentes
union all select 'clases', count(*) from clases;
