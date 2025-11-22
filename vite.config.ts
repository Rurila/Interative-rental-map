import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel 部署建议使用 '/' (根路径)
  base: '/', 
  build: {
    outDir: 'dist',
  },
  define: {
    // 安全地注入 API_KEY，避免覆盖整个 process.env 导致 React 崩溃
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});