import type { jsPDF } from 'jspdf';
import regularUrl from './fonts/Roboto-Regular.ttf?url';
import boldUrl from './fonts/Roboto-Bold.ttf?url';
import italicUrl from './fonts/Roboto-Italic.ttf?url';

export const PDF_FONT = 'Roboto';

const FONT_FILES = [
  { file: 'Roboto-Regular.ttf', url: regularUrl, style: 'normal' },
  { file: 'Roboto-Bold.ttf', url: boldUrl, style: 'bold' },
  { file: 'Roboto-Italic.ttf', url: italicUrl, style: 'italic' },
] as const;

let cache: Promise<string[]> | null = null;

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Les polices sont précachées par le service worker : le chargement fonctionne hors ligne. */
function loadFontData(): Promise<string[]> {
  if (!cache) {
    cache = Promise.all(
      FONT_FILES.map(async ({ url }) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Police introuvable : ${url}`);
        return toBase64(await response.arrayBuffer());
      }),
    ).catch((err) => {
      cache = null;
      throw err;
    });
  }
  return cache;
}

/** Intègre la police Roboto (accents et caractères spéciaux) dans le document. */
export async function registerFonts(doc: jsPDF): Promise<void> {
  const data = await loadFontData();
  FONT_FILES.forEach(({ file, style }, i) => {
    doc.addFileToVFS(file, data[i]);
    doc.addFont(file, PDF_FONT, style);
  });
  doc.setFont(PDF_FONT, 'normal');
}
