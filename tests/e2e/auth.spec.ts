import { expect, test } from '@playwright/test';
import { addMeal, openDay } from './helpers';

// Ces tests tournent sur le faux backend (build en mode "e2e") : aucun appel à Firebase.

test('affiche l\'écran de connexion puis le journal après connexion', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('coolmiam.fakeAuth', 'out'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Se connecter avec Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ajouter un repas' })).toBeHidden();

  await page.getByRole('button', { name: 'Se connecter avec Google' }).click();
  await expect(page.getByRole('button', { name: 'Ajouter un repas' })).toBeVisible();
});

test('signale un compte en attente d\'approbation', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('coolmiam.fakeAuth', 'pending'));
  await page.reload();
  await expect(page.getByText("Accès en attente d'approbation.")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ajouter un repas' })).toBeHidden();
});

test('la déconnexion depuis les Réglages ramène à l\'écran de connexion', async ({ page }) => {
  await page.goto('/');
  await openDay(page);
  await addMeal(page, { time: '12:00', type: 'Déjeuner', description: 'Soupe' });

  await page.getByRole('button', { name: 'Réglages' }).click();
  await expect(page.getByTestId('account-email')).toContainText('test@example.com');
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('button', { name: 'Se connecter avec Google' })).toBeVisible();

  await page.getByRole('button', { name: 'Se connecter avec Google' }).click();
  await openDay(page);
  await expect(page.getByTestId('meal-card')).toContainText('Soupe');
});
