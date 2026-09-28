-- Imitación mínima de Supabase para probar las migraciones en un Postgres común.
-- Uso: ver supabase/README.md
-- Imitación mínima de Supabase: roles anon/authenticated y auth.uid() leído de una variable.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$; do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
