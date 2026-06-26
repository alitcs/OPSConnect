import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, proxy /api to the backend so the frontend and backend can run on
// separate ports without CORS issues.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
