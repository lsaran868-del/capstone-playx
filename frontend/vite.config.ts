import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || env.BACKEND_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true
        },
        '/audio': {
          target: backendTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true
        }
      }
    }
  };
});