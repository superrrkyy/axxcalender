import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-serif-display/400-italic.css';
import './style.css';
import { createIcons, CalendarDays, Palette, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight, Globe2, Sun, Plus, Sparkles, Sprout, X, SunMoon, Moon, Monitor, Clock3, BellRing, Bell, Download, Smartphone, Check, ArrowRight, CheckCircle2, Coffee, Trash2 } from 'lucide';
import { dateKey, parseDate, monthDays, holidaysForYear, yearProgress, makeICS } from './calendar.js';

const $ = selector => document.querySelector(selector);
const icons = { CalendarDays, Palette, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight, Globe2, Sun, Plus, Sparkles, Sprout, X, SunMoon, Moon, Monitor, Clock3, BellRing, Bell, Download, Smartphone, Check, ArrowRight, CheckCircle2, Coffee, Trash2 };
const refreshIcons = () => createIcons({ icons });
const icon = name => `<i data-lucide="${name}"></i>`;
const escapeHTML = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const storage = {
  read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
};
const themeDefinitions = [
  { id: 'sage', name: 'Sage Studio', description: 'Tenang, natural, seimbang.', color: '#78936a' },
  { id: 'sand', name: 'Golden Hour', description: 'Hangat seperti sore hari.', color: '#c6aa7d' },
  { id: 'lavender', name: 'Lavender Haze', description: 'Lembut, sedikit dreamy.', color: '#a695bc' },
  { id: 'ocean', name: 'Ocean Breeze', description: 'Segar, seluas samudra.', color: '#82a6b6' },
];
const savedSettings = storage.read('axx-settings', {});
const settings = {
  theme: themeDefinitions.some(t => t.id === savedSettings.theme) ? savedSettings.theme : 'sage',
  mode: ['light', 'dark', 'system'].includes(savedSettings.mode) ? savedSettings.mode : 'light',
  format24: savedSettings.format24 !== false,
  timezone: ['local', 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'].includes(savedSettings.timezone) ? savedSettings.timezone : 'local',
};
const savedEvents = storage.read('axx-agenda', []);
let events = Array.isArray(savedEvents) ? savedEvents.filter(event => event && typeof event.id === 'string' && typeof event.title === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.date) && (!event.time || /^\d{2}:\d{2}$/.test(event.time))) : [];
let now = new Date();
let activeMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12);
let selectedDate = dateKey(now);
let holidayYear = activeMonth.getFullYear();
let toastTimer;
let pendingInstall = null;
let previousFocus;
let currentDay = dateKey(now);
let serviceWorkerPromise;
const systemMode = matchMedia('(prefers-color-scheme: dark)');

function saveSettings() { storage.write('axx-settings', settings); }
function applySettings() {
  document.body.dataset.theme = settings.theme;
  document.body.dataset.mode = settings.mode === 'system' ? (systemMode.matches ? 'dark' : 'light') : settings.mode;
  $('meta[name="theme-color"]').content = document.body.dataset.mode === 'dark' ? '#141b18' : '#f8f9f5';
  document.querySelectorAll('[data-mode]').forEach(button => {
    const active = button.dataset.mode === settings.mode;
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', active);
  });
  $('#format-24').checked = settings.format24;
  $('#timezone-select').value = settings.timezone;
  $('#clock-format-button').textContent = settings.format24 ? '24 JAM' : '12 JAM';
  renderThemes(); updateClock();
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast span').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4200);
}
function fullDate(date, options = {}) { return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', ...options }); }
function renderCalendar() {
  const year = activeMonth.getFullYear(), month = activeMonth.getMonth();
  $('#month-label').textContent = activeMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  $('#calendar-grid').setAttribute('aria-label', `Tanggal ${$('#month-label').textContent}`);
  $('#month-caption').textContent = year === 2026 ? 'Ruang untuk rencana yang berarti.' : 'Libur tetap saja · daftar lengkap tersedia untuk 2026.';
  const holidays = holidaysForYear(year);
  const days = monthDays(year, month);
  $('#calendar-grid').innerHTML = days.map(date => {
    const key = dateKey(date);
    const isOutside = date.getMonth() !== month;
    const holiday = holidaysForYear(date.getFullYear())[key];
    const dayEvents = events.filter(event => event.date === key);
    const classes = ['day', isOutside && 'outside', date.getDay() === 0 && 'sunday', holiday && 'holiday', key === currentDay && 'today', key === selectedDate && 'selected'].filter(Boolean).join(' ');
    return `<button class="${classes}" data-date="${key}" aria-pressed="${key === selectedDate}" ${key === currentDay ? 'aria-current="date"' : ''} aria-label="${escapeHTML(fullDate(date))}${holiday ? `, ${escapeHTML(holiday)}` : ''}${dayEvents.length ? `, ${dayEvents.length} agenda` : ''}"><span class="day-number">${date.getDate()}</span><span class="day-indicators">${holiday ? '<i class="holiday-dot"></i>' : ''}${dayEvents.length ? '<i></i>' : ''}</span>${holiday && !isOutside ? `<span class="holiday-name">${escapeHTML(holiday.replace('Kelahiran Yesus Kristus (Natal)', 'Hari Natal').replace('Tahun Baru 2026 Masehi', 'Tahun Baru'))}</span>` : ''}</button>`;
  }).join('');
  $('#previous-month').disabled = year <= 1900 && month === 0;
  $('#next-month').disabled = year >= 2100 && month === 11;
  renderSelected();
}
function selectDate(key) {
  selectedDate = key;
  const date = parseDate(key);
  if (date.getMonth() !== activeMonth.getMonth() || date.getFullYear() !== activeMonth.getFullYear()) activeMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  renderCalendar();
}
function renderSelected() {
  const date = parseDate(selectedDate);
  $('#selected-date-short').textContent = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const holiday = holidaysForYear(date.getFullYear())[selectedDate];
  const dayEvents = events.filter(event => event.date === selectedDate).sort((a,b) => (a.time || '').localeCompare(b.time || ''));
  let html = holiday ? `<div class="agenda-entry is-holiday"><i></i><div><h3>${escapeHTML(holiday)}</h3><p>Libur nasional · waktunya rehat</p></div></div>` : '';
  html += dayEvents.map(event => `<div class="agenda-entry"><i></i><div><h3>${escapeHTML(event.title)}</h3><p>${event.time ? escapeHTML(event.time) : 'Sepanjang hari'}${event.note ? ` · ${escapeHTML(event.note)}` : ''}</p></div><button class="agenda-delete" data-delete="${escapeHTML(event.id)}" aria-label="Hapus agenda ${escapeHTML(event.title)}">${icon('trash-2')}</button></div>`).join('');
  if (!html) html = `<div class="empty-agenda"><span class="empty-icon">${icon('coffee')}</span><div><h3>Ruang untuk hal baru.</h3><p>Belum ada agenda. Mungkin ini<br>waktunya sedikit jeda?</p></div></div>`;
  $('#selected-content').innerHTML = html;
  refreshIcons();
}
function navigateMonth(delta) {
  const next = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + delta, 1, 12);
  if (next.getFullYear() < 1900 || next.getFullYear() > 2100) return;
  activeMonth = next;
  selectedDate = dateKey(activeMonth);
  renderCalendar();
}
function updateClock() {
  now = new Date();
  const options = settings.timezone === 'local' ? {} : { timeZone: settings.timezone };
  const parts = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: settings.format24 ? 'h23' : 'h12', ...options }).formatToParts(now);
  const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
  $('#clock-hours').textContent = values.hour;
  $('#clock-minutes').textContent = values.minute;
  $('#clock-seconds').textContent = values.second;
  $('#clock').setAttribute('aria-label', `Pukul ${values.hour}:${values.minute}:${values.second}${values.dayPeriod ? ' ' + values.dayPeriod : ''}`);
  $('#clock-format-button').textContent = settings.format24 ? '24 JAM' : values.dayPeriod?.toUpperCase() || '12 JAM';
  $('#clock-date').textContent = fullDate(now, options);
  const tz = settings.timezone === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : settings.timezone;
  const labels = { 'Asia/Jakarta': 'WIB · Jakarta', 'Asia/Makassar': 'WITA · Makassar', 'Asia/Jayapura': 'WIT · Jayapura' };
  $('#clock-zone').textContent = labels[tz] || tz.split('/').at(-1).replaceAll('_', ' ');
  if (dateKey(now) !== currentDay) { currentDay = dateKey(now); renderCalendar(); updateToday(); }
}
function updateToday() {
  $('#hero-date').textContent = fullDate(now);
  $('#copyright-year').textContent = now.getFullYear();
  const progress = yearProgress(now);
  $('#year-progress-title').textContent = `Perjalanan ${now.getFullYear()}`;
  $('#year-percent').textContent = `${progress.percent}%`;
  $('#year-progress').style.width = `${progress.percent}%`;
  $('#year-remaining').textContent = `${progress.remaining} hari lagi. Masih banyak cerita yang bisa dibuat.`;
}
function renderThemes() {
  $('#theme-grid').innerHTML = themeDefinitions.map(theme => {
    const active = theme.id === settings.theme;
    const miniDays = ['S','S','R','K','J','S','M'].map(day => `<b>${day}</b>`).join('') + Array.from({ length: 28 }, (_,i) => `<span${i === 12 ? ' class="highlight"' : ''}>${i+1}</span>`).join('');
    return `<button class="theme-card ${active ? 'active' : ''}" data-theme="${theme.id}" aria-pressed="${active}" aria-label="Terapkan tema ${theme.name}"><div class="theme-preview preview-${theme.id}" aria-hidden="true"><div class="mini-calendar"><div class="mini-title">Oktober 2026</div><div class="mini-days">${miniDays}</div></div></div><div class="theme-info"><div><h3>${theme.name}</h3><p>${theme.description}</p></div>${active ? `<span class="theme-check">${icon('check')}</span>` : `<span class="theme-swatch" style="background:${theme.color}"></span>`}</div></button>`;
  }).join('');
  refreshIcons();
}
function openAgenda() {
  $('#agenda-form').reset();
  $('#agenda-date').value = selectedDate;
  $('#agenda-date').min = '1900-01-01'; $('#agenda-date').max = '2100-12-31';
  $('#agenda-dialog').showModal();
  $('#agenda-title').focus();
}
function openSettings() {
  previousFocus = document.activeElement;
  $('#settings-overlay').hidden = false; $('#settings-panel').hidden = false;
  $('.app-shell').inert = true;
  document.body.style.overflow = 'hidden';
  updateNotificationStatus();
  $('#settings-close').focus();
}
function closeSettings() {
  $('#settings-overlay').hidden = true; $('#settings-panel').hidden = true;
  $('.app-shell').inert = false;
  document.body.style.overflow = '';
  previousFocus?.focus();
}
function renderHolidays() {
  $('#holiday-year').textContent = holidayYear;
  $('#holiday-previous').disabled = holidayYear <= 1900;
  $('#holiday-next').disabled = holidayYear >= 2100;
  $('#holiday-list').innerHTML = Object.entries(holidaysForYear(holidayYear)).map(([key, title]) => {
    const date = parseDate(key);
    return `<div class="holiday-item"><span>${date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span><div><h3>${escapeHTML(title)}</h3><p>${date.toLocaleDateString('id-ID', { weekday: 'long' })}</p></div></div>`;
  }).join('');
  $('#holiday-source').innerHTML = holidayYear === 2026 ? '17 hari libur nasional 2026, sesuai SKB 3 Menteri. Tidak termasuk cuti bersama. Jadwal dapat berubah mengikuti ketetapan pemerintah. Informasi resmi: <a href="https://www.kemenkopmk.go.id/" target="_blank" rel="noopener noreferrer">Kemenko PMK ↗</a>.' : 'Daftar lengkap hari libur tersedia untuk 2026. Tahun ini hanya menampilkan 5 hari libur dengan tanggal tetap; hari besar keagamaan yang berpindah tanggal belum dimasukkan. Bukan daftar lengkap.';
}
function notificationSupport() { return 'Notification' in window && 'serviceWorker' in navigator && window.isSecureContext; }
function updateNotificationStatus() {
  if (!notificationSupport()) {
    $('#notification-status').textContent = 'Browser ini belum mendukung. Coba Chrome/Edge atau aplikasi Layar Utama di iOS.';
    $('#test-notification').disabled = true; return;
  }
  const statuses = { default: 'Izin belum diberikan', granted: 'Izin diberikan · siap untuk tes', denied: 'Diblokir · ubah izin melalui pengaturan browser' };
  $('#notification-status').textContent = statuses[Notification.permission];
  $('#test-notification').disabled = Notification.permission === 'denied';
  $('#test-notification').innerHTML = icon('bell') + (Notification.permission === 'granted' ? 'Kirim notifikasi tes' : 'Izinkan & tes notifikasi');
  refreshIcons();
}
async function testNotification() {
  if (!notificationSupport()) { toast('Notifikasi tidak didukung di browser ini.'); return; }
  const button = $('#test-notification'); button.disabled = true;
  try {
    // Permission must be requested directly within the user gesture, especially on iOS.
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission !== 'granted') { toast('Izin notifikasi belum diberikan. Periksa izin browser.'); return; }
    const registration = await Promise.race([
      serviceWorkerPromise.then(() => navigator.serviceWorker.ready),
      new Promise((_, reject) => setTimeout(() => reject(new Error('service worker timeout')), 8000)),
    ]);
    await registration.showNotification('Hari baik dimulai di sini. 🌿', { body: 'Halo dari axxcalender! Notifikasi perangkatmu sudah aktif. Ini adalah notifikasi tes.', icon: '/icon-192.png', badge: '/icon-192.png', tag: `axx-test-${Date.now()}`, data: { url: '/' } });
    toast('Notifikasi dikirim ke sistem perangkat. Periksa pusat notifikasi.');
  } catch (error) {
    console.warn('Notification test failed:', error);
    toast('Notifikasi gagal dikirim. Periksa dukungan browser dan izin perangkat.');
  } finally { updateNotificationStatus(); }
}

$('#previous-month').addEventListener('click', () => navigateMonth(-1));
$('#next-month').addEventListener('click', () => navigateMonth(1));
$('#today-button').addEventListener('click', () => selectDate(dateKey(new Date())));
$('#calendar-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-date]'); if (button) selectDate(button.dataset.date);
});
$('#calendar-grid').addEventListener('keydown', event => {
  const button = event.target.closest('[data-date]');
  if (!button || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const date = parseDate(button.dataset.date);
  date.setDate(date.getDate() + ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]));
  if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return;
  selectDate(dateKey(date));
  $(`[data-date="${dateKey(date)}"]`)?.focus();
});
let swipeStart;
$('#calendar-grid').addEventListener('touchstart', event => { swipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }, { passive: true });
$('#calendar-grid').addEventListener('touchend', event => {
  if (!swipeStart) return;
  const dx = event.changedTouches[0].clientX - swipeStart.x, dy = event.changedTouches[0].clientY - swipeStart.y;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) navigateMonth(dx < 0 ? 1 : -1);
  swipeStart = null;
}, { passive: true });
$('#month-picker-open').addEventListener('click', () => { $('#month-input').value = dateKey(activeMonth).slice(0,7); $('#month-dialog').showModal(); });
$('#month-form').addEventListener('submit', event => {
  event.preventDefault();
  const [year, month] = $('#month-input').value.split('-').map(Number);
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return;
  activeMonth = new Date(year, month - 1, 1, 12); selectedDate = dateKey(activeMonth);
  renderCalendar(); $('#month-dialog').close();
});
$('#theme-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-theme]'); if (!button) return;
  settings.theme = button.dataset.theme; saveSettings(); applySettings();
  toast(`Tema ${themeDefinitions.find(theme => theme.id === settings.theme).name} diterapkan.`);
});
$('#settings-open').addEventListener('click', openSettings);
$('#settings-close').addEventListener('click', closeSettings);
$('#settings-overlay').addEventListener('click', closeSettings);
$('#settings-panel').addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeSettings(); }
  if (event.key !== 'Tab') return;
  const focusable = [...$('#settings-panel').querySelectorAll('button:not(:disabled), select, input, a[href]')];
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { settings.mode = button.dataset.mode; saveSettings(); applySettings(); }));
systemMode.addEventListener('change', () => { if (settings.mode === 'system') applySettings(); });
$('#format-24').addEventListener('change', event => { settings.format24 = event.target.checked; saveSettings(); applySettings(); });
$('#clock-format-button').addEventListener('click', () => { settings.format24 = !settings.format24; saveSettings(); applySettings(); });
$('#timezone-select').addEventListener('change', event => { settings.timezone = event.target.value; saveSettings(); updateClock(); });
$('#test-notification').addEventListener('click', testNotification);
$('#add-agenda').addEventListener('click', openAgenda);
$('#cta-agenda').addEventListener('click', () => { selectDate(dateKey(new Date())); openAgenda(); });
$('#agenda-form').addEventListener('submit', event => {
  event.preventDefault();
  const title = $('#agenda-title').value.trim();
  if (!title) { $('#agenda-title').setCustomValidity('Tulis rencana kamu terlebih dahulu.'); $('#agenda-title').reportValidity(); return; }
  const newEvent = { id: crypto.randomUUID(), title, date: $('#agenda-date').value, time: $('#agenda-time').value, note: $('#agenda-note').value.trim() };
  if (!storage.write('axx-agenda', [...events, newEvent])) { toast('Penyimpanan browser penuh atau diblokir. Agenda belum disimpan.'); return; }
  events.push(newEvent); selectDate(newEvent.date); $('#agenda-dialog').close(); toast('Satu rencana baik berhasil disimpan.');
});
$('#agenda-title').addEventListener('input', () => $('#agenda-title').setCustomValidity(''));
$('#selected-content').addEventListener('click', event => {
  const button = event.target.closest('[data-delete]'); if (!button) return;
  const next = events.filter(item => item.id !== button.dataset.delete);
  if (!storage.write('axx-agenda', next)) { toast('Perubahan belum disimpan. Penyimpanan browser diblokir.'); return; }
  events = next; renderCalendar(); toast('Agenda dihapus. Ruang untuk rencana baru.');
});
$('#holiday-open').addEventListener('click', () => { holidayYear = activeMonth.getFullYear(); renderHolidays(); $('#holiday-dialog').showModal(); });
$('#holiday-previous').addEventListener('click', () => { if (holidayYear > 1900) { holidayYear--; renderHolidays(); } });
$('#holiday-next').addEventListener('click', () => { if (holidayYear < 2100) { holidayYear++; renderHolidays(); } });
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } }));
$('#export-agenda').addEventListener('click', () => {
  if (!events.length) { toast('Tambahkan agenda sebelum mengekspor.'); return; }
  const blob = new Blob([makeICS(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'axxcalender-agenda.ics'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Agenda diekspor. Impor file ke aplikasi kalender favoritmu.');
});
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); pendingInstall = event; $('#install-note').textContent = 'Pasang ke layar utama untuk membuka axxcalender seperti aplikasi. Agenda tetap tersimpan di perangkat ini.'; });
window.addEventListener('appinstalled', () => { pendingInstall = null; $('#install-note').textContent = 'axxcalender sudah terpasang di perangkat ini.'; toast('axxcalender berhasil dipasang.'); });
$('#install-button').addEventListener('click', async () => {
  if (pendingInstall) { const prompt = pendingInstall; await prompt.prompt(); await prompt.userChoice; pendingInstall = null; }
  else if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) toast('axxcalender sudah dibuka sebagai aplikasi.');
  else { $('#install-note').textContent = 'iPhone: Safari → Bagikan → Tambahkan ke Layar Utama. Android/desktop: menu browser → Instal aplikasi atau Tambahkan ke layar utama. Opsi tergantung dukungan browser.'; }
});
// Smooth navigation also exposes which section is active to assistive technology.
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (!entry.isIntersecting) return; document.querySelectorAll('.main-nav a').forEach(a => { const active = a.hash === `#${entry.target.id}`; a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); });
}, { rootMargin: '-10% 0px -45% 0px', threshold: .1 });
observer.observe($('#calendar')); observer.observe($('#themes'));

applySettings(); renderCalendar(); updateToday(); refreshIcons();
setInterval(updateClock, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { updateClock(); updateToday(); } });
serviceWorkerPromise = 'serviceWorker' in navigator && window.isSecureContext ? navigator.serviceWorker.register('/sw.js') : Promise.reject(new Error('Service worker not supported'));
serviceWorkerPromise.catch(error => console.warn('Service worker:', error.message));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
setTimeout(() => { $('#loader').classList.add('loaded'); $('#loader').setAttribute('aria-hidden', 'true'); }, reducedMotion ? 100 : 1300);
