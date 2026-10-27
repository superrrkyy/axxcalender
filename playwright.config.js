import { defineConfig } from '@playwright/test';

const launchOptions = process.env.CHROMIUM_EXECUTABLE_PATH
  ? {
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    }
  : {};

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 8000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    timezoneId: 'Asia/Jakarta',
    viewport: { width: 1440, height: 1000 },
    launchOptions,
  },
  webServer: [
    {
      // Build first so preview never serves a missing or stale dist/.
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      // GitHub Pages build, served under the /axxcalender/ subpath so the
      // base-aware PWA paths are exercised exactly as in production.
      command: 'npm run build:pages && npm run preview:pages',
      url: 'http://localhost:4174/axxcalender/',
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
