import { expect, type Page } from '@playwright/test';

export const DAY = '2026-10-06';

export async function openDay(page: Page, date = DAY) {
  await page.getByLabel('Choisir une date').fill(date);
}

export interface MealData {
  time: string;
  type: 'Petit-déjeuner' | 'Déjeuner' | 'Collation' | 'Dîner' | 'Autre';
  description: string;
  notes?: string;
  extra?: boolean;
}

export async function addMeal(page: Page, meal: MealData) {
  await page.getByRole('button', { name: 'Ajouter un repas' }).click();
  await expect(page.getByRole('heading', { name: 'Nouveau repas' })).toBeVisible();
  await page.getByLabel('Heure').fill(meal.time);
  await page.getByRole('radio', { name: meal.type, exact: true }).check();
  await page.getByLabel('Description').fill(meal.description);
  if (meal.notes) await page.getByLabel('Notes (symptômes, ressenti)').fill(meal.notes);
  if (meal.extra) await page.getByRole('checkbox', { name: 'Extra' }).check();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('heading', { name: 'Nouveau repas' })).toBeHidden();
}
