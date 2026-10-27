import { defineConfig } from 'vite';

export default defineConfig({
  // Project pages live under /axxcalender/; root/custom domains use '/'.
  // Runtime URLs in src/main.js derive from import.meta.env.BASE_URL,
  // and the service worker resolves paths against its scope, so both
  // deployments work without further changes.
  base: process.env.GITHUB_PAGES ? '/axxcalender/' : '/',
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
});
