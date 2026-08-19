import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { getDevPorts, resolveApiOrigin } from '@ember/config';

const { web } = getDevPorts();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: web,
    proxy: {
      '/api': {
        target: resolveApiOrigin(),
        changeOrigin: true,
      },
    },
  },
});
