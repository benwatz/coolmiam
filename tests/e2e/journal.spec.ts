import { expect, test } from '@playwright/test';
import { DAY, addMeal, openDay } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await openDay(page);
});

test('affiche l\'état vide puis six repas triés par heure', async ({ page }) => {
  await expect(page.getByTestId('current-date')).toHaveText('mardi 6 octobre 2026');
  await expect(page.getByText('Aucun repas saisi pour ce jour')).toBeVisible();

  const times = ['19:30', '08:00', '12:15', '16:00', '10:30', '22:00'];
  for (const time of times) {
    await addMeal(page, { time, type: 'Autre', description: `Repas de ${time}` });
  }
  const cards = page.getByTestId('meal-card');
  await expect(cards).toHaveCount(6);
  await expect(cards.locator('.meal-card__time')).toHaveText([...times].sort());
});

test('applique la couleur du type de repas', async ({ page }) => {
  await addMeal(page, { time: '08:00', type: 'Petit-déjeuner', description: 'Café' });
  await expect(page.getByTestId('meal-card')).toHaveCSS('background-color', 'rgb(255, 233, 168)');
});

test('modifie tous les champs, y compris la date, puis supprime après confirmation', async ({ page }) => {
  await addMeal(page, { time: '12:00', type: 'Déjeuner', description: 'Pâtes à l\'ail' });
  await page.getByTestId('meal-card').click();
  await expect(page.getByRole('heading', { name: 'Modifier le repas' })).toBeVisible();
  await page.getByLabel('Date', { exact: true }).fill('2026-10-05');
  await page.getByLabel('Heure').fill('13:10');
  await page.getByRole('radio', { name: 'Dîner', exact: true }).check();
  await page.getByLabel('Description').fill('Œufs brouillés, crème fraîche « maison »');
  await page.getByLabel('Notes (symptômes, ressenti)').fill('Ballonnements légers');
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  // Le journal suit la nouvelle date du repas.
  await expect(page.getByTestId('current-date')).toHaveText('lundi 5 octobre 2026');
  const card = page.getByTestId('meal-card');
  await expect(card).toContainText('13:10');
  await expect(card).toContainText('Dîner');
  await expect(card).toContainText('Œufs brouillés, crème fraîche « maison »');
  await expect(card).toContainText('Notes : Ballonnements légers');

  await openDay(page, DAY);
  await expect(page.getByTestId('meal-card')).toHaveCount(0);
  await openDay(page, '2026-10-05');

  await page.getByTestId('meal-card').click();
  await page.getByRole('button', { name: 'Supprimer' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Supprimer ce repas ?');
  await dialog.getByRole('button', { name: 'Annuler' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Supprimer' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByText('Aucun repas saisi pour ce jour')).toBeVisible();
});

test('la case Extra ajoute puis retire le contour rouge et la mention EXTRA', async ({ page }) => {
  await addMeal(page, { time: '16:00', type: 'Collation', description: 'Gâteau', extra: true });
  const card = page.getByTestId('meal-card');
  await expect(card).toContainText('EXTRA');
  await expect(card).toHaveCSS('border-top-color', 'rgb(211, 47, 47)');
  await expect(card).toHaveCSS('border-top-width', '3px');

  await card.click();
  // L'aperçu reflète la case en direct.
  await expect(page.getByTestId('meal-preview')).toContainText('EXTRA');
  await page.getByRole('checkbox', { name: 'Extra' }).uncheck();
  await expect(page.getByTestId('meal-preview')).not.toContainText('EXTRA');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(card).not.toContainText('EXTRA');
  await expect(card).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
});

test('valide le formulaire avec des messages en français', async ({ page }) => {
  await page.getByRole('button', { name: 'Ajouter un repas' }).click();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('La description est obligatoire.')).toBeVisible();
  await page.getByLabel('Heure').fill('');
  await page.getByLabel('Description').fill('Pomme');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Veuillez saisir une heure valide.')).toBeVisible();
});

test('conserve la saisie en cours après un rechargement', async ({ page }) => {
  await page.getByRole('button', { name: 'Ajouter un repas' }).click();
  await page.getByLabel('Description').fill('Saisie interrompue');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Nouveau repas' })).toBeVisible();
  await expect(page.getByLabel('Description')).toHaveValue('Saisie interrompue');
  await page.getByRole('button', { name: 'Annuler' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Nouveau repas' })).toBeHidden();
});

test('le changement de couleur s\'applique aux repas existants', async ({ page }) => {
  await addMeal(page, { time: '20:00', type: 'Dîner', description: 'Soupe' });
  await page.getByRole('button', { name: 'Réglages' }).click();
  await page.getByLabel('Couleur Dîner').fill('#004080');
  await page.getByRole('button', { name: 'Journal' }).click();
  await openDay(page);
  const card = page.getByTestId('meal-card');
  await expect(card).toHaveCSS('background-color', 'rgb(0, 64, 128)');
  // Texte blanc sur fond foncé (contraste AA).
  await expect(card).toHaveCSS('color', 'rgb(255, 255, 255)');

  await page.getByRole('button', { name: 'Réglages' }).click();
  await page.getByRole('button', { name: 'Rétablir les couleurs par défaut' }).click();
  await page.getByRole('button', { name: 'Journal' }).click();
  await openDay(page);
  await expect(card).toHaveCSS('background-color', 'rgb(185, 215, 242)');
});
