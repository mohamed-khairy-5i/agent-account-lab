import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api/llm': {
        target: 'https://api.apinex.bond/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/llm/, '')
      }
    }
  },
  preview: {
    port: 4173,
    host: '127.0.0.1',
    proxy: {
      '/api/llm': {
        target: 'https://api.apinex.bond/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/llm/, '')
      }
    }
  }
});
