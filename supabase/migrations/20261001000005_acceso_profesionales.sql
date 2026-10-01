-- =============================================================================
-- HPC · Acceso de profesionales a "Mi ficha" (Fase 3)
-- =============================================================================
-- Qué agrega:
--   1. accesos_profesionales: la LISTA DE CORREOS HABILITADOS. Sólo esos correos pueden
--      crear usuario en el portal. Se carga a mano (o con un INSERT) desde administración.
--   2. Dos triggers sobre auth.users (la tabla de usuarios de Supabase):
--        - ANTES de crear el usuario: si el correo no está habilitado, se rechaza.
--        - DESPUÉS de crearlo: se vincula a su ficha (o se le crea una vacía) y recibe el rol 'profesional'.
--   3. profesional_horarios: agenda por día y franja, con modalidad (presencial / online).
--      Responde al pedido de Laura: "por la tarde" no sirve, y hay que saber qué franja es de qué modalidad.
--   4. Permisos (RLS) para que cada profesional edite SOLO lo suyo: ficha, datos privados,
--      temáticas, enfoques, poblaciones, exclusiones, horarios y foto.
--   5. Bucket de Storage 'fotos-profesionales' (público para lectura; cada uno sube sólo en su carpeta).
--
-- Cómo se aplica: Supabase → SQL Editor → New query → pegar todo → Run.
-- Es idempotente en lo posible (if not exists / or replace) para poder re-ejecutarla.
-- =============================================================================

-- ---------- 1. Correos habilitados ----------

create table if not exists accesos_profesionales (
  email           text primary key,          -- siempre en minúsculas (lo fuerza el check)
  nombre          text,                      -- para crear la ficha si todavía no existe
  zona_id         text references zonas(id),
  especialidad_id text not null default 'psicologia' references especialidades(id),
  profesional_id  uuid references profesionales(id) on delete set null,  -- se completa solo al primer ingreso
  creado          timestamptz not null default now(),
  primer_ingreso  timestamptz,
  constraint email_minusculas check (email = lower(trim(email)))
);

alter table accesos_profesionales enable row level security;
drop policy if exists "admin gestiona accesos" on accesos_profesionales;
create policy "admin gestiona accesos" on accesos_profesionales for all
  using (tiene_rol('admin')) with check (tiene_rol('admin'));
drop policy if exists "equipo lee accesos" on accesos_profesionales;
create policy "equipo lee accesos" on accesos_profesionales for select using (es_equipo());

-- Precarga: todos los profesionales que ya tienen correo en su ficha importada quedan habilitados
-- y apuntando a su ficha. Así los que ya completaron el formulario no empiezan de cero.
insert into accesos_profesionales (email, nombre, zona_id, especialidad_id, profesional_id)
select distinct on (lower(trim(pp.email)))
       lower(trim(pp.email)), p.nombre_publico, p.zona_id, p.especialidad_id, p.id
from profesionales_privado pp
join profesionales p on p.id = pp.profesional_id
where pp.email is not null and trim(pp.email) <> '' and p.activo
order by lower(trim(pp.email)), p.actualizado desc
on conflict (email) do nothing;

-- ---------- 2. Triggers sobre auth.users ----------

-- 2a. Antes de crear el usuario: el correo tiene que estar habilitado.
-- Los usuarios del equipo (admin, admisión) también se agregan a esta lista.
create or replace function auth_validar_correo_habilitado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.accesos_profesionales where email = lower(trim(new.email))) then
    -- El portal muestra un mensaje amable cuando ve este error.
    raise exception 'CORREO_NO_HABILITADO';
  end if;
  return new;
end $$;

drop trigger if exists hpc_validar_correo on auth.users;
create trigger hpc_validar_correo before insert on auth.users
  for each row execute function auth_validar_correo_habilitado();

-- 2b. Después de crearlo: vincular (o crear) la ficha y asignar rol.
create or replace function auth_vincular_profesional() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  acceso public.accesos_profesionales%rowtype;
  pid uuid;
begin
  select * into acceso from public.accesos_profesionales where email = lower(trim(new.email));
  if not found then return new; end if;

  pid := acceso.profesional_id;

  -- Si no tenía ficha vinculada, buscar una por correo en los datos privados.
  if pid is null then
    select pp.profesional_id into pid
    from public.profesionales_privado pp
    where lower(trim(pp.email)) = acceso.email
    limit 1;
  end if;

  -- Si sigue sin ficha, crear una vacía (no se publica hasta que el profesional autorice).
  if pid is null then
    insert into public.profesionales (nombre_publico, especialidad_id, zona_id, autorizacion)
    values (coalesce(nullif(acceso.nombre, ''), split_part(acceso.email, '@', 1)),
            acceso.especialidad_id, acceso.zona_id, 'no_publicar')
    returning id into pid;
    insert into public.profesionales_privado (profesional_id, nombre_completo, email, origen)
    values (pid, coalesce(nullif(acceso.nombre, ''), acceso.email), acceso.email, 'portal');
  end if;

  update public.profesionales set usuario_id = new.id where id = pid;
  update public.accesos_profesionales
     set profesional_id = pid, primer_ingreso = coalesce(primer_ingreso, now())
   where email = acceso.email;

  insert into public.usuarios_roles (usuario_id, rol) values (new.id, 'profesional')
  on conflict do nothing;

  return new;
end $$;

drop trigger if exists hpc_vincular_profesional on auth.users;
create trigger hpc_vincular_profesional after insert on auth.users
  for each row execute function auth_vincular_profesional();

-- Ayuda para las políticas: el id de la ficha del usuario conectado.
create or replace function mi_profesional_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from profesionales where usuario_id = auth.uid() limit 1;
$$;

-- ---------- 3. Horarios ----------

do $$ begin
  create type modalidad_atencion as enum ('presencial', 'online');
exception when duplicate_object then null; end $$;

create table if not exists profesional_horarios (
  id              bigint generated always as identity primary key,
  profesional_id  uuid not null references profesionales(id) on delete cascade,
  dia             smallint not null check (dia between 1 and 7),   -- 1 = lunes ... 7 = domingo (ISO)
  desde           time not null,
  hasta           time not null,
  modalidad       modalidad_atencion not null,
  sede            text,                                            -- consultorio / sede, si es presencial
  constraint franja_valida check (hasta > desde)
);
create index if not exists profesional_horarios_prof on profesional_horarios (profesional_id);

alter table profesional_horarios enable row level security;
drop policy if exists "equipo lee horarios" on profesional_horarios;
create policy "equipo lee horarios" on profesional_horarios for select using (es_equipo());
drop policy if exists "profesional gestiona sus horarios" on profesional_horarios;
create policy "profesional gestiona sus horarios" on profesional_horarios for all
  using (profesional_id = mi_profesional_id()) with check (profesional_id = mi_profesional_id());
drop policy if exists "admin gestiona horarios" on profesional_horarios;
create policy "admin gestiona horarios" on profesional_horarios for all
  using (tiene_rol('admin')) with check (tiene_rol('admin'));

-- ---------- 4. Permisos de edición propia ----------

-- Datos privados: el profesional puede actualizar su fila (no crearla ni borrarla).
drop policy if exists "profesional edita su privado" on profesionales_privado;
create policy "profesional edita su privado" on profesionales_privado for update
  using (profesional_id = mi_profesional_id()) with check (profesional_id = mi_profesional_id());

-- No puede tocar los campos de auditoría de la importación.
create or replace function proteger_campos_privado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tiene_rol('admin') or auth.uid() is null then return new; end if;
  new.origen := old.origen;
  new.fila_origen := old.fila_origen;
  new.profesional_id := old.profesional_id;
  return new;
end $$;
drop trigger if exists privado_campos_protegidos on profesionales_privado;
create trigger privado_campos_protegidos before update on profesionales_privado
  for each row execute function proteger_campos_privado();

-- Relaciones con catálogos: leer, agregar y quitar las propias.
do $$
declare t text;
begin
  foreach t in array array['profesional_tematica','profesional_enfoque','profesional_poblacion','profesional_exclusion'] loop
    execute format('drop policy if exists "profesional lee lo suyo" on %I', t);
    execute format('create policy "profesional lee lo suyo" on %I for select using (profesional_id = mi_profesional_id())', t);
    execute format('drop policy if exists "profesional agrega lo suyo" on %I', t);
    execute format('create policy "profesional agrega lo suyo" on %I for insert with check (profesional_id = mi_profesional_id())', t);
    execute format('drop policy if exists "profesional quita lo suyo" on %I', t);
    execute format('create policy "profesional quita lo suyo" on %I for delete using (profesional_id = mi_profesional_id())', t);
  end loop;
end $$;

-- Las exclusiones (catálogo) sólo las leía el equipo; el profesional necesita verlas para elegir.
drop policy if exists "profesional lee exclusiones" on exclusiones;
create policy "profesional lee exclusiones" on exclusiones for select using (mi_profesional_id() is not null);

-- ---------- 5. Fotos ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-profesionales', 'fotos-profesionales', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Cada profesional sube a la carpeta con el id de su ficha: fotos-profesionales/<profesional_id>/foto.jpg
drop policy if exists "profesional sube su foto" on storage.objects;
create policy "profesional sube su foto" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-profesionales' and (storage.foldername(name))[1] = mi_profesional_id()::text);
drop policy if exists "profesional reemplaza su foto" on storage.objects;
create policy "profesional reemplaza su foto" on storage.objects for update to authenticated
  using (bucket_id = 'fotos-profesionales' and (storage.foldername(name))[1] = mi_profesional_id()::text);
drop policy if exists "profesional borra su foto" on storage.objects;
create policy "profesional borra su foto" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-profesionales' and (storage.foldername(name))[1] = mi_profesional_id()::text);
