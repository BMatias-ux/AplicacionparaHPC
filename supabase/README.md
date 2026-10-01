# Base de datos (Supabase)

## Qué hay acá

| Archivo | Qué hace |
|---|---|
| `migrations/20260928000001_esquema_inicial.sql` | Tablas, permisos por fila (RLS) y la vista pública `fichas_publicas` |
| `migrations/20260928000002_catalogos.sql` | Zonas (con coordinadores), especialidades y poblaciones |
| `tests/00_stub_supabase.sql` | Imitación mínima de Supabase para probar en un Postgres común |
| `tests/10_prueba_permisos.sql` | Pruebas de permisos: qué ve el público, un profesional y admisión |
| `../scripts/importar-fichas.mjs` | Convierte la planilla "HPC · Fichas Profesionales 2026" en SQL de carga |

## Modelo, en una línea por tabla

- `profesionales`: lo que puede llegar a ser público (ficha). `profesionales_privado`: contacto, matrícula, dirección, honorarios. **Nunca públicos.**
- `tematicas`, `enfoques`, `poblaciones`, `exclusiones` + tablas `profesional_*`: catálogos y relaciones (sirven para filtrar y, en la Fase 5, para el triage).
- `pacientes`, `consultas`: lo que hoy es la hoja 'Demanda'. Sólo el equipo.
- `usuarios_roles`: admin, admisión, coordinación (por zona), profesional.
- `fichas_publicas` (vista): lo único que ve el portal sin login. Aplica la autorización de cada profesional.

## Estado (28/09/2026)

Proyecto `hpc` (ref `hflkgvufvczqkhipicuf`, São Paulo) en la organización **Fundación HPC**. Las dos migraciones ya
están aplicadas. URL: `https://hflkgvufvczqkhipicuf.supabase.co`.

## Poner en marcha (procedimiento, por si hay que rehacerlo)

1. Crear el proyecto en supabase.com (región São Paulo, la más cercana).
2. SQL Editor → pegar y ejecutar `migrations/...01_esquema_inicial.sql`, después `...02_catalogos.sql`.
3. Project Settings → API: copiar **Project URL** y **anon public key** a Vercel (app-hpc → Settings →
   Environment Variables) como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, y redeploy.
4. Cargar las fichas: ver "Importar la planilla".

## Importar la planilla de fichas

```powershell
cd C:\Proyectos\app-hpc
mkdir datos   # la carpeta datos\ está en .gitignore: nunca se sube a GitHub
# En la planilla, pestaña "Respuestas": Archivo -> Descargar -> CSV. Guardarlo como datos\fichas.csv
node scripts/importar-fichas.mjs datos/fichas.csv
```

Muestra un resumen sin nombres (cuántas fichas, por zona, por autorización) y genera `datos\importacion.sql`.
Revisarlo y pegarlo en Supabase → SQL Editor → Run. Se puede volver a correr cuando lleguen respuestas nuevas:
reemplaza lo importado antes desde la planilla, sin duplicar.

## Probar las migraciones en local (opcional)

Con Postgres 15+ instalado:

```powershell
psql -U postgres -c "create database hpc_prueba"
psql -U postgres -d hpc_prueba -f supabase/tests/00_stub_supabase.sql
psql -U postgres -d hpc_prueba -f supabase/migrations/20260928000001_esquema_inicial.sql
psql -U postgres -d hpc_prueba -f supabase/migrations/20260928000002_catalogos.sql
psql -U postgres -d hpc_prueba -f supabase/tests/10_prueba_permisos.sql
```

Cada consulta de la prueba dice en su título el resultado esperado.

## Acceso de profesionales — "Mi ficha" (01/10/2026)

Migración `20261001000005_acceso_profesionales.sql` + pantalla `src/screens/Profesionales.tsx`.
Enlace para compartir: **https://portal.habilidadesparaelcambio.com.ar/#profesionales**

- Ingreso sin contraseña: correo → código de 6 dígitos (Supabase Auth, OTP por email).
- **Sólo entran los correos de `accesos_profesionales`** (trigger `hpc_validar_correo` sobre `auth.users`).
  Al primer ingreso se vincula la ficha existente (por correo) o se crea una vacía con `no_publicar`.
- Cada profesional edita sólo lo suyo (RLS): ficha, datos privados, temáticas, enfoques, poblaciones,
  exclusiones, foto (bucket `fotos-profesionales`) y **agenda por día/franja con modalidad** (`profesional_horarios`).
- Pruebas: `tests/20_prueba_acceso_profesionales.sql` (correr después de las migraciones, como las otras).

### Habilitar correos

```sql
insert into accesos_profesionales (email, nombre, zona_id) values
  ('nombre@ejemplo.com', 'Lic. Nombre Apellido', 'salta')
on conflict (email) do nothing;
```
El correo va en minúsculas. `zona_id`: caba, ba_norte, ba_oeste, ba_sur, salta, tucuman, neuquen, santa_fe, cordoba.

### Configuración de Auth (una sola vez, en el panel de Supabase)

1. Authentication → Emails → SMTP Settings: casilla de Hostinger (smtp.hostinger.com, puerto 465).
   Sin SMTP propio, Supabase sólo envía correos a miembros de la organización.
2. Authentication → Emails → Templates → Magic Link: el cuerpo tiene que incluir `{{ .Token }}` (el código).
3. Authentication → URL Configuration → Site URL: `https://portal.habilidadesparaelcambio.com.ar`.
