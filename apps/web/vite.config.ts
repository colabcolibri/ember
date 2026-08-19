import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { getDevPorts, resolveApiOrigin } from '@ember/config';

const { web } = getDevPorts();
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
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
  test: {
    environment: 'jsdom',
  },
});
