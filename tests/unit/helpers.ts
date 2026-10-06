import type { Meal } from '../../src/domain/types';

let counter = 0;

export function makeMeal(partial: Partial<Meal> = {}): Meal {
  counter += 1;
  return {
    id: partial.id ?? `id-${counter}`,
    date: '2026-10-06',
    time: '12:00',
    type: 'dejeuner',
    description: 'Repas',
    notes: '',
    extra: false,
    createdAt: `2026-10-06T10:00:${String(counter % 60).padStart(2, '0')}.000Z`,
    updatedAt: '2026-10-06T10:00:00.000Z',
    ...partial,
  };
}
