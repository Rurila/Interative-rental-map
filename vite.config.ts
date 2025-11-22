import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel 部署建议使用 '/' (根路径)，而不是 GitHub Pages 的 './'
  base: '/', 
  build: {
    outDir: 'dist',
  }
});