-- 20260928000004_consentimiento.sql
-- Paso 2.6: constancia del consentimiento (Ley 25.326, art. 5).
--
-- El bot pide "Acepto / No acepto" antes de preguntar cualquier dato y guarda cuándo
-- aceptó. Si la persona no acepta, no se registra ninguna consulta.
-- Vacío sólo en alertas de riesgo registradas antes de aceptar (ver aviso de privacidad).
--
-- ⚠️ Aplicar ANTES de mergear el PR del bot que envía esta columna: si la columna no
-- existe, Supabase rechaza la fila (la hoja 'Demanda' y los logs la guardan igual).
--
-- Idempotente: se puede correr dos veces sin error.

alter table consultas add column if not exists consentimiento_at timestamptz;

comment on column consultas.consentimiento_at is
  'Cuándo aceptó el aviso de privacidad en el bot (portal.habilidadesparaelcambio.com.ar/#privacidad)';
