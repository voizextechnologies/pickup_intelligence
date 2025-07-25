import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/signzy': {
        target: 'https://api.signzy.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/signzy/, ''),
        secure: true,
        headers: {
          'Origin': 'https://api.signzy.app'
        }
      },
      '/api/leakosint': {
        target: 'https://leakosintapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/leakosint/, ''),
        secure: true,
      },
      '/api/planapi': {
        target: 'https://planapi.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/planapi/, ''),
        secure: true,
      },
    },
  },
});