import type { Store, Unsubscribe } from '../backend/types';
import { compareMeals, generateId, normalizeInput } from '../domain/meals';
import { DEFAULT_TYPE_COLORS, normalizeTypeColors, type Meal, type MealInput, type TypeColors } from '../domain/types';

const TYPE_COLORS_KEY = 'typeColors';

/** Accès aux données, indépendant du stockage (Firestore en production, mémoire dans les tests). */
export function createRepository(store: Store) {
  return {
    /** Repas d'un jour, triés ; rappelé à chaque changement (y compris venant d'un autre appareil). */
    watchMealsByDate(date: string, callback: (meals: Meal[]) => void): Unsubscribe {
      return store.watchMeals(date, date, (meals) => callback(meals.sort(compareMeals)));
    },

    watchMealCount(start: string, end: string, callback: (count: number) => void): Unsubscribe {
      if (end < start) {
        callback(0);
        return () => {};
      }
      return store.watchMeals(start, end, (meals) => callback(meals.length));
    },

    watchTypeColors(callback: (colors: TypeColors) => void): Unsubscribe {
      return store.watchSetting(TYPE_COLORS_KEY, (value) => callback(normalizeTypeColors(value)));
    },

    /** Repas compris entre start et end, bornes incluses, triés. */
    async getMealsInRange(start: string, end: string): Promise<Meal[]> {
      if (end < start) return [];
      return (await store.getMeals(start, end)).sort(compareMeals);
    },

    async getMeal(id: string): Promise<Meal | undefined> {
      return store.getMeal(id);
    },

    async addMeal(input: MealInput, now: Date = new Date()): Promise<Meal> {
      const iso = now.toISOString();
      const meal: Meal = { id: generateId(), ...normalizeInput(input), createdAt: iso, updatedAt: iso };
      await store.putMeal(meal);
      return meal;
    },

    async updateMeal(id: string, input: MealInput, now: Date = new Date()): Promise<Meal> {
      const existing = await store.getMeal(id);
      if (!existing) throw new Error('Repas introuvable.');
      const meal: Meal = { ...existing, ...normalizeInput(input), updatedAt: now.toISOString() };
      await store.putMeal(meal);
      return meal;
    },

    async deleteMeal(id: string): Promise<void> {
      await store.deleteMeal(id);
    },

    async setTypeColors(colors: TypeColors): Promise<void> {
      await store.setSetting(TYPE_COLORS_KEY, normalizeTypeColors(colors));
    },

    async resetTypeColors(): Promise<TypeColors> {
      await store.setSetting(TYPE_COLORS_KEY, { ...DEFAULT_TYPE_COLORS });
      return { ...DEFAULT_TYPE_COLORS };
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
