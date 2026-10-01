-- 08: Subida de fotos de profesionales (01/10/2026)
--
-- Problema: nadie podía subir su foto en "Mi ficha". El portal sube con upsert
-- (reemplaza la foto si ya existe) y Supabase Storage exige para eso los permisos
-- INSERT + SELECT + UPDATE sobre storage.objects. La migración 05 creó INSERT, UPDATE
-- y DELETE pero no SELECT, así que toda subida era rechazada por RLS.
-- Docs: https://supabase.com/docs/guides/storage/security/access-control
--
-- Solución: cada profesional puede "ver" (SELECT) sólo los archivos de su propia carpeta
-- fotos-profesionales/<profesional_id>/. La lectura pública de las fotos ya funciona
-- aparte, porque el bucket es público (URL directa), así que esto no expone nada nuevo.

drop policy if exists "profesional ve su foto" on storage.objects;
create policy "profesional ve su foto" on storage.objects for select to authenticated
  using (bucket_id = 'fotos-profesionales' and (storage.foldername(name))[1] = mi_profesional_id()::text);
