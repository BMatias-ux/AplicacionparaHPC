-- =============================================================================
-- HPC · Corrección: cuentas del equipo que crean su propio perfil en "Mi espacio"
-- =============================================================================
-- Problema (encontrado por Matías el 07/10/2026 con su cuenta de administrador):
--   El trigger proteger_campos_paciente (migración 09) dejaba pasar sin tocar cualquier fila
--   escrita por alguien del equipo (es_equipo()). Una cuenta del equipo que se creaba SU PROPIO
--   perfil de paciente en Mi espacio guardaba la fila SIN usuario_id (la política "equipo gestiona
--   pacientes" lo permitía). Consecuencias:
--     - Al volver a la sección, el portal no encontraba el perfil y pedía crearlo otra vez.
--     - El registro de ánimo fallaba ("Algo salió mal"), porque mi_paciente_id() no existía.
--     - Cada intento dejaba una fila suelta en pacientes.
--   Las cuentas de pacientes comunes NO estaban afectadas.
--
-- Corrección: si la fila es del propio usuario (la crea para sí mismo o edita la suya), se
-- aplican las reglas de paciente aunque la persona sea del equipo. El equipo sigue pudiendo
-- cargar y editar perfiles de OTROS pacientes como hasta ahora.
--
-- Cómo se aplica: Supabase → SQL Editor → New query → pegar todo → Run. Re-ejecutable.
-- =============================================================================

create or replace function proteger_campos_paciente() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  propio boolean;
begin
  -- SQL directo o service_role (el bot): sin restricciones.
  if auth.uid() is null then
    if tg_op = 'UPDATE' then new.actualizado := now(); end if;
    return new;
  end if;

  -- ¿Es el perfil de quien está conectado?
  --   Alta: el portal manda usuario_id = el propio (o, en versiones anteriores del portal, lo dejaba
  --         vacío y marcaba mayor_de_edad, algo que sólo hace la pantalla de Mi espacio).
  --   Edición: la fila ya era suya.
  if tg_op = 'INSERT' then
    -- coalesce: una comparación con null da null, y "not null" no es true; sin esto, el equipo
    -- cargando a otra persona caería en las reglas de paciente.
    propio := coalesce(new.usuario_id = auth.uid(), false) or (new.usuario_id is null and coalesce(new.mayor_de_edad, false));
  else
    propio := coalesce(old.usuario_id = auth.uid(), false);
  end if;

  -- El equipo cargando o editando el perfil de OTRA persona: sin cambios.
  if not propio and es_equipo() then
    if tg_op = 'UPDATE' then new.actualizado := now(); end if;
    return new;
  end if;

  -- Perfil propio (o alguien que no es del equipo): reglas de paciente.
  if tg_op = 'INSERT' then
    new.usuario_id := auth.uid();
    new.origen := 'portal';
    new.telefono := null;
    new.creado := now();
    new.consentimiento_at := now();
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

-- ---------- Control: filas sueltas que dejó el error ----------
-- Perfiles creados desde Mi espacio (mayor_de_edad = true) que quedaron sin usuario.
-- NO se borran solos: revisarlos y borrarlos a mano (ver docs/09-cuentas-pacientes.md).
select id, nombre, email, creado
from pacientes
where usuario_id is null and mayor_de_edad is true
order by creado;
