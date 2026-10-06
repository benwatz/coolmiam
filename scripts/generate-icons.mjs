// Génère les icônes PNG de la PWA à partir de public/favicon.svg, avec le Chromium de Playwright.
// Usage : npm run icons  (variable PW_CHROMIUM pour forcer un exécutable Chromium précis).
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(path.join(root, 'public/favicon.svg'), 'utf8');
const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
  // Maskable : fond plein et motif réduit à la zone de sécurité (cercle de 80 %).
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
];

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage();
for (const { file, size, maskable } of targets) {
  await page.setViewportSize({ width: size, height: size });
  const inner = maskable ? Math.round(size * 0.78) : size;
  await page.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${maskable ? '#2E7D5B' : 'transparent'}">
    <img src="${dataUrl}" width="${inner}" height="${inner}"></body></html>`);
  await page.screenshot({ path: path.join(root, 'public', file), omitBackground: !maskable });
  console.log('OK', file);
}
await browser.close();
