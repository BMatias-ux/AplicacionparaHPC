# Etapa 3 · Fase 2 del plan: base de datos y fichas de profesionales

**Fecha:** 28/09/2026 · **Rama:** `etapa-2-supabase-fichas`

## Objetivo

Que los datos de profesionales (y más adelante pacientes, consultas y turnos) vivan en una base con permisos,
y publicar en el portal las fichas del equipo por especialidad y zona, respetando lo que cada profesional autorizó.

## Decisiones

- **Supabase** (D-04 queda aprobada al usarla): Postgres + autenticación + permisos por fila.
- **Fuente de las fichas: la planilla "HPC · Fichas Profesionales 2026"** (respuestas del formulario nuevo), no la
  base histórica: es la única que tiene la **autorización de publicación** de cada profesional.
- **Dos tablas por profesional**: pública (`profesionales`) y privada (`profesionales_privado`). RLS protege filas,
  no columnas; separar es la forma segura de que el teléfono nunca viaje con la ficha.
- **La vista `fichas_publicas` aplica la autorización en la base**, no en el frontend: foto sólo con "completo",
  bio sólo con "completo" o "sin foto", nada con "no publicar". Si alguien consulta la API a mano, ve lo mismo.
- **Exclusiones clínicas ("NO aborda") son internas**: sirven para el triage, no se muestran.
- **"Pacientes actuales" no se importa**: son nombres de pacientes cargados por los profesionales.
- **Fotos**: los enlaces de Drive no sirven como imagen web; se guardan como `foto_origen` y se suben a Supabase
  Storage en la Fase 3. Mientras tanto la ficha muestra iniciales.
- **Sin SDK de Supabase en el portal**: una lectura con `fetch` a la API REST. Menos peso, mismo resultado.

## Qué se hizo

| Pieza | Archivos |
|---|---|
| Esquema, RLS, vista pública, trigger que impide a un profesional darse de baja o cambiar su usuario | `supabase/migrations/` |
| Pruebas de permisos (anónimo, profesional, admisión) | `supabase/tests/` |
| Importador de la planilla → SQL (sin datos personales en git) | `scripts/importar-fichas.mjs` |
| Sección "Equipo" con búsqueda, filtros, paginación de a 12 y botón a WhatsApp con el nombre | `src/screens/Equipo.tsx`, `src/lib/supabase.ts` |
| Navegación: "Equipo" en la barra inferior; "Recursos" queda en la barra lateral y en Inicio | `src/navegacion.ts` |

## Verificación

- Migraciones aplicadas en Postgres 16 local con los roles de Supabase simulados.
- Permisos: el público sólo ve la vista y los catálogos (0 filas de profesionales, privados y consultas); un
  profesional ve y edita sólo su ficha, no puede darse de baja; admisión ve todo.
- Importador con un CSV inventado con las mismas 74 columnas: deduplica por correo, respeta "No publicar",
  no importa pacientes, soporta comillas y saltos de línea, y correrlo dos veces no duplica.
- Portal: 12 fichas por página, filtros por zona/especialidad/modalidad/población, búsqueda sin tildes,
  mensaje de respaldo si Supabase no está configurado. Sin errores de consola en 390 px y 1440 px.

## Pendiente para cerrar

1. Crear el proyecto de Supabase (decidir de quién es la cuenta: ver `04-pendientes.md`).
2. Ejecutar las dos migraciones y cargar las variables en Vercel.
3. Exportar la planilla, correr el importador, revisar y cargar.
4. Revisar con Laura el listado resultante antes de configurar Vercel (la sección se publica apenas estén las variables).
