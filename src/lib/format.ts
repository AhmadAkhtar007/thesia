import { TARGET } from './config';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parseISO(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDate(iso: string, opts: { year?: boolean } = {}) {
  const d = parseISO(iso);
  const showYear = opts.year ?? true;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${showYear ? ' ' + d.getFullYear() : ''}`;
}

export function formatRange(start: string, end: string) {
  const a = parseISO(start);
  const b = parseISO(end);
  if (start.slice(0, 10) === end.slice(0, 10)) return formatDate(start);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth())
    return `${a.getDate()}–${b.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  if (a.getFullYear() === b.getFullYear()) return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return { month: MONTHS_LONG[m - 1], year: String(y) };
}

export function daysFromToday(iso: string, today = new Date()) {
  const a = parseISO(iso);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a.getTime() - t.getTime()) / 86400000);
}

export function relativeDays(iso: string) {
  const d = daysFromToday(iso);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  if (d > 0) return d < 60 ? `in ${d} days` : `in ${Math.round(d / 30)} months`;
  return -d < 60 ? `${-d} days ago` : `${Math.round(-d / 30)} months ago`;
}

export function initials(name: string) {
  return (
    name
      .replace(/^(Dr\.?|Prof\.?)\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?'
  );
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function plural(n: number, one: string, many = one + 's') {
  return `${n} ${n === 1 ? one : many}`;
}

export const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim());

/** "just now", "5 min ago", "3 h ago", "yesterday", then a date. */
export function relativeTime(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 172800) return 'yesterday';
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} days ago`;
  return formatDate(iso);
}

/** ISO date `days` after `iso`. */
export function addDays(iso: string, days: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** RFC 4180 CSV, with a BOM so Excel opens Urdu and other non-Latin names correctly. */
export function toCSV(rows: (string | number | boolean | null | undefined)[][]) {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    // Neutralise spreadsheet formulas in user-supplied text.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

/** Saves text as a file. Returns false where downloads are blocked (e.g. some embedded previews). */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  // The claude.ai preview can't save files; the deployed site can.
  if (TARGET === 'artifact') return false;
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
