import { describe, expect, it } from 'vitest';
import { defaultTimeForType, exportFileName, generateId, sortMeals, suggestMealType, validateMeal } from '../../src/domain/meals';
import { normalizeTypeColors, DEFAULT_TYPE_COLORS, type MealInput } from '../../src/domain/types';
import { makeMeal } from './helpers';

const valid: MealInput = {
  date: '2026-10-06',
  time: '08:30',
  type: 'petit_dejeuner',
  description: 'Café, tartine',
  notes: '',
  extra: false,
};

describe('tri des repas', () => {
  it('trie par date, puis heure, puis createdAt', () => {
    const a = makeMeal({ id: 'a', date: '2026-10-06', time: '12:00', createdAt: '2026-10-06T10:00:02Z' });
    const b = makeMeal({ id: 'b', date: '2026-10-06', time: '12:00', createdAt: '2026-10-06T10:00:01Z' });
    const c = makeMeal({ id: 'c', date: '2026-10-06', time: '07:45' });
    const d = makeMeal({ id: 'd', date: '2026-10-05', time: '23:00' });
    const e = makeMeal({ id: 'e', date: '2026-10-06', time: '19:30' });
    expect(sortMeals([a, b, c, d, e]).map((m) => m.id)).toEqual(['d', 'c', 'b', 'a', 'e']);
  });

  it('ne modifie pas le tableau d\'origine', () => {
    const list = [makeMeal({ time: '10:00' }), makeMeal({ time: '09:00' })];
    const copy = [...list];
    sortMeals(list);
    expect(list).toEqual(copy);
  });
});

describe('validation du formulaire', () => {
  it('accepte une saisie valide', () => {
    expect(validateMeal(valid)).toEqual({});
  });

  it('exige une description non vide', () => {
    expect(validateMeal({ ...valid, description: '   ' }).description).toBe('La description est obligatoire.');
  });

  it('limite la description et les notes à 1000 caractères', () => {
    expect(validateMeal({ ...valid, description: 'a'.repeat(1000) })).toEqual({});
    expect(validateMeal({ ...valid, description: 'a'.repeat(1001) }).description).toBeDefined();
    expect(validateMeal({ ...valid, notes: 'n'.repeat(1001) }).notes).toBeDefined();
  });

  it('refuse une date ou une heure invalide', () => {
    expect(validateMeal({ ...valid, date: '' }).date).toBeDefined();
    expect(validateMeal({ ...valid, date: '2026-02-30' }).date).toBeDefined();
    expect(validateMeal({ ...valid, time: '' }).time).toBeDefined();
    expect(validateMeal({ ...valid, time: '24:00' }).time).toBeDefined();
  });

  it('refuse un type inconnu', () => {
    expect(validateMeal({ ...valid, type: 'brunch' as never }).type).toBeDefined();
  });
});

describe('nom de fichier', () => {
  it('suit le format journal-alimentaire_AAAA-MM-JJ_AAAA-MM-JJ.pdf', () => {
    expect(exportFileName('2026-09-30', '2026-10-06')).toBe('journal-alimentaire_2026-09-30_2026-10-06.pdf');
  });
});

describe('divers', () => {
  it('génère des UUID distincts', () => {
    const ids = new Set(Array.from({ length: 50 }, generateId));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('propose un type selon l\'heure', () => {
    expect(suggestMealType('07:30')).toBe('petit_dejeuner');
    expect(suggestMealType('12:15')).toBe('dejeuner');
    expect(suggestMealType('16:00')).toBe('collation');
    expect(suggestMealType('20:00')).toBe('diner');
    expect(suggestMealType('02:00')).toBe('autre');
  });

  it('propose une heure par défaut selon le type choisi', () => {
    expect(defaultTimeForType('petit_dejeuner')).toBe('07:00');
    expect(defaultTimeForType('dejeuner')).toBe('12:00');
    expect(defaultTimeForType('collation')).toBe('16:00');
    expect(defaultTimeForType('diner')).toBe('19:00');
    expect(defaultTimeForType('autre', () => '14:42')).toBe('14:42');
  });

  it('complète les couleurs stockées avec les valeurs par défaut', () => {
    expect(normalizeTypeColors(undefined)).toEqual(DEFAULT_TYPE_COLORS);
    expect(normalizeTypeColors({ diner: '#123abc', dejeuner: 'rouge' })).toEqual({
      ...DEFAULT_TYPE_COLORS,
      diner: '#123ABC',
    });
  });
});
