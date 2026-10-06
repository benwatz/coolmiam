import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryStore } from '../../src/backend/memory';
import { createRepository, type Repository } from '../../src/db/repository';
import { DEFAULT_TYPE_COLORS, type Meal, type MealInput, type TypeColors } from '../../src/domain/types';

const input = (partial: Partial<MealInput>): MealInput => ({
  date: '2026-10-06',
  time: '12:00',
  type: 'dejeuner',
  description: 'Repas',
  notes: '',
  extra: false,
  ...partial,
});

let repo: Repository;

beforeEach(() => {
  repo = createRepository(createMemoryStore());
});

describe('requête par plage de dates', () => {
  it('inclut les deux bornes et exclut l\'extérieur', async () => {
    for (const date of ['2026-09-29', '2026-09-30', '2026-10-03', '2026-10-06', '2026-10-07']) {
      await repo.addMeal(input({ date }));
    }
    const meals = await repo.getMealsInRange('2026-09-30', '2026-10-06');
    expect(meals.map((m) => m.date)).toEqual(['2026-09-30', '2026-10-03', '2026-10-06']);
    let count = -1;
    repo.watchMealCount('2026-09-30', '2026-10-06', (n) => (count = n))();
    expect(count).toBe(3);
  });

  it('renvoie une liste vide pour une plage inversée', async () => {
    await repo.addMeal(input({}));
    expect(await repo.getMealsInRange('2026-10-07', '2026-10-01')).toEqual([]);
    let count = -1;
    repo.watchMealCount('2026-10-07', '2026-10-01', (n) => (count = n))();
    expect(count).toBe(0);
  });

  it('trie les repas d\'un jour par heure', async () => {
    for (const time of ['19:30', '08:00', '12:15', '16:00', '10:30', '22:00']) {
      await repo.addMeal(input({ time }));
    }
    let meals: Meal[] = [];
    repo.watchMealsByDate('2026-10-06', (m) => (meals = m))();
    expect(meals.map((m) => m.time)).toEqual(['08:00', '10:30', '12:15', '16:00', '19:30', '22:00']);
  });
});

describe('écoute des changements', () => {
  it('rappelle à chaque écriture jusqu\'à la désinscription', async () => {
    const seen: number[] = [];
    const stop = repo.watchMealsByDate('2026-10-06', (m) => seen.push(m.length));
    const meal = await repo.addMeal(input({}));
    await repo.addMeal(input({ date: '2026-10-07' }));
    await repo.deleteMeal(meal.id);
    stop();
    await repo.addMeal(input({}));
    expect(seen).toEqual([0, 1, 1, 0]);
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

  it('refuse de modifier un repas inexistant', async () => {
    await expect(repo.updateMeal('absent', input({}))).rejects.toThrow('Repas introuvable.');
  });
});

describe('réglages', () => {
  const current = () => {
    let colors: TypeColors | undefined;
    repo.watchTypeColors((c) => (colors = c))();
    return colors;
  };

  it('renvoie les couleurs par défaut puis les couleurs enregistrées', async () => {
    expect(current()).toEqual(DEFAULT_TYPE_COLORS);
    await repo.setTypeColors({ ...DEFAULT_TYPE_COLORS, diner: '#004080' });
    expect(current()?.diner).toBe('#004080');
    await repo.resetTypeColors();
    expect(current()).toEqual(DEFAULT_TYPE_COLORS);
  });
});
