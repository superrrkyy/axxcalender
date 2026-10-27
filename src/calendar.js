export const HOLIDAYS_2026 = {
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-19': 'Hari Suci Nyepi (Tahun Baru Saka 1948)',
  '2026-03-21': 'Idulfitri 1447 Hijriah',
  '2026-03-22': 'Idulfitri 1447 Hijriah',
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-04-05': 'Kebangkitan Yesus Kristus (Paskah)',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-27': 'Iduladha 1447 Hijriah',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-06-16': 'Tahun Baru Islam 1448 Hijriah',
  '2026-08-17': 'Hari Kemerdekaan Republik Indonesia',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-12-25': 'Kelahiran Yesus Kristus (Natal)',
};
// SKB 3 Menteri Nomor 1205/3/2 Tahun 2026 (ditetapkan 15 September 2026):
// 18 hari libur nasional — Isra Mikraj jatuh dua kali di tahun Masehi 2027.
export const HOLIDAYS_2027 = {
  '2027-01-01': 'Tahun Baru 2027 Masehi',
  '2027-01-05': 'Isra Mikraj Nabi Muhammad SAW',
  '2027-02-06': 'Tahun Baru Imlek 2578 Kongzili',
  '2027-03-08': 'Hari Suci Nyepi (Tahun Baru Saka 1949)',
  '2027-03-10': 'Idulfitri 1448 Hijriah',
  '2027-03-11': 'Idulfitri 1448 Hijriah',
  '2027-03-26': 'Wafat Yesus Kristus',
  '2027-03-28': 'Hari Kebangkitan Yesus Kristus (Paskah)',
  '2027-05-01': 'Hari Buruh Internasional',
  '2027-05-06': 'Kenaikan Yesus Kristus',
  '2027-05-17': 'Iduladha 1448 Hijriah',
  '2027-05-20': 'Hari Raya Waisak 2571 BE',
  '2027-06-01': 'Hari Lahir Pancasila',
  '2027-06-06': '1 Muharam Tahun Baru Islam 1449 Hijriah',
  '2027-08-15': 'Maulid Nabi Muhammad SAW',
  '2027-08-17': 'Proklamasi Kemerdekaan Republik Indonesia',
  '2027-12-25': 'Kelahiran Yesus Kristus (Natal)',
  '2027-12-26': 'Isra Mikraj Nabi Muhammad SAW',
};
const HOLIDAY_DATA = { 2026: HOLIDAYS_2026, 2027: HOLIDAYS_2027 };
export const COMPLETE_HOLIDAY_YEARS = Object.keys(HOLIDAY_DATA)
  .map(Number)
  .sort((a, b) => a - b);
export function isCompleteHolidayYear(year) {
  return Object.hasOwn(HOLIDAY_DATA, year);
}
const FIXED_HOLIDAYS = {
  '01-01': 'Tahun Baru Masehi',
  '05-01': 'Hari Buruh Internasional',
  '06-01': 'Hari Lahir Pancasila',
  '08-17': 'Hari Kemerdekaan Republik Indonesia',
  '12-25': 'Kelahiran Yesus Kristus (Natal)',
};
export function holidaysForYear(year) {
  if (isCompleteHolidayYear(year)) return HOLIDAY_DATA[year];
  return Object.fromEntries(
    Object.entries(FIXED_HOLIDAYS).map(([date, name]) => [`${year}-${date}`, name]),
  );
}
export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}
export function isValidDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  // Round-trip rejects impossible dates such as 2026-02-31, which
  // JavaScript would otherwise silently roll over into March.
  return dateKey(parseDate(key)) === key;
}
export function isValidTime(time) {
  return typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}
export function monthDays(year, month) {
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, i - offset + 1, 12));
}
export function yearProgress(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear() + 1, 0, 1);
  return {
    percent: Math.floor(((date - start) / (end - start)) * 100),
    remaining: Math.ceil((end - date) / 86400000),
  };
}
export function makeICS(events) {
  const escape = (text) =>
    String(text || '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  const pad = (n) => String(n).padStart(2, '0');
  const formatDateTime = (date) =>
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//axxcalender//Agenda//ID',
    'CALSCALE:GREGORIAN',
  ];
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const sorted = [...events].sort((a, b) =>
    `${a.date}T${a.time || ''}`.localeCompare(`${b.date}T${b.time || ''}`),
  );
  for (const event of sorted) {
    const day = event.date.replaceAll('-', '');
    const uid = String(event.id || 'event').replace(/[^\w.-]/g, '') || 'event';
    lines.push('BEGIN:VEVENT', `UID:${uid}@axxcalender`, `DTSTAMP:${stamp}`);
    if (event.time) {
      const [hour, minute] = event.time.split(':').map(Number);
      const start = parseDate(event.date);
      start.setHours(hour, minute, 0, 0);
      // Floating local time with a one-hour duration (previously no DTEND,
      // which RFC 5545 treats as a zero-length instant event).
      const end = new Date(start.getTime() + 3600000);
      lines.push(`DTSTART:${formatDateTime(start)}`, `DTEND:${formatDateTime(end)}`);
    } else {
      const next = parseDate(event.date);
      next.setDate(next.getDate() + 1);
      lines.push(
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${dateKey(next).replaceAll('-', '')}`,
      );
    }
    lines.push(`SUMMARY:${escape(event.title)}`);
    if (event.note) lines.push(`DESCRIPTION:${escape(event.note)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  // Fold long lines to stay within the RFC 5545 75-octet limit (UTF-8 safe).
  const encoder = new TextEncoder();
  return (
    lines
      .map((line) => {
        let result = '',
          part = '',
          size = 0;
        for (const char of line) {
          const bytes = encoder.encode(char).length;
          if (size + bytes > 75) {
            result += part + '\r\n';
            part = ' ';
            size = 1;
          }
          part += char;
          size += bytes;
        }
        return result + part;
      })
      .join('\r\n') + '\r\n'
  );
}
