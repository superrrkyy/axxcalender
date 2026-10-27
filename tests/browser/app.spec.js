import { test, expect } from '@playwright/test';

async function openApp(page) {
  await page.goto('/');
  await expect(page.locator('#loader')).toHaveClass('loaded');
}

test('calendar, real-time clock, and month navigation work without runtime errors', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
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

test('arrow keys move the selected day and the grid uses a single roving tab stop', async ({
  page,
}) => {
  await openApp(page);
  const selected = page.locator('.day[aria-pressed="true"]');
  await expect(selected).toHaveAttribute('tabindex', '0');
  await expect(page.locator('.day[tabindex="0"]')).toHaveCount(1);
  const before = await selected.getAttribute('data-date');
  const expectedDate = (() => {
    const date = new Date(`${before}T12:00:00`);
    date.setDate(date.getDate() + 1);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  })();
  await selected.focus();
  await page.keyboard.press('ArrowRight');
  const focused = page.locator(':focus');
  await expect(focused).toHaveAttribute('data-date', expectedDate);
  await expect(focused).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.day[tabindex="0"]')).toHaveCount(1);
});

test('month navigation stops at the 1900 and 2100 bounds', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Pilih bulan dan tahun' }).click();
  await page.locator('#month-input').fill('1900-01');
  await page.getByRole('button', { name: 'Buka kalender' }).click();
  await expect(page.locator('#previous-month')).toBeDisabled();
  await page.getByRole('button', { name: 'Pilih bulan dan tahun' }).click();
  await page.locator('#month-input').fill('2100-12');
  await page.getByRole('button', { name: 'Buka kalender' }).click();
  await expect(page.locator('#next-month')).toBeDisabled();
});

test('themes and appearance persist, and settings support keyboard dismissal', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Terapkan tema Ocean Breeze' }).click();
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  await expect(page.locator('#settings-open')).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Gelap', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-panel')).toBeHidden();
  await expect(page.locator('#settings-open')).toHaveAttribute('aria-expanded', 'false');
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'ocean');
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'dark');
});

test.describe('system appearance', () => {
  test.use({ colorScheme: 'dark' });
  test('system mode follows prefers-color-scheme', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Buka pengaturan' }).click();
    await page.getByRole('button', { name: 'Sistem', exact: true }).click();
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'dark');
  });
});

test('timezone selection and 12-hour format update the live clock and persist', async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  await page.locator('#timezone-select').selectOption('Asia/Jayapura');
  await expect(page.locator('#clock-zone')).toHaveText('WIT · Jayapura');
  await page.keyboard.press('Escape');
  await page.locator('#clock-format-button').click();
  await expect(page.locator('#clock-format-button')).toHaveText(/AM|PM/);
  await page.reload();
  await expect(page.locator('#clock-zone')).toHaveText('WIT · Jayapura');
  await expect(page.locator('#clock-format-button')).toHaveText(/AM|PM/);
});

test('agenda is saved locally, user content is escaped, export and deletion work', async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Tambah agenda' }).click();
  await page.locator('#agenda-title').fill('Waktu untuk diri sendiri');
  await page.locator('#agenda-note').fill('<script>window.injected = true</script>');
  await page.getByRole('button', { name: 'Simpan agenda' }).click();
  await expect(page.locator('#selected-content')).toContainText('Waktu untuk diri sendiri');
  await page.reload();
  await expect(page.locator('#selected-content')).toContainText(
    '<script>window.injected = true</script>',
  );
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor agenda (.ics)' }).click();
  expect((await download).suggestedFilename()).toBe('axxcalender-agenda.ics');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Hapus agenda Waktu untuk diri sendiri' }).click();
  await expect(page.locator('#selected-content')).not.toContainText('Waktu untuk diri sendiri');
});

test('complete holidays cover 2026 and 2027; other years are explicitly partial', async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Pilih bulan dan tahun' }).click();
  await page.locator('#month-input').fill('2026-03');
  await page.getByRole('button', { name: 'Buka kalender' }).click();
  await expect(page.locator('.holiday:not(.outside)')).toHaveCount(3);
  await page.getByRole('button', { name: 'Lihat hari libur' }).click();
  await expect(page.locator('.holiday-item')).toHaveCount(17);
  await page.getByRole('button', { name: 'Tahun berikutnya' }).click();
  await expect(page.locator('.holiday-item')).toHaveCount(18);
  await expect(page.locator('#holiday-source')).toContainText('SKB 3 Menteri');
  await page.getByRole('button', { name: 'Tahun berikutnya' }).click();
  await expect(page.locator('.holiday-item')).toHaveCount(5);
  await expect(page.locator('#holiday-source')).toContainText('Bukan daftar lengkap');
});

test('notification tester sends a real service-worker notification when permitted', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['notifications']);
  // Spy only: the underlying showNotification MUST run and resolve;
  // errors propagate so the app shows its failure toast and this test fails.
  await page.addInitScript(() => {
    window.__shownNotifications = [];
    // Headless Chromium keeps REPORTING "denied" through this getter even
    // after the CDP grant + a successful real requestPermission() call
    // (verified below), which would leave the app's button disabled for a
    // browser-quirk reason. The override only corrects the reported
    // state to match the genuinely granted permission.
    try {
      Object.defineProperty(Notification, 'permission', {
        get: () => 'granted',
        configurable: true,
      });
    } catch {
      // Healthy browsers report the grant correctly without help.
    }
    const proto = ServiceWorkerRegistration.prototype;
    const original = proto.showNotification;
    proto.showNotification = async function (title, options) {
      const result = await original.call(this, title, options);
      window.__shownNotifications.push({ title, icon: options?.icon });
      return result;
    };
  });
  await openApp(page);
  // Headless Chromium reports Notification.permission as "denied" until
  // it is actually requested, even after a CDP permission grant — and the
  // app (correctly) disables its button while denied. Ask once through
  // the real API; the CDP grant makes it resolve immediately, and the
  // notification itself still goes through the unstubbed
  // ServiceWorkerRegistration.showNotification below.
  const permission = await page.evaluate(() => Notification.requestPermission());
  expect(permission).toBe('granted');
  // Some headless builds expose the API but have no notification backend
  // behind it, so every real showNotification() rejects. Probe once and
  // skip loudly there instead of faking a pass; anywhere a backend
  // exists, the full assertions below must hold.
  const probe = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.showNotification('axxcalender probe', { tag: 'axx-probe' });
      const list = await registration.getNotifications({ tag: 'axx-probe' });
      list.forEach((item) => item.close());
      window.__shownNotifications.length = 0;
      return 'ok';
    } catch (error) {
      return `rejected: ${error.message}`;
    }
  });
  test.skip(probe !== 'ok', `Browser uji tidak punya backend notifikasi (${probe})`);
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  await page.getByRole('button', { name: 'Kirim notifikasi tes' }).click();
  await expect(page.locator('#toast')).toContainText('Notifikasi dikirim ke sistem perangkat');
  const shown = await page.evaluate(() => window.__shownNotifications);
  expect(shown).toEqual([{ title: 'Hari baik dimulai di sini. 🌿', icon: '/icon-192.png' }]);
  const listed = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const list = await registration.getNotifications();
    const titles = list.map((item) => item.title);
    list.forEach((item) => item.close());
    return titles;
  });
  expect(listed).toContain('Hari baik dimulai di sini. 🌿');
});

test('denied notifications provide instructions instead of fake success', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(Notification, 'permission', { get: () => 'denied' }),
  );
  await openApp(page);
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  await expect(page.locator('#test-notification')).toBeDisabled();
  await expect(page.locator('#notification-status')).toContainText('Diblokir');
});

for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test(`responsive layout fits ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openApp(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Buka pengaturan' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('#settings-panel')).toBeVisible();
  });
}

test('built PWA remains available offline after the first successful visit', async ({
  page,
  context,
}) => {
  await openApp(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const keys = await caches.keys();
        const key = keys.find((k) => k.startsWith('axxcalender-'));
        if (!key) return 0;
        const cache = await caches.open(key);
        return (await cache.keys()).length;
      }),
    )
    .toBeGreaterThan(10);
  // Real offline navigation, served entirely by the service worker cache.
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle(/axxcalender/);
  await expect(page.locator('.day')).toHaveCount(42);
  await context.setOffline(false);
});
