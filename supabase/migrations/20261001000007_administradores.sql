-- =============================================================================
-- HPC · Administradoras/es del panel "Administrar accesos"
-- =============================================================================
-- El rol 'admin' vive en usuarios_roles y necesita el id del usuario (auth.users), que
-- recién existe cuando la persona ingresa por primera vez. Por eso se marca en la lista de
-- accesos (es_admin) y el trigger de primer ingreso le asigna el rol automáticamente.
-- =============================================================================

alter table accesos_profesionales add column if not exists es_admin boolean not null default false;

create or replace function auth_vincular_profesional() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  acceso public.accesos_profesionales%rowtype;
  pid uuid;
begin
  select * into acceso from public.accesos_profesionales where email = lower(trim(new.email));
  if not found then return new; end if;

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

  update public.profesionales set usuario_id = new.id where id = pid;
  update public.accesos_profesionales
     set profesional_id = pid, primer_ingreso = coalesce(primer_ingreso, now())
   where email = acceso.email;

  insert into public.usuarios_roles (usuario_id, rol) values (new.id, 'profesional') on conflict do nothing;
  if acceso.es_admin then
    insert into public.usuarios_roles (usuario_id, rol) values (new.id, 'admin') on conflict do nothing;
  end if;

  return new;
end $$;

-- Matías, Laura Flynn (presidenta) y Laura Solivellas (gestiona los perfiles).
update accesos_profesionales set es_admin = true
where email in ('bennimatias@gmail.com', 'lauraflynnciuffo@gmail.com', 'laurisolivellas@gmail.com');

-- Si alguna ya hubiera ingresado antes, el rol se asigna ahora mismo.
insert into usuarios_roles (usuario_id, rol)
select u.id, 'admin'
from auth.users u
join accesos_profesionales a on a.email = lower(u.email) and a.es_admin
on conflict do nothing;

-- Control
select a.email, a.nombre, a.es_admin, (u.id is not null) as ya_ingreso
from accesos_profesionales a
left join auth.users u on lower(u.email) = a.email
where a.es_admin
order by a.nombre;
