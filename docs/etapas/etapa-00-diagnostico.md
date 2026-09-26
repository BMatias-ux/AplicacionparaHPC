# Etapa 0 · Diagnóstico del código existente

**Fecha:** 25/09/2026 · **Commit revisado:** `6f09ceb` "feat: initialize patient portal project" (19/08/2026)

## Qué hay

App React generada en **Google AI Studio** (`metadata.json`, carpeta `assets/.aistudio`, `.env.example` con `GEMINI_API_KEY`).
~2.500 líneas en `src/`:

| Archivo | Qué hace |
|---|---|
| `App.tsx` | Contenedor, navegación por pestañas, **marco de teléfono** y selector Móvil/Expandido |
| `OnboardingWizard.tsx` | Registro del paciente en 8 pasos (nombre, DNI, fecha de nacimiento, género, domicilio, teléfono, email) |
| `HomeScreen.tsx` | Saludo, botón "Pedir turno de admisión", novedades |
| `TurnosScreen.tsx` | Reserva y listado de turnos (688 líneas, la más grande) |
| `ActividadesScreen.tsx` | Registro de ánimo, respiración 4-7-8, cuestionario de bienestar |
| `MisDatosScreen.tsx` | Editar perfil, borrar cuenta |
| `MasScreen.tsx` | Configuración, contacto, sobre la Fundación, FAQ |
| `mockData.ts` | Profesionales, artículos y usuario **de ejemplo** |

## Hallazgos

1. **Por qué se ve mal en la computadora.** `App.tsx` dibuja un teléfono falso: bordes de 8 px, reloj "09:41",
   "5G 100%", notch, alto fijo de 860–890 px y ancho máximo de `max-w-md` (448 px). En pantallas chicas ese marco
   se oculta (`hidden sm:flex`), por eso en el celular se ve bien. **Se arregla quitando el marco**, no rehaciendo la app.
2. **No hay backend.** Todo (perfil con DNI, turnos, registros de ánimo) se guarda en `localStorage`: queda en el
   navegador de cada persona, nadie del equipo lo ve y se pierde al borrar datos. Los turnos no llegan a ningún lado.
3. **Datos de ejemplo con nombres que parecen reales de otra institución.** `mockData.ts` lista profesionales
   (psiquiatras y psicólogos con apellido) que **no** son del equipo HPC, con fotos de Unsplash y calificaciones inventadas,
   y en `ActividadesScreen.tsx` aparece la clase CSS `ineco-input-label`. Todo sugiere que la maqueta partió de una
   referencia de otro centro. **No publicar así**: reemplazar por el equipo real (Ficha Profesional) o por datos neutros.
4. **Número de WhatsApp distinto al del bot.** `MasScreen.tsx` enlaza a `wa.me/5491140607020`. El bot deriva al
   `+54 9 387 523-3693`. Hay que unificar en una constante.
5. **Colores fuera de identidad.** Usa bordó `#9C1342` y teal `#0D9488`; la identidad HPC definida es teal `#0e4f55`,
   crema `#f5f1e8`, dorado `#c98e3f` (Fraunces + DM Sans). Hoy la app usa Plus Jakarta Sans.
6. **Accesibilidad.** `index.html` tiene `maximum-scale=1.0, user-scalable=no` (impide hacer zoom) y el `body`
   tiene `select-none` (no se puede seleccionar texto). Ambos perjudican a personas con baja visión.
7. **Dependencias de AI Studio que sobran.** `@google/genai`, `express`, `dotenv` no se usan en el front; nombre del
   paquete `react-example`. Limpiar para que el build sea liviano y no quede una API key expuesta por error.
8. **Sin PWA.** No hay `manifest.json` ni service worker: no se puede "instalar".
9. Font Awesome se carga completo desde CDN además de `lucide-react`: duplicado.

## Hallazgos en el bot (`bot-hpc`)

- Bien resuelto: flujos clínico / comercial / directo, protocolo de riesgo, horario, estado en Redis, registro en hoja 'Demanda'.
- `lib/textos.js` escribe **`cajaureka.com.ar`**; el dominio real es **`cajaeureka.com.ar`**. Verificar y corregir.
- El estado `pausado` ya existe (protocolo de riesgo): es la base para la derivación a una persona.
- Pendiente documentado por el propio bot: canal monitoreado para alertas de riesgo (plantilla aprobada de Meta).

## Resultado de la etapa

Diagnóstico cerrado. Siguiente: Etapa 1 (limpieza + responsive + PWA + subdominio), ver `04-pendientes.md`.
