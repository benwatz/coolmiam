import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, textColorFor, TEXT_DARK, TEXT_LIGHT } from '../../src/domain/contrast';
import { DEFAULT_TYPE_COLORS, MEAL_TYPES } from '../../src/domain/types';

describe('contraste', () => {
  it('convertit une couleur hexadécimale', () => {
    expect(hexToRgb('#FFE9A8')).toEqual([255, 233, 168]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(() => hexToRgb('#zzz999')).toThrow();
  });

  it('calcule le ratio noir/blanc à 21:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('choisit le texte noir sur fond clair et blanc sur fond foncé', () => {
    expect(textColorFor('#FFFFFF')).toBe(TEXT_DARK);
    expect(textColorFor('#000000')).toBe(TEXT_LIGHT);
    expect(textColorFor('#1A237E')).toBe(TEXT_LIGHT);
  });

  it('respecte le ratio AA (4,5:1) pour les couleurs par défaut', () => {
    for (const type of MEAL_TYPES) {
      const bg = DEFAULT_TYPE_COLORS[type];
      expect(contrastRatio(bg, textColorFor(bg))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('respecte le ratio AA pour toute couleur de fond (échantillonnage)', () => {
    for (let r = 0; r <= 255; r += 17) {
      for (let g = 0; g <= 255; g += 17) {
        for (let b = 0; b <= 255; b += 17) {
          const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
          expect(contrastRatio(hex, textColorFor(hex))).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
