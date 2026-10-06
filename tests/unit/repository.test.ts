import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoolmiamDb } from '../../src/db/db';
import { createRepository, type Repository } from '../../src/db/repository';
import { DEFAULT_TYPE_COLORS, type MealInput } from '../../src/domain/types';

const input = (partial: Partial<MealInput>): MealInput => ({
  date: '2026-10-06',
  time: '12:00',
  type: 'dejeuner',
  description: 'Repas',
  notes: '',
  extra: false,
  ...partial,
});

let db: CoolmiamDb;
let repo: Repository;
let n = 0;

beforeEach(() => {
  db = new CoolmiamDb(`test-${++n}`);
  repo = createRepository(db);
});

afterEach(async () => {
  await db.delete();
});

describe('requête par plage de dates', () => {
  it('inclut les deux bornes et exclut l\'extérieur', async () => {
    for (const date of ['2026-09-29', '2026-09-30', '2026-10-03', '2026-10-06', '2026-10-07']) {
      await repo.addMeal(input({ date }));
    }
    const meals = await repo.getMealsInRange('2026-09-30', '2026-10-06');
    expect(meals.map((m) => m.date)).toEqual(['2026-09-30', '2026-10-03', '2026-10-06']);
    expect(await repo.countMealsInRange('2026-09-30', '2026-10-06')).toBe(3);
  });

  it('renvoie une liste vide pour une plage inversée', async () => {
    await repo.addMeal(input({}));
    expect(await repo.getMealsInRange('2026-10-07', '2026-10-01')).toEqual([]);
    expect(await repo.countMealsInRange('2026-10-07', '2026-10-01')).toBe(0);
  });

  it('trie les repas d\'un jour par heure', async () => {
    for (const time of ['19:30', '08:00', '12:15', '16:00', '10:30', '22:00']) {
      await repo.addMeal(input({ time }));
    }
    const meals = await repo.getMealsByDate('2026-10-06');
    expect(meals.map((m) => m.time)).toEqual(['08:00', '10:30', '12:15', '16:00', '19:30', '22:00']);
  });
});

describe('création, modification, suppression', () => {
  it('nettoie la saisie et horodate', async () => {
    const created = await repo.addMeal(input({ description: '  Salade niçoise  ', notes: ' ' }), new Date('2026-10-06T10:00:00Z'));
    expect(created.description).toBe('Salade niçoise');
    expect(created.notes).toBe('');
    expect(created.createdAt).toBe('2026-10-06T10:00:00.000Z');
    expect(created.updatedAt).toBe(created.createdAt);

    const updated = await repo.updateMeal(created.id, input({ date: '2026-10-05', extra: true }), new Date('2026-10-06T11:00:00Z'));
    expect(updated.date).toBe('2026-10-05');
    expect(updated.extra).toBe(true);
    expect(updated.createdAt).toBe('2026-10-06T10:00:00.000Z');
    expect(updated.updatedAt).toBe('2026-10-06T11:00:00.000Z');

    await repo.deleteMeal(created.id);
    expect(await repo.getMeal(created.id)).toBeUndefined();
  });
});

describe('réglages', () => {
  it('renvoie les couleurs par défaut puis les couleurs enregistrées', async () => {
    expect(await repo.getTypeColors()).toEqual(DEFAULT_TYPE_COLORS);
    await repo.setTypeColors({ ...DEFAULT_TYPE_COLORS, diner: '#004080' });
    expect((await repo.getTypeColors()).diner).toBe('#004080');
    await repo.resetTypeColors();
    expect(await repo.getTypeColors()).toEqual(DEFAULT_TYPE_COLORS);
  });
});
