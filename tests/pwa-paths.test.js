import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression guards for the GitHub Pages subpath bug found in the
// 2026-10-27 audit: every runtime/PWA path must stay base-aware or
// scope-relative, never root-absolute, so the app works both at '/'
// and under '/axxcalender/'.

test('web manifest uses relative URLs so it resolves under any base path', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'),
  );
  for (const value of [manifest.id, manifest.start_url, manifest.scope]) {
    assert.equal(value.startsWith('/'), false, `manifest URL must be relative: ${value}`);
  }
  for (const icon of manifest.icons) {
    assert.equal(icon.src.startsWith('/'), false, `icon src must be relative: ${icon.src}`);
  }
});

test('service worker registration and notification assets derive from BASE_URL', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /serviceWorker\.register\(`\$\{BASE_URL\}sw\.js`\)/);
  assert.match(main, /icon: `\$\{BASE_URL\}icon-192\.png`/);
  assert.equal(main.includes("register('/"), false);
  assert.equal(main.includes("'/icon-192.png'"), false);
});

test('service worker resolves precache and fallbacks against its scope', () => {
  const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(sw, /registration\.scope/);
  assert.equal(sw.includes("caches.match('/')"), false);
  assert.equal(sw.includes("openWindow('/')"), false);
  assert.equal(sw.includes("'/assets/"), false);
  assert.equal(sw.includes("'/index.html'"), false);
});

test('precache generator emits relative paths and fails loudly on pattern drift', () => {
  const script = readFileSync(new URL('../scripts/precache.mjs', import.meta.url), 'utf8');
  assert.match(script, /'\.\/',/);
  assert.equal(script.includes("'/index.html',"), false);
  assert.equal(script.includes("'/assets/"), false);
  assert.match(script, /throw new Error/);
});
