// Génère les icônes PNG de la PWA à partir de docs/design/logo/coolmiam-icon.svg, avec le Chromium de Playwright.
// Usage : npm run icons  (variable PW_CHROMIUM pour forcer un exécutable Chromium précis).
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(path.join(root, 'docs/design/logo/coolmiam-icon.svg'), 'utf8');
const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

const BRAND = '#2E7D5B';

// full : fond vert en pleine page (pas de transparence ni de coins arrondis visibles).
// safe : part du cadre occupée par le logo (maskable : zone de sécurité de 80 %).
const targets = [
  { file: 'icon-192.png', size: 192, full: false, safe: 1 },
  { file: 'icon-512.png', size: 512, full: false, safe: 1 },
  { file: 'apple-touch-icon.png', size: 180, full: true, safe: 1 },
  { file: 'icon-maskable-512.png', size: 512, full: true, safe: 0.8 },
];

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage();
for (const { file, size, full, safe } of targets) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * safe);
  await page.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${full ? BRAND : 'transparent'}">
    <img src="${dataUrl}" width="${inner}" height="${inner}"></body></html>`);
  await page.screenshot({ path: path.join(root, 'public', file), omitBackground: !full });
  console.log('OK', file);
}
await browser.close();
