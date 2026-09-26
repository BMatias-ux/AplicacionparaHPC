# 00 · Instrucciones de esta carpeta

Esta carpeta es la memoria del proyecto. Sirve para tres cosas:
1. Retomar el trabajo después de semanas sin perder el hilo (qué se hizo, por qué).
2. Darle contexto a Claude (o a quien sea) al empezar una sesión nueva.
3. Armar al final el manual de procedimiento de uso para el equipo de HPC.

## Reglas

- **Una sesión = una entrada en `02-bitacora.md`.** Fecha, qué se pidió, qué se hizo, qué se decidió, qué quedó pendiente.
- **Una etapa = un archivo en `etapas/`** (`etapa-01-...md`). Se abre cuando empieza la etapa y se cierra con el resultado.
- **Los prompts importantes van a `historico/`** con fecha en el nombre (`AAAA-MM-DD-tema.md`), textuales, sin editar.
- **Las decisiones** van en `01-especificacion.md`, sección *Decisiones*, con el porqué. Si una decisión cambia, no se borra: se marca como reemplazada.
- **Nunca** se escriben tokens, contraseñas ni datos de pacientes reales en esta carpeta. `06-guia-cuentas.md` dice *dónde* está cada secreto, no *cuál* es.
- `04-pendientes.md` se actualiza al final de cada sesión.

## Cómo arrancar una sesión con Claude

Pegar al inicio:

> Estoy trabajando en la app de HPC. Leé `docs/00-INSTRUCCIONES.md`, `docs/01-especificacion.md`,
> `docs/04-pendientes.md` y la última entrada de `docs/02-bitacora.md` antes de proponer nada.
> Al terminar, actualizá la bitácora y los pendientes.
