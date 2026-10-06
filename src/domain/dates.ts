/**
 * Manipulation des dates en heure locale. Les dates sont stockées sous forme de chaîne
 * "YYYY-MM-DD" pour éviter les décalages liés aux fuseaux horaires et aux changements d'heure.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeStr(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function todayStr(now: Date = new Date()): string {
  return toDateStr(now);
}

export function nowTimeStr(now: Date = new Date()): string {
  return toTimeStr(now);
}

export function isValidDateStr(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function isValidTimeStr(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Convertit "YYYY-MM-DD" en Date locale (midi, pour rester à l'abri des changements d'heure). */
export function parseDateStr(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function addDays(value: string, days: number): string {
  const d = parseDateStr(value);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** Liste des dates de start à end, bornes incluses. Vide si end < start. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let cur = start; cur <= end; cur = addDays(cur, 1)) {
    out.push(cur);
  }
  return out;
}

const longFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** "lundi 6 octobre 2026". */
export function formatLongDate(value: string): string {
  return longFormatter.format(parseDateStr(value));
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "06/10/2026". */
export function formatShortDate(value: string): string {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}
