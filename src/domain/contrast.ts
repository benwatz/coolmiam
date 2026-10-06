/** Calcul du contraste selon WCAG 2.x (luminance relative et ratio). */

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Couleur hexadécimale invalide : ${hex}`);
  }
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const TEXT_DARK = '#000000';
export const TEXT_LIGHT = '#FFFFFF';

/**
 * Couleur de texte (noir ou blanc) offrant le meilleur contraste sur le fond donné.
 * Pour toute couleur de fond, l'une des deux atteint au moins 4,58:1, donc le seuil AA (4,5:1)
 * est toujours respecté.
 */
export function textColorFor(background: string): string {
  return contrastRatio(background, TEXT_DARK) >= contrastRatio(background, TEXT_LIGHT)
    ? TEXT_DARK
    : TEXT_LIGHT;
}
