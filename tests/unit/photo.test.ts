import { describe, expect, it } from 'vitest';
import { fitWithin } from '../../src/domain/photo';
import { PHOTO_BOX, fitPhoto, mealBlockHeight, SIZES } from '../../src/pdf/layout';

describe('fitWithin', () => {
  it('réduit en gardant les proportions', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1024, height: 768 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 768, height: 1024 });
  });
  it('n\'agrandit jamais', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe('photo dans le PDF', () => {
  it('tient dans la zone prévue', () => {
    for (const [w, h] of [[1024, 768], [768, 1024], [1000, 1000], [1024, 100]]) {
      const size = fitPhoto(w, h);
      expect(size.width).toBeLessThanOrEqual(PHOTO_BOX.width + 1e-6);
      expect(size.height).toBeLessThanOrEqual(PHOTO_BOX.height + 1e-6);
      expect(size.width / size.height).toBeCloseTo(w / h);
    }
  });
  it('ajoute sa hauteur au bloc, sans ligne de description vide', () => {
    const photo = { width: 40, height: 30 };
    const without = mealBlockHeight({ descLines: [], noteLines: [] });
    expect(mealBlockHeight({ descLines: [], noteLines: [], photo })).toBeCloseTo(without + SIZES.innerGap + 30);
  });
});
