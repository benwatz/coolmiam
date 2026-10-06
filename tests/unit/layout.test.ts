import { describe, expect, it } from 'vitest';
import {
  CONTENT_BOTTOM,
  CONTENT_TOP,
  SIZES,
  groupByDay,
  layoutJournal,
  mealBlockHeight,
  type MealMeasure,
  type PlacedItem,
} from '../../src/pdf/layout';
import { dateRange } from '../../src/domain/dates';
import type { Meal } from '../../src/domain/types';
import { makeMeal } from './helpers';

/** Mesure fictive : nombre de lignes de description porté par la longueur du texte. */
const measure = (meal: Meal): MealMeasure => ({
  descLines: Array.from({ length: meal.description.length }, () => 'x'),
  noteLines: meal.notes ? ['n'] : [],
});

function assertPagesValid(pages: PlacedItem[][]) {
  for (const page of pages) {
    for (const item of page) {
      expect(item.y).toBeGreaterThanOrEqual(CONTENT_TOP - 1e-6);
      expect(item.y + item.height).toBeLessThanOrEqual(CONTENT_BOTTOM + 1e-6);
    }
    // Aucun titre de jour isolé en bas de page.
    const last = page[page.length - 1];
    expect(last.kind).not.toBe('dayTitle');
  }
}

describe('découpage en pages', () => {
  it('place l\'en-tête en première page uniquement', () => {
    const pages = layoutJournal([{ date: '2026-10-06', meals: [makeMeal()] }], measure);
    expect(pages).toHaveLength(1);
    expect(pages[0][0].kind).toBe('header');
    expect(pages[0].map((i) => i.kind)).toEqual(['header', 'dayTitle', 'meal']);
  });

  it('affiche "Aucun repas saisi" pour un jour vide', () => {
    const days = groupByDay(dateRange('2026-10-04', '2026-10-06'), [makeMeal({ date: '2026-10-05' })]);
    const pages = layoutJournal(days, measure);
    expect(pages[0].map((i) => i.kind)).toEqual(['header', 'dayTitle', 'empty', 'dayTitle', 'meal', 'dayTitle', 'empty']);
  });

  it('ne coupe jamais un bloc et n\'isole jamais un titre de jour sur 31 jours chargés', () => {
    const dates = dateRange('2026-10-01', '2026-10-31');
    const meals: Meal[] = [];
    dates.forEach((date, i) => {
      for (let k = 0; k < 6; k++) {
        meals.push(makeMeal({ date, time: `0${k}:00`, description: 'd'.repeat(1 + ((i + k) % 7)), notes: k % 2 ? 'note' : '' }));
      }
    });
    const pages = layoutJournal(groupByDay(dates, meals), measure);
    expect(pages.length).toBeGreaterThan(5);
    assertPagesValid(pages);
    const placedMeals = pages.flat().filter((i) => i.kind === 'meal');
    expect(placedMeals).toHaveLength(meals.length);
    // Ordre chronologique conservé.
    const order = placedMeals.map((i) => (i.kind === 'meal' ? `${i.meal.date} ${i.meal.time}` : ''));
    expect(order).toEqual([...order].sort());
  });

  it('déplace le titre avec son premier repas quand il n\'y a plus la place', () => {
    // Remplit la première page presque entièrement avec un jour, puis un second jour.
    const available = CONTENT_BOTTOM - CONTENT_TOP - SIZES.headerHeight - SIZES.dayTitleHeight;
    const lines = Math.floor((available - mealBlockHeight({ descLines: [], noteLines: [] })) / SIZES.bodyLineHeight);
    const big = makeMeal({ date: '2026-10-05', description: 'x'.repeat(lines) });
    const next = makeMeal({ date: '2026-10-06', description: 'x' });
    const pages = layoutJournal(
      [
        { date: '2026-10-05', meals: [big] },
        { date: '2026-10-06', meals: [next] },
      ],
      measure,
    );
    expect(pages).toHaveLength(2);
    expect(pages[1].map((i) => i.kind)).toEqual(['dayTitle', 'meal']);
    expect(pages[1][0].y).toBe(CONTENT_TOP);
    assertPagesValid(pages);
  });

  it('calcule la hauteur d\'un bloc avec et sans notes', () => {
    const without = mealBlockHeight({ descLines: ['a', 'b'], noteLines: [] });
    const withNotes = mealBlockHeight({ descLines: ['a', 'b'], noteLines: ['n'] });
    expect(withNotes - without).toBeCloseTo(SIZES.innerGap + SIZES.bodyLineHeight, 6);
  });
});
