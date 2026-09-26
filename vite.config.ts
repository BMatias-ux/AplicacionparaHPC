import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Configuración de Vite.
// - react(): compila JSX/TSX.
// - tailwindcss(): procesa las clases de Tailwind v4 (los colores HPC están en src/index.css, bloque @theme).
// Los archivos de /public (manifest, íconos, sw.js) se copian tal cual a la raíz del build.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
