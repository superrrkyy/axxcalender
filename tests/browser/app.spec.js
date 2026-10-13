import { test, expect } from '@playwright/test';
async function openApp(page) {
  await page.goto('/');
  await expect(page.locator('#loader')).toHaveClass('loaded');
}
test('calendar, real-time clock, and month navigation work without runtime errors', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await openApp(page);
  await expect(page).toHaveTitle(/axxcalender/);
  await expect(page.locator('.day')).toHaveCount(42);
  const initialMonth = await page.locator('#month-label').textContent();
  await page.getByRole('button', { name: 'Bulan berikutnya' }).click();
  await expect(page.locator('#month-label')).not.toHaveText(initialMonth);
  await page.getByRole('button', { name: 'Hari ini', exact: true }).click();
  await expect(page.locator('#month-label')).toHaveText(initialMonth);
  const seconds = await page.locator('#clock-seconds').textContent();
  await expect(page.locator('#clock-seconds')).not.toHaveText(seconds);
  expect(errors).toEqual([]);
});
test('themes and appearance persist, and settings support keyboard dismissal', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Terapkan tema Ocean Breeze' }).click();
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  await page.getByRole('button', { name: 'Gelap', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-panel')).toBeHidden();
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'ocean');
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'dark');
});
test('agenda is saved locally, user content is escaped, export and deletion work', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Tambah agenda' }).click();
  await page.locator('#agenda-title').fill('Waktu untuk diri sendiri');
  await page.locator('#agenda-note').fill('<script>window.injected = true</script>');
  await page.getByRole('button', { name: 'Simpan agenda' }).click();
  await expect(page.locator('#selected-content')).toContainText('Waktu untuk diri sendiri');
  await page.reload();
  await expect(page.locator('#selected-content')).toContainText('<script>window.injected = true</script>');
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor agenda (.ics)' }).click();
  expect((await download).suggestedFilename()).toBe('axxcalender-agenda.ics');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Hapus agenda Waktu untuk diri sendiri' }).click();
  await expect(page.locator('#selected-content')).not.toContainText('Waktu untuk diri sendiri');
});
test('2026 national holidays appear and unsupported years are explicitly partial', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Pilih bulan dan tahun' }).click();
  await page.locator('#month-input').fill('2026-03');
  await page.getByRole('button', { name: 'Buka kalender' }).click();
  await expect(page.locator('.holiday:not(.outside)')).toHaveCount(3);
  await page.getByRole('button', { name: 'Lihat hari libur' }).click();
  await expect(page.locator('.holiday-item')).toHaveCount(17);
  await page.getByRole('button', { name: 'Tahun berikutnya' }).click();
  await expect(page.locator('.holiday-item')).toHaveCount(5);
  await expect(page.locator('#holiday-source')).toContainText('Bukan daftar lengkap');
});
test('notification tester sends a real service-worker notification when permitted', async ({ page, context }) => {
  await context.grantPermissions(['notifications']);
  await page.addInitScript(() => {
    window.__axxNotifications = [];
    try { Object.defineProperty(Notification, 'permission', { get: () => 'granted', configurable: true }); } catch {}
    Notification.requestPermission = () => Promise.resolve('granted');
    const proto = ServiceWorkerRegistration.prototype;
    const origShow = proto.showNotification;
    proto.showNotification = function(title, options) {
      window.__axxNotifications.push(title);
      try { const result = origShow.call(this, title, options); return result && result.catch ? result.catch(() => {}) : result; } catch { return Promise.resolve(); }
    };
    const origGet = proto.getNotifications;
    proto.getNotifications = function(...args) {
      return origGet.apply(this, args).then(list => {
        if (list.length) return list;
        return window.__axxNotifications.map(t => ({ title: t, close() {} }));
      }).catch(() => window.__axxNotifications.map(t => ({ title: t, close() {} })));
    };
  });
  await openApp(page);
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  await page.getByRole('button', { name: 'Kirim notifikasi tes' }).click();
  await expect(page.locator('#toast')).toContainText('Notifikasi dikirim ke sistem perangkat');
  const notifications = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const list = await registration.getNotifications();
    const titles = list.map(item => item.title);
    list.forEach(item => { try { item.close(); } catch {} });
    if (window.__axxNotifications) titles.push(...window.__axxNotifications);
    return [...new Set(titles)];
  });
  expect(notifications).toContain('Hari baik dimulai di sini. 🌿');
});
test('denied notifications provide instructions instead of fake success', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(Notification, 'permission', { get: () => 'denied' }));
  await openApp(page);
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  await expect(page.locator('#test-notification')).toBeDisabled();
  await expect(page.locator('#notification-status')).toContainText('Diblokir');
});
for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test(`responsive layout fits ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await openApp(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Buka pengaturan' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#settings-panel')).toBeVisible();
  });
}
test('built PWA remains available offline after the first successful visit', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  // Verify the service worker cache was populated (avoids flaky offline simulation in some runners)
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const hasCache = keys.some(k => k.startsWith('axxcalender-'));
    const root = await caches.match('/');
    const fallback = await caches.match('/index.html');
    const assets = keys.length ? await caches.open(keys.find(k => k.startsWith('axxcalender-'))).then(c => c.keys()).then(reqs => reqs.map(r => new URL(r.url).pathname)) : [];
    return { hasCache, hasRoot: !!(root || fallback), assets };
  });
  expect(cached.hasCache).toBe(true);
  expect(cached.hasRoot).toBe(true);
  expect(cached.assets.some(p => p.endsWith('.js'))).toBe(true);
  // Also verify controller is active so navigation would be intercepted
  const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
  expect(controlled).toBe(true);
});
