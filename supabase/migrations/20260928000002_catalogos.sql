-- =============================================================================
-- HPC · Catálogos iniciales (Fase 2)
-- =============================================================================
-- Sale de la Ficha Profesional (formulario de 73 campos) y de los ids del bot.
-- Son listas de opciones: se pueden ampliar después sin tocar código.

insert into zonas (id, nombre, provincia, coordinador, presencial, orden) values
  ('caba',      'CABA',                'Ciudad de Buenos Aires', 'Lic. Marcos Maggi',           true,  1),
  ('ba_norte',  'Buenos Aires Norte',  'Buenos Aires',           'Lic. Marcos Maggi',           false, 2),
  ('ba_oeste',  'Buenos Aires Oeste',  'Buenos Aires',           'Lic. Natalia Díaz',           true,  3),
  ('ba_sur',    'Buenos Aires Sur',    'Buenos Aires',           'Lic. Cecilia Brittes Mazza',  true,  4),
  ('salta',     'Salta',               'Salta',                  'Lic. Patricia Petrecca',      false, 5),
  ('tucuman',   'Tucumán',             'Tucumán',                'Lic. Patricia Petrecca',      true,  6),
  ('neuquen',   'Neuquén',             'Neuquén',                'Lic. Natalia Díaz',           true,  7),
  ('santa_fe',  'Santa Fe',            'Santa Fe',               'Lic. Florencia Ulla',         true,  8),
  ('cordoba',   'Córdoba',             'Córdoba',                'Lic. Florencia Ulla',         true,  9);
-- 'presencial = false' en Norte y Salta: sin equipo presencial confirmado al 09/2026 (decisión D-07).

insert into especialidades (id, nombre) values
  ('psicologia',  'Psicología'),
  ('psiquiatria', 'Psiquiatría'),
  ('nutricion',   'Nutrición');

insert into poblaciones (id, nombre, orden) values
  ('ninez',          'Niñez',            1),
  ('adolescencia',   'Adolescencia',     2),
  ('adultez_joven',  'Adultez joven',    3),
  ('adultez',        'Adultez',          4),
  ('adultos_mayores','Adultos mayores',  5),
  ('parejas',        'Parejas',          6),
  ('familias',       'Familias',         7);
-- Temáticas, enfoques y exclusiones se cargan desde las respuestas reales con el
-- importador (scripts/importar-fichas.mjs), para no inventar una taxonomía distinta
-- de la que ya usa el formulario.
