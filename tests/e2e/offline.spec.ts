import { expect, test } from '@playwright/test';
import { addMeal, openDay } from './helpers';

test('fonctionne hors ligne après une première visite', async ({ page, context }) => {
  await page.goto('/');
  // Attente de l'installation du service worker et du précache.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Coolmiam' })).toBeVisible();

  await openDay(page, '2026-10-06');
  await addMeal(page, { time: '09:00', type: 'Petit-déjeuner', description: 'Thé vert, pain d\'épices' });
  await expect(page.getByTestId('meal-card')).toContainText("Thé vert, pain d'épices");

  // L'export PDF (polices comprises) fonctionne aussi sans réseau.
  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByLabel('Date de début').fill('2026-10-06');
  await page.getByLabel('Date de fin').fill('2026-10-06');
  await page.getByRole('button', { name: 'Générer le PDF' }).click();
  await expect(page.getByText('journal-alimentaire_2026-10-06_2026-10-06.pdf')).toBeVisible();
  await context.setOffline(false);
});
