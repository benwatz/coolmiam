import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { addMeal, openDay } from './helpers';

test('refuse une plage invalide et signale une période sans repas', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByLabel('Date de début').fill('2026-10-06');
  await page.getByLabel('Date de fin').fill('2026-10-01');
  await expect(page.getByText('La date de fin doit être postérieure ou égale à la date de début.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Générer le PDF' })).toBeDisabled();

  await page.getByLabel('Date de fin').fill('2026-10-10');
  await expect(page.getByTestId('export-count')).toContainText('Aucun repas saisi');
  await expect(page.getByRole('button', { name: 'Générer le PDF' })).toBeDisabled();
});

test('génère un PDF téléchargeable avec repli si le partage est indisponible', async ({ page }) => {
  await page.goto('/');
  await openDay(page, '2026-10-05');
  await addMeal(page, { time: '08:00', type: 'Petit-déjeuner', description: 'Café, pain grillé', notes: 'Reflux après 1 h' });
  await addMeal(page, { time: '16:30', type: 'Collation', description: 'Crème brûlée', extra: true });

  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByLabel('Date de début').fill('2026-10-04');
  await page.getByLabel('Date de fin').fill('2026-10-06');
  await expect(page.getByTestId('export-count')).toHaveText('2 repas du 04/10/2026 au 06/10/2026.');
  await page.getByRole('button', { name: 'Générer le PDF' }).click();
  await expect(page.getByText('journal-alimentaire_2026-10-04_2026-10-06.pdf')).toBeVisible();

  // Chromium de bureau ne partage pas de fichiers : message de repli attendu.
  const canShare = await page.evaluate(() => typeof navigator.canShare === 'function');
  if (!canShare) {
    await expect(page.getByText("Le partage direct n'est pas disponible sur cet appareil.", { exact: false })).toBeVisible();
  }

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Enregistrer / ouvrir' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('journal-alimentaire_2026-10-04_2026-10-06.pdf');
  const data = await readFile((await download.path())!);
  expect(data.subarray(0, 5).toString()).toBe('%PDF-');
  expect(data.length).toBeGreaterThan(5000);
});

test('le partage est proposé quand le navigateur sait partager un fichier', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __shared: unknown[] }).__shared = [];
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      value: async (data: ShareData) => {
        (window as unknown as { __shared: unknown[] }).__shared.push({ title: data.title, name: data.files?.[0]?.name, type: data.files?.[0]?.type });
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await openDay(page, '2026-10-06');
  await addMeal(page, { time: '12:00', type: 'Déjeuner', description: 'Riz' });
  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByLabel('Date de début').fill('2026-10-06');
  await page.getByLabel('Date de fin').fill('2026-10-06');
  await page.getByRole('button', { name: 'Générer le PDF' }).click();
  await page.getByRole('button', { name: 'Partager' }).click();
  const shared = await page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared);
  expect(shared).toEqual([{ title: 'Journal alimentaire', name: 'journal-alimentaire_2026-10-06_2026-10-06.pdf', type: 'application/pdf' }]);
});
