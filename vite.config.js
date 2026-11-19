import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
const proxy = { '/api': 'http://127.0.0.1:3001' };
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [tailwindcss()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy, headers: { 'Cache-Control': 'no-store' } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy, headers: { 'Cache-Control': 'no-store' } },
});
