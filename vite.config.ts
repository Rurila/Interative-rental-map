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
    // 解决 "Uncaught ReferenceError: process is not defined" 报错
    // 同时将 Vercel 环境变量注入到前端代码中
    'process.env': {
      API_KEY: process.env.API_KEY
    }
  }
});