// vite.config.js yang benar
import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/axxcalender/' : '/',
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
});