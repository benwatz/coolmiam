import type { CoolmiamDb } from './db';
import { compareMeals, generateId, normalizeInput } from '../domain/meals';
import { DEFAULT_TYPE_COLORS, normalizeTypeColors, type Meal, type MealInput, type TypeColors } from '../domain/types';

const TYPE_COLORS_KEY = 'typeColors';

/** Accès aux données, indépendant de l'instance Dexie (testable avec fake-indexeddb). */
export function createRepository(db: CoolmiamDb) {
  return {
    async getMealsByDate(date: string): Promise<Meal[]> {
      const meals = await db.meals.where('date').equals(date).toArray();
      return meals.sort(compareMeals);
    },

    /** Repas compris entre start et end, bornes incluses, triés. */
    async getMealsInRange(start: string, end: string): Promise<Meal[]> {
      if (end < start) return [];
      const meals = await db.meals.where('date').between(start, end, true, true).toArray();
      return meals.sort(compareMeals);
    },

    async countMealsInRange(start: string, end: string): Promise<number> {
      if (end < start) return 0;
      return db.meals.where('date').between(start, end, true, true).count();
    },

    async getMeal(id: string): Promise<Meal | undefined> {
      return db.meals.get(id);
    },

    async addMeal(input: MealInput, now: Date = new Date()): Promise<Meal> {
      const iso = now.toISOString();
      const meal: Meal = { id: generateId(), ...normalizeInput(input), createdAt: iso, updatedAt: iso };
      await db.meals.add(meal);
      return meal;
    },

    async updateMeal(id: string, input: MealInput, now: Date = new Date()): Promise<Meal> {
      const existing = await db.meals.get(id);
      if (!existing) throw new Error('Repas introuvable.');
      const meal: Meal = { ...existing, ...normalizeInput(input), updatedAt: now.toISOString() };
      await db.meals.put(meal);
      return meal;
    },

    async deleteMeal(id: string): Promise<void> {
      await db.meals.delete(id);
    },

    async getTypeColors(): Promise<TypeColors> {
      const row = await db.settings.get(TYPE_COLORS_KEY);
      return normalizeTypeColors(row?.value);
    },

    async setTypeColors(colors: TypeColors): Promise<void> {
      await db.settings.put({ key: TYPE_COLORS_KEY, value: normalizeTypeColors(colors) });
    },

    async resetTypeColors(): Promise<TypeColors> {
      await db.settings.put({ key: TYPE_COLORS_KEY, value: { ...DEFAULT_TYPE_COLORS } });
      return { ...DEFAULT_TYPE_COLORS };
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
