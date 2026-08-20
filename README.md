# Habilidades para el Cambio — Portal del Paciente

Portal web para pacientes de la Fundación Habilidades para el Cambio: registro (onboarding), gestión de turnos, actividades terapéuticas y datos personales. Aplicación 100% client-side (React + Vite + Tailwind), sin backend ni variables de entorno requeridas; el estado del usuario se persiste en `localStorage`.

## Desarrollo local

```bash
npm install
npm run dev
```

Otros scripts:

```bash
npm run build    # build de producción a dist/
npm run preview  # sirve el build de producción localmente
npm run lint      # chequeo de tipos con tsc
```

## Despliegue en Vercel

El repo incluye `vercel.json` con el build command, el output directory (`dist`) y un rewrite para que las rutas del SPA no den 404 al refrescar.

1. Importá el repositorio en [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Vite** (se detecta automáticamente).
3. Build command: `npm run build` · Output directory: `dist` (ya definidos en `vercel.json`).
4. Deploy — no se requieren variables de entorno.

También podés desplegar desde la CLI:

```bash
npm i -g vercel
vercel
```
