import type { Meal } from '../domain/types';
import type { Store, Unsubscribe } from './types';

interface Saved {
  meals?: Meal[];
  settings?: Record<string, unknown>;
}

/**
 * Stockage en mémoire : tests unitaires et faux backend des tests E2E.
 * Avec `storageKey`, le contenu est aussi conservé dans localStorage (survit au rechargement de la page).
 */
export function createMemoryStore(storageKey?: string): Store {
  const meals = new Map<string, Meal>();
  const settings = new Map<string, unknown>();
  const listeners = new Set<() => void>();

  if (storageKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Saved;
      for (const m of saved.meals ?? []) meals.set(m.id, m);
      for (const [k, v] of Object.entries(saved.settings ?? {})) settings.set(k, v);
    } catch {
      // Contenu illisible : on repart de zéro.
    }
  }

  const changed = () => {
    if (storageKey) {
      const saved: Saved = { meals: [...meals.values()], settings: Object.fromEntries(settings) };
      localStorage.setItem(storageKey, JSON.stringify(saved));
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (read: () => void): Unsubscribe => {
    listeners.add(read);
    read();
    return () => listeners.delete(read);
  };
  const inRange = (start: string, end: string) => [...meals.values()].filter((m) => m.date >= start && m.date <= end);

  return {
    watchMeals: (start, end, callback) => subscribe(() => callback(inRange(start, end))),
    getMeals: async (start, end) => inRange(start, end),
    getMeal: async (id) => meals.get(id),
    async putMeal(meal) {
      meals.set(meal.id, meal);
      changed();
    },
    async deleteMeal(id) {
      meals.delete(id);
      changed();
    },
    watchSetting: (key, callback) => subscribe(() => callback(settings.get(key))),
    async setSetting(key, value) {
      settings.set(key, value);
      changed();
    },
  };
}
