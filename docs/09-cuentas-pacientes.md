# 09 · Cuentas de pacientes ("Mi espacio") — Etapa A

**Fecha:** 07/10/2026 · **Rama:** `mi-espacio-pacientes` · **Migración:** `supabase/migrations/20261007000009_cuentas_pacientes.sql`

## Qué se decidió (Matías, 07/10)

- El portal pasa a ser de **autogestión del paciente**: cada persona se crea una cuenta y tiene un espacio privado.
- **Registro abierto** (cualquiera puede crearse la cuenta), para poder promocionarlo en redes.
- Ingreso con **cualquier correo** (código de un solo uso, contraseña opcional) y con **Google** desde el inicio.
- Turnos y prestaciones quedan para la **Etapa B**: Matías tiene acceso a Medexis y se evalúa ahí cómo conectarlos.

## Qué incluye la Etapa A

| Parte | Qué hace |
|---|---|
| Ingreso | Google (si está activado), código por correo o contraseña. La sesión es la misma que la de Profesionales |
| Completar perfil | Nombre (obligatorio), WhatsApp y zona (opcionales), declaración de 18+ y aceptación del aviso |
| Inicio | Novedades (tabla `avisos`: para todos o para un paciente) y accesos rápidos |
| Ánimo | Registro de 1 a 5, emociones y nota; gráfico de 14 días. **Privado**: el equipo no lo ve desde el portal. Si marca "Mal" o "Muy mal", ofrece escribir al equipo y recuerda los teléfonos de urgencia |
| Ejercicios | Respiración 4-7-8 y anclaje 5-4-3-2-1 |
| Turnos | "Muy pronto" + botón de WhatsApp |
| Mis datos | Editar perfil, crear/cambiar contraseña, salir, **borrar la cuenta** (escribiendo BORRAR) |

## Seguridad (lo decide la base, no la pantalla)

- Un paciente sólo lee y edita **su** fila de `pacientes` y **sus** `registros_animo` (RLS).
- El teléfono verificado (`pacientes.telefono`, el de WhatsApp que carga el bot) **no se puede escribir** desde el
  portal: si se pudiera, alguien podría "adueñarse" de la historia de otra persona. El que escribe el paciente va
  a `telefono_portal`. Unir la cuenta con las consultas del bot es parte de la Etapa B, con verificación.
- La sección **Profesionales** sigue exigiendo correo habilitado: manda `origen: 'profesionales'` al pedir el
  código y la base rechaza los no habilitados. Las cuentas de paciente no tienen acceso a Mi ficha ni a Derivar.
- Un aspirante que se crea cuenta de paciente **no** queda vinculado a su ficha. Si después se lo habilita en
  "Administrar accesos", se vincula solo.
- `borrar_mi_cuenta()`: borra perfil, ánimo, avisos personales y el usuario. Si el equipo ya usó el perfil en una
  consulta, sólo desvincula la cuenta (la historia clínica se conserva por ley). Las cuentas del equipo no se
  pueden borrar desde ahí.

Probado en Postgres 16 local: `supabase/tests/30_prueba_cuentas_pacientes.sql` (todas las salidas coinciden con lo esperado)
y `20_prueba_acceso_profesionales.sql` actualizado.

## Puesta en marcha (en este orden)

### 1. Publicar el portal nuevo (merge del PR)
Primero el código, porque es el que agrega la marca `origen: 'profesionales'`. Con el código nuevo y la base vieja
todo sigue funcionando como hoy (la cuenta de paciente todavía no se puede crear: la base la rechaza).

### 2. Revisar que la base de producción tenga las funciones como en el repo
Supabase → **SQL Editor** → New query → pegar y **Run**:
```sql
select pg_get_functiondef('auth_vincular_profesional'::regproc);
select pg_get_functiondef('auth_validar_correo_habilitado'::regproc);
```
Tienen que coincidir con las de las migraciones 06/07. Si alguien las cambió directo en Supabase, avisar antes del paso 3,
porque la migración 09 las reemplaza.

### 3. Correr la migración 09
SQL Editor → New query → pegar todo `20261007000009_cuentas_pacientes.sql` → **Run**. Al final muestra
"pacientes con cuenta 0 / avisos activos 1".

### 4. Revisar los textos de los correos
Supabase → **Authentication** → **Emails** (plantillas "Confirm signup" y "Magic Link"). Hoy fueron escritas pensando
en profesionales. Tienen que servir para cualquiera: por ejemplo "Tu código para ingresar al portal de Habilidades
para el Cambio es {{ .Token }}". No mencionar "Mi ficha".

### 5. Probar con un correo propio que no esté en accesos_profesionales
`#mi-espacio` → pedir código → completar perfil → guardar un registro de ánimo → borrar la cuenta.

### 6. Activar "Continuar con Google" (se puede hacer después)
1. **Google Cloud Console** (console.cloud.google.com), con una cuenta de la Fundación si es posible → crear o elegir
   un proyecto → **Google Auth Platform / OAuth consent screen**: tipo **External**, nombre "Habilidades para el
   Cambio", correo de soporte, logo opcional, dominio `habilidadesparaelcambio.com.ar`, enlace a la política de
   privacidad. Alcances: sólo los básicos (email, profile, openid).
2. **Clients** → **Create client** → tipo **Web application**.
   - *Authorized JavaScript origins*: `https://portal.habilidadesparaelcambio.com.ar`
   - *Authorized redirect URIs*: `https://hflkgvufvczqkhipicuf.supabase.co/auth/v1/callback`
   - Copiar **Client ID** y **Client secret** (el secreto no se guarda en esta carpeta; ver `06-guia-cuentas.md`).
3. **Supabase** → Authentication → **Sign In / Providers** → **Google** → Enable, pegar Client ID y Secret → Save.
4. **Supabase** → Authentication → **URL Configuration**: *Site URL* `https://portal.habilidadesparaelcambio.com.ar`;
   en *Redirect URLs* agregar `https://portal.habilidadesparaelcambio.com.ar/**` (y la URL de vista previa de Vercel
   si se quiere probar ahí).
5. **Vercel** → app-hpc → Settings → Environment Variables → `VITE_GOOGLE_ACTIVO` = `true` (Production y Preview,
   tipo **Plain**, no es secreta) → **Redeploy**. Sin esta variable el botón no aparece, así nadie ve un error de
   Google antes de tiempo.
6. Publicar la pantalla de consentimiento en Google ("Publish app"). Para mostrar nombre y logo, Google puede pedir
   verificar la marca; mientras tanto el ingreso funciona igual.

## Pendientes que quedan abiertos

- 🟠 **Aprobación del texto del aviso de privacidad** (punto 2 bis y cambios en 3, 6, 8 y 10) por la Fundación.
- 🟠 **Inscripción en la AAIP** antes de difundir masivamente (`08-instructivo-aaip.md`).
- 🟠 Pasar Supabase a **plan Pro** (copias de seguridad diarias) antes de tener volumen de pacientes.
- 🟢 Límites de envío: Supabase limita los correos de autenticación por hora (Authentication → Rate Limits) y
  Hostinger tiene un tope diario por casilla. Revisar ambos antes de una campaña grande. Con Google y contraseña
  se mandan menos códigos.
- 🟢 Protección contra registros automáticos (CAPTCHA de Supabase: hCaptcha o Turnstile) si aparecen cuentas basura.
- 🟢 Pantalla para que el equipo cargue avisos sin entrar a Supabase (hoy: Table Editor → `avisos`).
- Etapa B: turnos y prestaciones (Medexis), unir la cuenta con las consultas del bot verificando el WhatsApp.

## Corrección 07/10/2026 · cuentas del equipo en Mi espacio (migración 10)

**Síntoma (Matías, con su cuenta de administrador):** después de crear su espacio, al volver a la sección le pedía
crearlo de nuevo, y el registro de ánimo daba "Algo salió mal". Las cuentas de pacientes comunes no estaban afectadas.

**Causa:** el trigger `proteger_campos_paciente` de la migración 09 no aplicaba las reglas de paciente a las cuentas del
equipo. El perfil se guardaba sin `usuario_id`, así que el portal no lo encontraba y el registro de ánimo no tenía a
quién pertenecer. No era un problema de sesión.

**Arreglo:** migración `20261007000010_perfil_propio_equipo.sql` (si la fila es del propio usuario, rigen las reglas de
paciente aunque sea del equipo) y el portal manda `usuario_id` al crear el perfil. Pruebas en `tests/31_prueba_perfil_equipo.sql`.

**Limpieza (manual):** cada intento fallido dejó una fila suelta. Para verlas y borrarlas, en el SQL Editor:
```sql
-- 1) Ver
select id, nombre, email, creado from pacientes where usuario_id is null and mayor_de_edad is true;
-- 2) Borrar (sólo esas filas; no toca pacientes del bot ni con consultas)
delete from pacientes p
 where p.usuario_id is null and p.mayor_de_edad is true
   and not exists (select 1 from consultas c where c.paciente_id = p.id);
```
Nota: las cuentas del equipo pueden tener su espacio de paciente, pero no pueden borrarlo desde "Mis datos"
(se dan de baja desde administración).
