import { test, expect } from '@playwright/test';

// The production site is a GitHub Pages *project* site served from the
// /axxcalender/ subpath. The second webServer in playwright.config.js
// builds with GITHUB_PAGES=true and serves it that way, so these tests
// guard the base-aware PWA paths against regression.
const BASE = 'http://localhost:4174/axxcalender/';

test('app works under the /axxcalender/ subpath with a correctly scoped service worker', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(BASE);
  await expect(page.locator('#loader')).toHaveClass('loaded');
  await expect(page.locator('.day')).toHaveCount(42);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.scope;
  });
  expect(scope).toBe('http://localhost:4174/axxcalender/');
  const cachedPaths = await page.evaluate(async () => {
    const keys = await caches.keys();
    const key = keys.find((k) => k.startsWith('axxcalender-'));
    if (!key) return [];
    const cache = await caches.open(key);
    return (await cache.keys()).map((r) => new URL(r.url).pathname);
  });
  expect(cachedPaths.length).toBeGreaterThan(10);
  expect(cachedPaths.every((p) => p.startsWith('/axxcalender/'))).toBe(true);
  expect(cachedPaths.some((p) => p.endsWith('.js'))).toBe(true);
  // Manifest resolves inside the subpath and declares a relative start.
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]').href;
    const response = await fetch(href);
    return { href, ok: response.ok, body: await response.json() };
  });
  expect(manifest.href).toBe('http://localhost:4174/axxcalender/manifest.webmanifest');
  expect(manifest.ok).toBe(true);
  expect(manifest.body.start_url.startsWith('/')).toBe(false);
  expect(errors).toEqual([]);
});
