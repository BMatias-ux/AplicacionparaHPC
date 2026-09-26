# Etapa 1 · Portal informativo + WhatsApp

**Fecha:** 25/09/2026 · **Rama:** `etapa-1-portal-informativo`

## Objetivo

Versión 1 publicable en `portal.habilidadesparaelcambio.com.ar`: información de la Fundación y contacto por WhatsApp
con el bot. Sin registro, sin turnos, sin datos de pacientes (decisión de Matías, 25/09).

## Qué se hizo

| Cambio | Archivos | Por qué |
|---|---|---|
| Se quitó el marco de teléfono y el selector Móvil/Expandido | `src/App.tsx` | Era un simulador de AI Studio; la app ahora ocupa la pantalla real |
| Layout responsive: barra lateral en computadora, barra inferior en celular | `src/components/Navegacion.tsx` | Un solo menú (`src/navegacion.ts`) con dos presentaciones |
| Navegación por hash (`#servicios`, `#contacto`…) | `src/navegacion.ts`, `src/App.tsx` | El botón "atrás" funciona y se pueden compartir enlaces a una sección sin configurar rutas en Vercel |
| Se eliminaron onboarding, turnos, mis datos, actividades con registro, datos de ejemplo | `src/components/*` viejos, `mockData.ts`, `types.ts` | Guardaban DNI y datos de salud en el navegador sin que llegaran al equipo, y los profesionales de ejemplo no eran de HPC. Quedan en el historial de Git (commit `6f09ceb`) si hace falta recuperar diseño |
| Contenido real tomado del bot | `src/content.ts` | Misma información que da el bot y el equipo. **Sin precios** (D-06) |
| WhatsApp único con mensaje prellenado por motivo | `src/config.ts`, `src/lib/whatsapp.ts`, `src/components/BotonWhatsApp.tsx` | Número `+54 9 387 523-3693` en una sola constante; cada mensaje termina con "(Escribo desde el portal web)" para que el equipo sepa el origen |
| Identidad HPC | `src/index.css` (`@theme`), `index.html` | Teal `#0e4f55`, crema `#f5f1e8`, dorado `#c98e3f`, Fraunces + DM Sans |
| PWA instalable | `public/manifest.webmanifest`, `public/sw.js`, `public/icons/`, `src/main.tsx` | Service worker "primero la red": nunca muestra una versión vieja si hay conexión |
| Accesibilidad | `index.html`, `src/index.css` | Se habilitó el zoom y la selección de texto, foco visible, respeta "reducir movimiento" |
| Limpieza | `package.json`, `vite.config.ts`, `tsconfig.json` | Fuera `@google/genai`, `express`, `dotenv`, `motion`, `canvas-confetti`, Font Awesome. `bun.lock` → `package-lock.json` (npm). `tsconfig` en modo estricto. Bundle: ~78 KB gzip |
| Aviso de urgencias en Contacto | `src/screens/Contacto.tsx` | 911 / guardia + líneas 135 y (011) 5275-1135. **Pendiente de aprobación clínica**, igual que en el bot |

## Secciones de la app

Inicio · Tratamientos (terapia individual, programa DBT, talleres DBT, dónde atendemos) · Profesionales (formaciones,
cursos, membresía, sumate al equipo, anticipo del acceso para profesionales) · Recursos (respiración 4-7-8 sin guardar
datos, enlaces a talleres gratuitos, Caja Eureka, cursos, Fundación) · Contacto.

## Verificación

- `npm run build` sin errores de TypeScript.
- Capturas en 390 px (celular) y 1440 px (computadora) de las 5 secciones; sin errores en consola.
- Todos los botones de WhatsApp apuntan a `wa.me/5493875233693`.

## Pendiente para cerrar la etapa

- Revisar la vista previa de Vercel y aprobar el merge a `main`.
- Registro CNAME `portal` en Hostinger (`05-guia-despliegue.md`).
- Logo oficial (hoy hay una "H" provisoria en `src/components/Marca.tsx` y `public/icons/`).
