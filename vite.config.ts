import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    watch: {
      usePolling: true,
    },
    // Proxy para Sportmonks — resolve CORS em dev sem precisar de Edge Function
    proxy: {
      '/sportmonks-api': {
        target: 'https://api.sportmonks.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/sportmonks-api/, '/v3/football'),
        secure: true,
      },
      '/odds-api': {
        target: 'https://api.the-odds-api.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/odds-api/, '/v4'),
        secure: true,
      },
    },
  },
});
