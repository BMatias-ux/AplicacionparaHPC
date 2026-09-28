-- =============================================================================
-- HPC · Esquema inicial (Fase 2)
-- =============================================================================
-- Qué crea:
--   1. Catálogos: zonas, especialidades, temáticas, enfoques, poblaciones, exclusiones.
--   2. Profesionales, separado en DOS tablas:
--        profesionales          -> lo que puede llegar a ser público (ficha)
--        profesionales_privado  -> contacto, matrículas, dirección, honorarios (nunca público)
--   3. Relaciones profesional <-> catálogos (muchos a muchos).
--   4. Pacientes y consultas (lo que hoy es la hoja 'Demanda' del bot).
--   5. Roles de usuario y políticas de acceso por fila (RLS).
--   6. La vista pública `fichas_publicas`, que es lo ÚNICO que ve el portal sin login.
--
-- Por qué dos tablas para profesionales: con RLS se protegen FILAS, no columnas.
-- Si el teléfono y la ficha pública estuvieran en la misma tabla, dar acceso público a
-- la fila expondría también el teléfono. Separarlas es la forma simple y segura.
--
-- Cómo se aplica: Supabase → SQL Editor → pegar y ejecutar, o `supabase db push`.
-- =============================================================================

-- ---------- Tipos ----------

-- Lo que cada profesional autorizó en la Ficha Profesional (pregunta "Autoriza publicación").
create type autorizacion_publicacion as enum (
  'completo',          -- "Sí, perfil completo con foto"
  'sin_foto',          -- "Sí, pero sin foto"
  'solo_nombre',       -- "Solo nombre y especialidades"
  'no_publicar'        -- "No publicar" o sin respuesta
);

create type rol_usuario as enum ('admin', 'admision', 'coordinacion', 'profesional');

create type estado_consulta as enum ('nueva', 'contactada', 'derivada', 'en_tratamiento', 'cerrada', 'descartada');

-- ---------- Catálogos ----------

create table zonas (
  id           text primary key,             -- 'caba', 'ba_oeste'... (coincide con los ids del bot sin el prefijo 'zona_')
  nombre       text not null unique,
  provincia    text not null,
  coordinador  text,                          -- nombre visible; el acceso real va por usuarios_roles
  presencial   boolean not null default true, -- false para zonas sin equipo presencial confirmado
  orden        smallint not null default 0
);

create table especialidades (
  id      text primary key,                   -- 'psicologia', 'psiquiatria', 'nutricion'...
  nombre  text not null unique
);

create table tematicas (
  id      bigint generated always as identity primary key,
  nombre  text not null unique,
  grupo   text                                -- agrupador para mostrar (Ansiedad, Ánimo, Vínculos...)
);

create table enfoques (
  id      bigint generated always as identity primary key,
  nombre  text not null unique
);

create table poblaciones (
  id      text primary key,                   -- 'ninez', 'adolescencia', 'adultez_joven'...
  nombre  text not null unique,
  orden   smallint not null default 0
);

create table exclusiones (
  id      bigint generated always as identity primary key,
  nombre  text not null unique
);

-- ---------- Profesionales ----------

create table profesionales (
  id                 uuid primary key default gen_random_uuid(),
  nombre_publico     text not null,           -- "Lic. Paula Puig"
  especialidad_id    text not null references especialidades(id),
  zona_id            text references zonas(id),
  presentacion       text,                    -- bio corta
  biografia          text,                    -- bio extendida
  propuesta_valor    text,
  frase              text,
  foto_url           text,                    -- Supabase Storage (Fase 3). Sólo se muestra si autorizacion = 'completo'
  online             boolean not null default false,
  presencial         boolean not null default false,
  edad_minima        smallint,
  edad_maxima        smallint,                -- null = sin tope
  idiomas            text[] not null default '{}',
  areas_destacadas   text,
  autorizacion       autorizacion_publicacion not null default 'no_publicar',
  activo             boolean not null default true,   -- false = ya no trabaja en la Fundación
  usuario_id         uuid unique,             -- auth.users.id cuando tenga acceso (Fase 3)
  creado             timestamptz not null default now(),
  actualizado        timestamptz not null default now()
);

create table profesionales_privado (
  profesional_id        uuid primary key references profesionales(id) on delete cascade,
  nombre_completo       text not null,
  email                 text,
  telefono              text,
  matricula_nacional    text,
  matricula_provincial  text,
  titulo                text,
  universidad           text,
  anio_egreso           smallint,
  seguro_mala_praxis    text,
  posgrados             text,
  formaciones_hpc       text,
  direccion             text,
  localidad             text,
  provincia             text,
  autoriza_direccion    boolean not null default false,
  cupos_texto           text,                 -- texto libre del formulario (se estructura en Fase 4)
  cupos_nuevos_mes      text,
  tiempo_espera         text,
  admision_urgente      text,
  deriva_a              text,
  otras_exclusiones     text,
  honorarios            text,
  formas_pago           text,
  facturacion           text,
  foto_origen           text,                 -- enlace de Drive que cargó en el formulario (se pasa a Storage en Fase 3)
  observaciones         text,
  origen                text not null default 'ficha_2026',   -- de dónde vino el dato
  fila_origen           integer                               -- fila en la planilla, para auditar
);

create table profesional_tematica (
  profesional_id  uuid references profesionales(id) on delete cascade,
  tematica_id     bigint references tematicas(id) on delete cascade,
  primary key (profesional_id, tematica_id)
);

create table profesional_enfoque (
  profesional_id  uuid references profesionales(id) on delete cascade,
  enfoque_id      bigint references enfoques(id) on delete cascade,
  primary key (profesional_id, enfoque_id)
);

create table profesional_poblacion (
  profesional_id  uuid references profesionales(id) on delete cascade,
  poblacion_id    text references poblaciones(id) on delete cascade,
  primary key (profesional_id, poblacion_id)
);

-- Exclusiones: lo que el profesional NO aborda. Es interno (sirve para el triage),
-- no se muestra en la ficha pública.
create table profesional_exclusion (
  profesional_id  uuid references profesionales(id) on delete cascade,
  exclusion_id    bigint references exclusiones(id) on delete cascade,
  primary key (profesional_id, exclusion_id)
);

-- ---------- Pacientes y consultas ----------
-- Datos de salud: sin acceso público, sólo admisión/coordinación/admin (ver RLS).

create table pacientes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  telefono      text unique,                 -- el WhatsApp, formato internacional sin '+'
  email         text,
  fecha_nac     date,
  zona_id       text references zonas(id),
  usuario_id    uuid unique,                 -- auth.users.id cuando tenga acceso (Fase 4)
  consentimiento_at timestamptz,             -- cuándo aceptó el aviso de privacidad (paso 2.6)
  creado        timestamptz not null default now()
);

create table consultas (
  id               uuid primary key default gen_random_uuid(),
  fecha            timestamptz not null default now(),
  canal            text not null default 'whatsapp',   -- 'whatsapp' | 'portal'
  telefono         text not null,
  paciente_id      uuid references pacientes(id),
  opcion           text,                     -- id de la opción del bot ('terapia_individual'...)
  nombre           text,
  edad             smallint,
  zona             text,
  modalidad        text,
  disponibilidad   text,
  motivo           text,                     -- SENSIBLE
  riesgo           text,                     -- SENSIBLE
  prioridad        text not null default 'normal',
  estado           estado_consulta not null default 'nueva',
  profesional_id   uuid references profesionales(id),   -- a quién se derivó
  responsable_id   uuid,                     -- auth.users.id de quien la gestiona
  notas            text
);

create index consultas_estado_idx on consultas (estado, fecha desc);
create index consultas_telefono_idx on consultas (telefono);

-- ---------- Roles ----------

create table usuarios_roles (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null,                 -- auth.users.id
  rol         rol_usuario not null,
  zona_id     text references zonas(id),     -- sólo para 'coordinacion': la zona que coordina
  -- NULLS NOT DISTINCT (Postgres 15+): impide duplicar "admin sin zona" dos veces.
  -- No puede ser primary key porque zona_id queda vacía para admin/admisión.
  unique nulls not distinct (usuario_id, rol, zona_id)
);

-- Helpers para las políticas. SECURITY DEFINER para poder leer usuarios_roles sin que
-- la propia RLS de esa tabla lo impida; search_path fijo por seguridad.
create function tiene_rol(r rol_usuario) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from usuarios_roles where usuario_id = auth.uid() and rol = r);
$$;

create function es_equipo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuarios_roles
    where usuario_id = auth.uid() and rol in ('admin', 'admision', 'coordinacion')
  );
$$;

-- ---------- Mantener 'actualizado' ----------

create function marcar_actualizado() returns trigger language plpgsql as $$
begin
  new.actualizado := now();
  return new;
end $$;

create trigger profesionales_actualizado before update on profesionales
  for each row execute function marcar_actualizado();

-- Un profesional puede editar su ficha (bio, foto, modalidad, idiomas, su propia
-- autorización de publicación...), pero NO darse de alta/baja ni cambiar a qué usuario
-- está vinculada la ficha. RLS decide QUÉ FILAS; esto decide QUÉ CAMPOS.
create function proteger_campos_profesional() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tiene_rol('admin') or auth.uid() is null then  -- admin, o service_role/SQL directo
    return new;
  end if;
  if new.activo is distinct from old.activo
     or new.usuario_id is distinct from old.usuario_id
     or new.especialidad_id is distinct from old.especialidad_id then
    raise exception 'Sólo administración puede cambiar estado, especialidad o usuario de la ficha';
  end if;
  return new;
end $$;

create trigger profesionales_campos_protegidos before update on profesionales
  for each row execute function proteger_campos_profesional();

-- =============================================================================
-- RLS: nadie ve nada salvo lo que una política permite explícitamente.
-- =============================================================================

alter table zonas                 enable row level security;
alter table especialidades        enable row level security;
alter table tematicas             enable row level security;
alter table enfoques              enable row level security;
alter table poblaciones           enable row level security;
alter table exclusiones           enable row level security;
alter table profesionales         enable row level security;
alter table profesionales_privado enable row level security;
alter table profesional_tematica  enable row level security;
alter table profesional_enfoque   enable row level security;
alter table profesional_poblacion enable row level security;
alter table profesional_exclusion enable row level security;
alter table pacientes             enable row level security;
alter table consultas             enable row level security;
alter table usuarios_roles        enable row level security;

-- Catálogos: lectura pública (son listas de opciones, no datos de personas).
create policy "catalogo lectura" on zonas          for select using (true);
create policy "catalogo lectura" on especialidades for select using (true);
create policy "catalogo lectura" on tematicas      for select using (true);
create policy "catalogo lectura" on enfoques       for select using (true);
create policy "catalogo lectura" on poblaciones    for select using (true);
-- exclusiones: sólo equipo (revelan criterios clínicos internos)
create policy "equipo lee exclusiones" on exclusiones for select using (es_equipo());

-- Profesionales: el equipo ve todo; cada profesional ve y edita su propia fila.
-- El público NO lee esta tabla directo: usa la vista fichas_publicas.
create policy "equipo lee profesionales" on profesionales for select using (es_equipo());
create policy "profesional lee su ficha" on profesionales for select using (usuario_id = auth.uid());
create policy "profesional edita su ficha" on profesionales for update
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "admin gestiona profesionales" on profesionales for all
  using (tiene_rol('admin')) with check (tiene_rol('admin'));

create policy "equipo lee privado" on profesionales_privado for select using (es_equipo());
create policy "profesional lee su privado" on profesionales_privado for select
  using (exists (select 1 from profesionales p where p.id = profesional_id and p.usuario_id = auth.uid()));
create policy "admin gestiona privado" on profesionales_privado for all
  using (tiene_rol('admin')) with check (tiene_rol('admin'));

-- Relaciones: mismas reglas que la ficha a la que pertenecen.
create policy "equipo lee" on profesional_tematica  for select using (es_equipo());
create policy "equipo lee" on profesional_enfoque   for select using (es_equipo());
create policy "equipo lee" on profesional_poblacion for select using (es_equipo());
create policy "equipo lee" on profesional_exclusion for select using (es_equipo());
create policy "admin gestiona" on profesional_tematica  for all using (tiene_rol('admin')) with check (tiene_rol('admin'));
create policy "admin gestiona" on profesional_enfoque   for all using (tiene_rol('admin')) with check (tiene_rol('admin'));
create policy "admin gestiona" on profesional_poblacion for all using (tiene_rol('admin')) with check (tiene_rol('admin'));
create policy "admin gestiona" on profesional_exclusion for all using (tiene_rol('admin')) with check (tiene_rol('admin'));

-- Pacientes y consultas: sólo equipo. El bot escribe con la service_role key, que
-- saltea RLS por diseño y vive únicamente en las variables de entorno de Vercel.
create policy "equipo lee pacientes"      on pacientes for select using (es_equipo());
create policy "equipo gestiona pacientes" on pacientes for all using (es_equipo()) with check (es_equipo());
create policy "equipo lee consultas"      on consultas for select using (es_equipo());
create policy "equipo gestiona consultas" on consultas for all using (es_equipo()) with check (es_equipo());
create policy "profesional ve sus derivaciones" on consultas for select
  using (exists (select 1 from profesionales p where p.id = profesional_id and p.usuario_id = auth.uid()));

-- Roles: cada uno ve los suyos; sólo admin los asigna.
create policy "ver mis roles" on usuarios_roles for select using (usuario_id = auth.uid());
create policy "admin asigna roles" on usuarios_roles for all using (tiene_rol('admin')) with check (tiene_rol('admin'));

-- =============================================================================
-- Vista pública: lo único que el portal lee sin login.
-- =============================================================================
-- Reglas que aplica (y que NO dependen de que el frontend se porte bien):
--   * sólo activos y con autorización distinta de 'no_publicar'
--   * foto sólo si autorizó 'completo'
--   * bio, propuesta y frase sólo si autorizó 'completo' o 'sin_foto'
--   * nunca contacto, matrícula, dirección, cupos, honorarios ni exclusiones
--
-- security_invoker = false (valor por defecto): la vista corre con los permisos de su
-- dueño, por eso puede leer `profesionales` aunque el rol anon no tenga política.
-- Es la forma documentada de exponer un subconjunto controlado de columnas.

create view fichas_publicas as
select
  p.id,
  p.nombre_publico,
  e.nombre                                   as especialidad,
  p.especialidad_id,
  z.nombre                                   as zona,
  p.zona_id,
  z.provincia,
  p.online,
  p.presencial,
  case when p.autorizacion = 'completo' then p.foto_url end                        as foto_url,
  case when p.autorizacion in ('completo','sin_foto') then p.presentacion end     as presentacion,
  case when p.autorizacion in ('completo','sin_foto') then p.biografia end        as biografia,
  case when p.autorizacion in ('completo','sin_foto') then p.propuesta_valor end  as propuesta_valor,
  case when p.autorizacion in ('completo','sin_foto') then p.frase end            as frase,
  p.idiomas,
  coalesce((select array_agg(t.nombre order by t.nombre)
            from profesional_tematica pt join tematicas t on t.id = pt.tematica_id
            where pt.profesional_id = p.id), '{}')                                 as tematicas,
  coalesce((select array_agg(en.nombre order by en.nombre)
            from profesional_enfoque pe join enfoques en on en.id = pe.enfoque_id
            where pe.profesional_id = p.id), '{}')                                 as enfoques,
  coalesce((select array_agg(po.nombre order by po.orden)
            from profesional_poblacion pp join poblaciones po on po.id = pp.poblacion_id
            where pp.profesional_id = p.id), '{}')                                 as poblaciones
from profesionales p
join especialidades e on e.id = p.especialidad_id
left join zonas z on z.id = p.zona_id
where p.activo and p.autorizacion <> 'no_publicar';

grant select on fichas_publicas to anon, authenticated;
