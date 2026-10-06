import { describe, expect, it } from 'vitest';
import { addDays, capitalize, dateRange, formatLongDate, formatShortDate, isValidDateStr, toDateStr } from '../../src/domain/dates';

describe('dates', () => {
  it('formate en français', () => {
    expect(formatLongDate('2026-10-06')).toBe('mardi 6 octobre 2026');
    expect(capitalize(formatLongDate('2026-10-05'))).toBe('Lundi 5 octobre 2026');
    expect(formatShortDate('2026-10-06')).toBe('06/10/2026');
  });

  it('ajoute des jours en franchissant mois, années et changements d\'heure', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
  });

  it('liste les jours d\'une plage, bornes incluses', () => {
    expect(dateRange('2026-10-04', '2026-10-06')).toEqual(['2026-10-04', '2026-10-05', '2026-10-06']);
    expect(dateRange('2026-10-06', '2026-10-06')).toEqual(['2026-10-06']);
    expect(dateRange('2026-10-07', '2026-10-06')).toEqual([]);
  });

  it('valide les dates', () => {
    expect(isValidDateStr('2028-02-29')).toBe(true);
    expect(isValidDateStr('2026-02-29')).toBe(false);
    expect(isValidDateStr('06/10/2026')).toBe(false);
    expect(toDateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
