import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Build standalone da aba "Outros" (navegadores remotos).
// Gera um SPA estático em dist-negociacoes/ para subir no Cloud Storage + CDN.
export default defineConfig({
  root: path.resolve(__dirname, 'src/negociacoes'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-negociacoes'),
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5174,
    host: true,
  },
});
