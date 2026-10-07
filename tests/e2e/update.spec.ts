import { expect, test } from '@playwright/test';

test('les Réglages vérifient la version et affichent "à jour" sans nouvelle version', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole('button', { name: 'Réglages' }).click();
  await expect(page.getByRole('heading', { name: 'Mise à jour' })).toBeVisible();
  await page.getByRole('button', { name: 'Rechercher une mise à jour' }).click();
  await expect(page.getByTestId('update-section')).toContainText("L'application est à jour.");
  await expect(page.getByTestId('update-available')).toBeHidden();
  await expect(page.getByTestId('update-badge')).toBeHidden();
});
