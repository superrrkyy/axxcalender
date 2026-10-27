import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dateKey,
  parseDate,
  monthDays,
  holidaysForYear,
  isCompleteHolidayYear,
  COMPLETE_HOLIDAY_YEARS,
  isValidDateKey,
  isValidTime,
  yearProgress,
  makeICS,
} from '../src/calendar.js';

test('date keys parse in local time without UTC day shifts', () => {
  assert.equal(dateKey(parseDate('2026-10-13')), '2026-10-13');
  assert.equal(parseDate('2026-10-13').getHours(), 12);
});
test('calendar is six weeks, Monday first, with correct October layout', () => {
  const days = monthDays(2026, 9);
  assert.equal(days.length, 42);
  assert.equal(days[0].getDay(), 1);
  assert.equal(dateKey(days[0]), '2026-09-28');
  assert.equal(dateKey(days[3]), '2026-10-01');
  assert.equal(dateKey(days[41]), '2026-11-08');
});
test('calendar handles leap February and year boundaries', () => {
  assert.ok(monthDays(2028, 1).some((d) => dateKey(d) === '2028-02-29'));
  assert.ok(monthDays(2026, 11).some((d) => d.getFullYear() === 2027));
});
test('2026 contains 17 official national holidays including Eid and Christmas', () => {
  const days = holidaysForYear(2026);
  assert.equal(Object.keys(days).length, 17);
  assert.match(days['2026-03-21'], /Idulfitri/);
  assert.match(days['2026-03-22'], /Idulfitri/);
  assert.match(days['2026-12-25'], /Natal/);
  assert.equal(days['2026-10-13'], undefined);
});
test('2027 contains 18 national holidays per SKB 3 Menteri, with two Isra Mikraj', () => {
  const days = holidaysForYear(2027);
  assert.equal(Object.keys(days).length, 18);
  assert.match(days['2027-03-10'], /Idulfitri 1448/);
  assert.match(days['2027-03-11'], /Idulfitri 1448/);
  assert.match(days['2027-01-05'], /Isra Mikraj/);
  // Isra Mikraj occurs twice in Gregorian 2027 (1448 H and 1449 H).
  assert.match(days['2027-12-26'], /Isra Mikraj/);
  assert.match(days['2027-03-08'], /Nyepi/);
  assert.equal(isCompleteHolidayYear(2026), true);
  assert.equal(isCompleteHolidayYear(2027), true);
  assert.equal(isCompleteHolidayYear(2028), false);
  assert.deepEqual(COMPLETE_HOLIDAY_YEARS, [2026, 2027]);
});
test('unsupported years only include fixed holidays, not guessed lunar dates', () => {
  const days = holidaysForYear(2028);
  assert.equal(Object.keys(days).length, 5);
  assert.match(days['2028-08-17'], /Kemerdekaan/);
});
test('date and time validation reject impossible values', () => {
  assert.equal(isValidDateKey('2026-10-13'), true);
  assert.equal(isValidDateKey('2028-02-29'), true);
  assert.equal(isValidDateKey('2026-02-29'), false);
  assert.equal(isValidDateKey('2026-02-31'), false);
  assert.equal(isValidDateKey('2026-13-01'), false);
  assert.equal(isValidDateKey('13-10-2026'), false);
  assert.equal(isValidDateKey(20261013), false);
  assert.equal(isValidTime('09:30'), true);
  assert.equal(isValidTime('23:59'), true);
  assert.equal(isValidTime('24:00'), false);
  assert.equal(isValidTime('99:99'), false);
  assert.equal(isValidTime('9:30'), false);
});
test('year progress is 0% at January start and stays in range', () => {
  assert.equal(yearProgress(new Date(2026, 0, 1)).percent, 0);
  const p = yearProgress(new Date(2026, 11, 31));
  assert.equal(p.percent, 99);
  assert.equal(p.remaining, 1);
});
test('ICS escapes titles and notes, and ends all-day dates exclusively', () => {
  const ics = makeICS([
    { id: 'test', title: 'Meeting, team; plan', note: 'One\nTwo', date: '2026-12-31', time: '' },
  ]);
  assert.match(ics, /SUMMARY:Meeting\\, team\\; plan/);
  assert.match(ics, /DESCRIPTION:One\\nTwo/);
  assert.match(ics, /DTEND;VALUE=DATE:20270101/);
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
});
test('ICS timed events get a one-hour DTEND, crossing midnight safely, sorted', () => {
  const ics = makeICS([
    { id: 'late', title: 'Lembur', note: '', date: '2026-10-13', time: '23:30' },
    { id: 'early', title: 'Pagi', note: '', date: '2026-10-13', time: '09:00' },
  ]);
  assert.match(ics, /DTSTART:20261013T233000\r\nDTEND:20261014T003000/);
  assert.match(ics, /DTSTART:20261013T090000\r\nDTEND:20261013T100000/);
  // Export is chronological regardless of input order.
  assert.ok(ics.indexOf('SUMMARY:Pagi') < ics.indexOf('SUMMARY:Lembur'));
});
test('ICS omits empty descriptions and sanitizes UIDs', () => {
  const ics = makeICS([
    { id: 'jahat\r\nSUMMARY:palsu', title: 'Aman', note: '', date: '2026-01-01', time: '' },
  ]);
  assert.equal(ics.includes('DESCRIPTION:'), false);
  assert.match(ics, /UID:jahatSUMMARYpalsu@axxcalender/);
  assert.equal(ics.includes('\r\nSUMMARY:palsu\r\nUID'), false);
});
test('ICS times are floating local time and unicode lines fold under 75 bytes', () => {
  const ics = makeICS([
    { id: 'test', title: '🌿'.repeat(40), note: '', date: '2026-10-13', time: '09:30' },
  ]);
  assert.match(ics, /DTSTART:20261013T093000/);
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
});
