import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local dev: `vite` serves the frontend on :5173 and proxies /api to
// `vercel dev` on :3000 so the serverless functions run locally too.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist' },
});
