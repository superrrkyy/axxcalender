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
const FIXED_HOLIDAYS = { '01-01': 'Tahun Baru Masehi', '05-01': 'Hari Buruh Internasional', '06-01': 'Hari Lahir Pancasila', '08-17': 'Hari Kemerdekaan Republik Indonesia', '12-25': 'Kelahiran Yesus Kristus (Natal)' };
export function holidaysForYear(year) {
  if (year === 2026) return HOLIDAYS_2026;
  return Object.fromEntries(Object.entries(FIXED_HOLIDAYS).map(([date, name]) => [`${year}-${date}`, name]));
}
export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}
export function monthDays(year, month) {
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, i - offset + 1, 12));
}
export function yearProgress(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear() + 1, 0, 1);
  return { percent: Math.floor((date - start) / (end - start) * 100), remaining: Math.ceil((end - date) / 86400000) };
}
export function makeICS(events) {
  const escape = (text) => String(text || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//axxcalender//Agenda//ID', 'CALSCALE:GREGORIAN'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  for (const event of events) {
    const day = event.date.replaceAll('-', '');
    lines.push('BEGIN:VEVENT', `UID:${event.id}@axxcalender`, `DTSTAMP:${stamp}`);
    if (event.time) lines.push(`DTSTART:${day}T${event.time.replace(':', '')}00`);
    else {
      const next = parseDate(event.date); next.setDate(next.getDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${dateKey(next).replaceAll('-', '')}`);
    }
    lines.push(`SUMMARY:${escape(event.title)}`, `DESCRIPTION:${escape(event.note)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  // Fold long lines to stay within the RFC 5545 75-octet limit (UTF-8 safe).
  const encoder = new TextEncoder();
  return lines.map(line => {
    let result = '', part = '', size = 0;
    for (const char of line) {
      const bytes = encoder.encode(char).length;
      if (size + bytes > 75) { result += part + '\r\n'; part = ' '; size = 1; }
      part += char; size += bytes;
    }
    return result + part;
  }).join('\r\n') + '\r\n';
}
