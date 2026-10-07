-- =============================================================================
-- HPC · Cuentas de pacientes en el portal ("Mi espacio") — Etapa A
-- =============================================================================
-- Decisión de Matías (07/10/2026): registro ABIERTO para pacientes, con correo (código) o con
-- Google. Cada paciente tiene un espacio privado: avisos, registro de ánimo y ejercicios.
-- Turnos y prestaciones llegan en la Etapa B (conexión con Medexis / derivaciones).
--
-- Qué cambia:
--   1. El registro deja de estar cerrado para todos. Sólo el ingreso que pide la sección
--      Profesionales (marca origen = 'profesionales' en los metadatos del usuario) sigue
--      exigiendo que el correo esté HABILITADO en accesos_profesionales. Cualquier otro alta
--      (pacientes con código, o con Google) se acepta.
--   2. La vinculación con una ficha profesional pasa a exigir habilitado = true. Antes no hacía
--      falta porque el paso 1 ya lo garantizaba; con el registro abierto, un aspirante podría
--      crearse una cuenta de paciente y quedar "vinculado" a su ficha sin acceso real.
--      Si después se lo habilita, se vincula solo (trigger sobre accesos_profesionales).
--   3. pacientes: columnas para las cuentas del portal y permisos para que cada paciente vea y
--      edite SÓLO su perfil.
--   4. registros_animo: diario de ánimo, privado del paciente (ni el equipo lo lee desde el portal).
--   5. avisos: novedades para pacientes con cuenta (para todos o para uno en particular).
--   6. borrar_mi_cuenta(): el paciente borra su cuenta y sus datos del portal (derecho de supresión,
--      Ley 25.326 art. 16), sin tocar la historia que el equipo deba conservar.
--
-- Cómo se aplica: Supabase → SQL Editor → New query → pegar todo → Run. Es re-ejecutable.
-- ORDEN: primero se publica el portal nuevo (que manda origen = 'profesionales' al pedir código
-- en la sección Profesionales) y DESPUÉS se corre esta migración. Ver docs/09-cuentas-pacientes.md.
-- =============================================================================

-- ---------- 1. Registro abierto, salvo para la sección Profesionales ----------

create or replace function auth_validar_correo_habilitado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- La sección Profesionales manda signInWithOtp({ options: { data: { origen: 'profesionales' } } }).
  -- Ese pedido sólo crea usuario si el correo está cargado y habilitado (como hasta ahora).
  if coalesce(new.raw_user_meta_data ->> 'origen', '') = 'profesionales'
     and not exists (
       select 1 from public.accesos_profesionales
       where email = lower(trim(new.email)) and habilitado
     ) then
    raise exception 'CORREO_NO_HABILITADO';
  end if;
  return new;
end $$;

-- ---------- 2. Vincular profesional sólo si está habilitado ----------

-- Lógica común: la usa el alta de usuario y el momento en que se habilita un correo.
create or replace function vincular_usuario_profesional(p_usuario uuid, p_email text) returns void
language plpgsql security definer set search_path = public as $$
declare
  acceso public.accesos_profesionales%rowtype;
  pid uuid;
begin
  select * into acceso from public.accesos_profesionales
  where email = lower(trim(p_email)) and habilitado;
  if not found then return; end if;

  pid := acceso.profesional_id;
  if pid is null then
    select pp.profesional_id into pid from public.profesionales_privado pp
    where lower(trim(pp.email)) = acceso.email limit 1;
  end if;
  if pid is null then
    insert into public.profesionales (nombre_publico, especialidad_id, zona_id, autorizacion)
    values (coalesce(nullif(acceso.nombre, ''), split_part(acceso.email, '@', 1)),
            acceso.especialidad_id, acceso.zona_id, 'no_publicar')
    returning id into pid;
    insert into public.profesionales_privado (profesional_id, nombre_completo, email, origen)
    values (pid, coalesce(nullif(acceso.nombre, ''), acceso.email), acceso.email, 'portal');
  end if;

  update public.profesionales set usuario_id = p_usuario where id = pid;
  update public.accesos_profesionales
     set profesional_id = pid, primer_ingreso = coalesce(primer_ingreso, now())
   where email = acceso.email;

  insert into public.usuarios_roles (usuario_id, rol) values (p_usuario, 'profesional') on conflict do nothing;
  if acceso.es_admin then
    insert into public.usuarios_roles (usuario_id, rol) values (p_usuario, 'admin') on conflict do nothing;
  end if;
end $$;

-- El trigger de alta (hpc_vincular_profesional, creado en la migración 05) llama a la lógica común.
create or replace function auth_vincular_profesional() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.vincular_usuario_profesional(new.id, new.email);
  return new;
end $$;

-- Si se habilita (o se carga ya habilitado) un correo que YA tiene cuenta —por ejemplo, alguien
-- que primero se registró como paciente—, se vincula en ese momento.
create or replace function accesos_vincular_existente() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid;
begin
  if new.habilitado then
    select id into uid from auth.users where lower(trim(email)) = new.email limit 1;
    if uid is not null and not exists (select 1 from public.profesionales where usuario_id = uid) then
      perform public.vincular_usuario_profesional(uid, new.email);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists hpc_accesos_vincular on accesos_profesionales;
-- "update of habilitado": sólo cuando cambia esa columna. La función actualiza otras columnas
-- (profesional_id, primer_ingreso), así que no se dispara a sí misma.
create trigger hpc_accesos_vincular after insert or update of habilitado on accesos_profesionales
  for each row execute function accesos_vincular_existente();

-- ---------- 3. Pacientes con cuenta en el portal ----------

alter table pacientes
  add column if not exists origen          text not null default 'bot',
  add column if not exists telefono_portal text,         -- el que escribe en el portal (no verificado)
  add column if not exists mayor_de_edad   boolean,      -- declaró tener 18 años o más (o ser el adulto responsable)
  add column if not exists actualizado     timestamptz not null default now();

alter table pacientes drop constraint if exists pacientes_origen_valido;
alter table pacientes add constraint pacientes_origen_valido check (origen in ('bot', 'portal'));
alter table pacientes drop constraint if exists pacientes_nombre_largo;
alter table pacientes add constraint pacientes_nombre_largo check (char_length(nombre) between 1 and 120);

comment on column pacientes.origen is 'bot: lo creó el asistente de WhatsApp · portal: se registró en Mi espacio';
comment on column pacientes.telefono is 'WhatsApp verificado (lo carga el bot). El paciente NO puede escribirlo desde el portal';
comment on column pacientes.telefono_portal is 'Teléfono que el paciente escribió en el portal. No verificado';

-- El id del paciente del usuario conectado (o null).
create or replace function mi_paciente_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from pacientes where usuario_id = auth.uid() limit 1;
$$;

-- Qué campos puede tocar un paciente desde el portal. RLS decide QUÉ FILAS; esto decide QUÉ CAMPOS.
-- El teléfono verificado (telefono) es el que une la cuenta con las consultas del bot: si el
-- paciente pudiera escribirlo, podría "adueñarse" de la historia de otra persona.
create or replace function proteger_campos_paciente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or es_equipo() then   -- SQL directo, service_role (bot) o equipo
    if tg_op = 'UPDATE' then new.actualizado := now(); end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.usuario_id := auth.uid();
    new.origen := 'portal';
    new.telefono := null;
    new.creado := now();
    new.consentimiento_at := now();     -- el portal sólo permite crear el perfil aceptando el aviso
  else
    new.usuario_id := old.usuario_id;
    new.origen := old.origen;
    new.telefono := old.telefono;
    new.creado := old.creado;
    new.consentimiento_at := old.consentimiento_at;
    new.actualizado := now();
  end if;
  return new;
end $$;

drop trigger if exists pacientes_campos_protegidos on pacientes;
create trigger pacientes_campos_protegidos before insert or update on pacientes
  for each row execute function proteger_campos_paciente();

drop policy if exists "paciente lee su perfil" on pacientes;
create policy "paciente lee su perfil" on pacientes for select to authenticated
  using (usuario_id = auth.uid());
drop policy if exists "paciente crea su perfil" on pacientes;
-- Una sola fila por usuario (usuario_id es unique) y sólo si aceptó el aviso (lo exige la pantalla
-- y el trigger guarda la fecha). mayor_de_edad tiene que venir en true.
create policy "paciente crea su perfil" on pacientes for insert to authenticated
  with check (usuario_id = auth.uid() and mayor_de_edad is true);
drop policy if exists "paciente edita su perfil" on pacientes;
create policy "paciente edita su perfil" on pacientes for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ---------- 4. Registro de ánimo (privado del paciente) ----------

create table if not exists registros_animo (
  id           bigint generated always as identity primary key,
  paciente_id  uuid not null references pacientes(id) on delete cascade,
  fecha        timestamptz not null default now(),
  animo        smallint not null check (animo between 1 and 5),   -- 1 = muy mal ... 5 = muy bien
  emociones    text[] not null default '{}',
  nota         text check (nota is null or char_length(nota) <= 2000),
  constraint emociones_cantidad check (cardinality(emociones) <= 12)
);
create index if not exists registros_animo_paciente on registros_animo (paciente_id, fecha desc);

alter table registros_animo enable row level security;
-- Sólo el propio paciente. A propósito NO hay política para el equipo: es un diario personal.
-- Si en el futuro el paciente quiere compartirlo con su terapeuta, se agrega con su consentimiento.
drop policy if exists "paciente gestiona su animo" on registros_animo;
create policy "paciente gestiona su animo" on registros_animo for all to authenticated
  using (paciente_id = mi_paciente_id()) with check (paciente_id = mi_paciente_id());

-- ---------- 5. Avisos para pacientes ----------

create table if not exists avisos (
  id            bigint generated always as identity primary key,
  titulo        text not null check (char_length(titulo) <= 120),
  cuerpo        text check (cuerpo is null or char_length(cuerpo) <= 1000),
  enlace        text check (enlace is null or enlace ~ '^https://'),
  texto_enlace  text,
  paciente_id   uuid references pacientes(id) on delete cascade,   -- null = para todos los pacientes con cuenta
  desde         timestamptz not null default now(),
  hasta         timestamptz,                                       -- null = sin vencimiento
  activo        boolean not null default true,
  creado        timestamptz not null default now()
);

alter table avisos enable row level security;
drop policy if exists "paciente lee avisos" on avisos;
create policy "paciente lee avisos" on avisos for select to authenticated
  using (
    activo and desde <= now() and (hasta is null or hasta > now())
    and (paciente_id is null or paciente_id = mi_paciente_id())
  );
drop policy if exists "equipo gestiona avisos" on avisos;
create policy "equipo gestiona avisos" on avisos for all to authenticated
  using (es_equipo()) with check (es_equipo());

-- Aviso de bienvenida (sólo si la tabla está vacía, para poder re-ejecutar el archivo).
insert into avisos (titulo, cuerpo)
select 'Te damos la bienvenida a tu espacio',
       'Acá vas a encontrar novedades de la Fundación, ejercicios y tu registro de ánimo. Pronto también vas a ver tus turnos. Para pedir un turno o hacer una consulta, escribinos por WhatsApp.'
where not exists (select 1 from avisos);

-- ---------- 6. Borrar mi cuenta ----------

create or replace function borrar_mi_cuenta() returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'SIN_SESION';
  end if;
  -- Las cuentas del equipo (profesionales, admisión, administración) se dan de baja desde
  -- "Administrar accesos", no desde acá: borrarlas dejaría fichas y permisos colgados.
  if exists (select 1 from usuarios_roles where usuario_id = uid)
     or exists (select 1 from profesionales where usuario_id = uid) then
    raise exception 'CUENTA_DEL_EQUIPO';
  end if;

  -- Diario y avisos personales: se borran siempre.
  delete from registros_animo where paciente_id in (select id from pacientes where usuario_id = uid);
  delete from avisos where paciente_id in (select id from pacientes where usuario_id = uid);

  -- El perfil del portal se borra, salvo que el equipo ya lo haya usado en una consulta
  -- (historia que la Ley 26.529 obliga a conservar): en ese caso sólo se desvincula la cuenta.
  delete from pacientes p
   where p.usuario_id = uid
     and not exists (select 1 from consultas c where c.paciente_id = p.id);
  update pacientes set usuario_id = null, telefono_portal = null where usuario_id = uid;

  -- Por último, el usuario (correo, sesión, vínculo con Google).
  delete from auth.users where id = uid;
end $$;

revoke all on function borrar_mi_cuenta() from public, anon;
grant execute on function borrar_mi_cuenta() to authenticated;

-- ---------- 7. Permisos de tabla ----------
-- RLS decide las filas; estos GRANT habilitan las operaciones. anon (sin sesión) no toca nada.

revoke all on registros_animo, avisos from anon;
grant select, insert, update, delete on registros_animo to authenticated;
grant select, insert, update, delete on avisos to authenticated;
grant select, insert, update on pacientes to authenticated;

-- ---------- Control ----------
select 'pacientes con cuenta' as que, count(*) from pacientes where usuario_id is not null
union all select 'avisos activos', count(*) from avisos where activo;
