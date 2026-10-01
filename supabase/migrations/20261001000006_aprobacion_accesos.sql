-- =============================================================================
-- HPC · Aprobación manual de accesos de profesionales
-- =============================================================================
-- Problema: en accesos_profesionales quedaron TODOS los correos de la planilla de fichas,
-- y ahí hay personas que no son del equipo (aspirantes a sumarse a HPC).
--
-- Solución: columna `habilitado`. Los correos siguen cargados, pero SOLO pueden pedir
-- código e ingresar los que tengan habilitado = true. Se revisan y se marcan a mano en
-- Supabase → Table Editor → accesos_profesionales (casilla "habilitado").
--
-- Además, si más adelante se desmarca a alguien que ya había ingresado, pierde el acceso
-- a la ficha (las políticas ahora pasan por mi_profesional_id(), que exige habilitado).
-- =============================================================================

alter table accesos_profesionales
  add column if not exists habilitado boolean not null default false,
  add column if not exists notas text;   -- ej.: "aspirante, no es del equipo", "confirmado por Laura"

comment on column accesos_profesionales.habilitado is
  'true = puede pedir código e ingresar a Mi ficha. Se marca a mano después de revisar.';

-- Todo lo precargado arranca DESHABILITADO hasta que se revise. Sólo queda habilitado Matías (pruebas).
update accesos_profesionales set habilitado = (email = 'bennimatias@gmail.com');

-- 1. Al crear el usuario: el correo tiene que estar cargado Y habilitado.
create or replace function auth_validar_correo_habilitado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.accesos_profesionales
    where email = lower(trim(new.email)) and habilitado
  ) then
    raise exception 'CORREO_NO_HABILITADO';
  end if;
  return new;
end $$;

-- 2. La ficha propia sólo se reconoce si el acceso sigue habilitado.
create or replace function mi_profesional_id() returns uuid
language sql stable security definer set search_path = public as $$
  select p.id
  from profesionales p
  join accesos_profesionales a on a.profesional_id = p.id and a.habilitado
  where p.usuario_id = auth.uid()
  limit 1;
$$;

-- 3. Las políticas de la ficha y los datos privados usaban usuario_id directo:
--    se cambian para que también respeten el interruptor.
drop policy if exists "profesional lee su ficha" on profesionales;
create policy "profesional lee su ficha" on profesionales for select using (id = mi_profesional_id());
drop policy if exists "profesional edita su ficha" on profesionales;
create policy "profesional edita su ficha" on profesionales for update
  using (id = mi_profesional_id()) with check (id = mi_profesional_id());
drop policy if exists "profesional lee su privado" on profesionales_privado;
create policy "profesional lee su privado" on profesionales_privado for select
  using (profesional_id = mi_profesional_id());

-- 4. Para revisar: lista ordenada por zona (copiar el resultado o mirarlo en Table Editor).
select email, nombre, zona_id, habilitado, primer_ingreso
from accesos_profesionales
order by zona_id nulls last, nombre;
