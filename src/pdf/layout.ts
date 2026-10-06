/**
 * Mise en page du PDF, indépendante de jsPDF (testable unitairement).
 * Toutes les dimensions sont en millimètres ; l'origine est le coin supérieur gauche de la page.
 */
import type { Meal } from '../domain/types';

export const PAGE = {
  width: 210,
  height: 297,
  margin: 15,
  /** Hauteur réservée au pied de page "Page n/N" en bas de la zone imprimable. */
  footerHeight: 8,
} as const;

export const CONTENT_TOP = PAGE.margin;
export const CONTENT_BOTTOM = PAGE.height - PAGE.margin - PAGE.footerHeight;
export const CONTENT_WIDTH = PAGE.width - 2 * PAGE.margin;

export const SIZES = {
  headerHeight: 24,
  dayTitleHeight: 8,
  /** Espace avant un titre de jour (sauf en haut de page). */
  dayGap: 4,
  emptyLineHeight: 6,
  mealGap: 3,
  blockPadding: 3,
  firstLineHeight: 5.2,
  bodyLineHeight: 4.6,
  innerGap: 1,
} as const;

export interface MealMeasure {
  descLines: string[];
  noteLines: string[];
}

export function mealBlockHeight(m: MealMeasure): number {
  let h = 2 * SIZES.blockPadding + SIZES.firstLineHeight;
  h += SIZES.innerGap + m.descLines.length * SIZES.bodyLineHeight;
  if (m.noteLines.length > 0) {
    h += SIZES.innerGap + m.noteLines.length * SIZES.bodyLineHeight;
  }
  return h;
}

export interface DayInput {
  date: string;
  meals: Meal[];
}

export type PlacedItem =
  | { kind: 'header'; y: number; height: number }
  | { kind: 'dayTitle'; date: string; y: number; height: number }
  | { kind: 'empty'; date: string; y: number; height: number }
  | { kind: 'meal'; meal: Meal; measure: MealMeasure; y: number; height: number };

/**
 * Répartit les jours et les repas sur les pages.
 * - un bloc repas n'est jamais coupé entre deux pages ;
 * - un titre de jour reste sur la même page que son premier élément (repas ou "Aucun repas saisi").
 */
export function layoutJournal(days: DayInput[], measure: (meal: Meal) => MealMeasure): PlacedItem[][] {
  const pages: PlacedItem[][] = [[]];
  let page = pages[0];
  let y = CONTENT_TOP;

  const newPage = () => {
    page = [];
    pages.push(page);
    y = CONTENT_TOP;
  };
  const fits = (height: number) => y + height <= CONTENT_BOTTOM + 1e-6;
  // L'en-tête de la première page compte comme "haut de page" (pas d'espace supplémentaire après).
  const atTop = () => page.every((item) => item.kind === 'header');

  page.push({ kind: 'header', y, height: SIZES.headerHeight });
  y += SIZES.headerHeight;

  for (const day of days) {
    const measures = day.meals.map((meal) => {
      const m = measure(meal);
      return { meal, measure: m, height: mealBlockHeight(m) };
    });
    const firstHeight = measures.length > 0 ? measures[0].height : SIZES.emptyLineHeight;

    // Titre + premier élément ensemble, sinon page suivante.
    const gapBefore = atTop() ? 0 : SIZES.dayGap;
    if (!atTop() && !fits(gapBefore + SIZES.dayTitleHeight + firstHeight)) {
      newPage();
    }
    y += atTop() ? 0 : SIZES.dayGap;
    page.push({ kind: 'dayTitle', date: day.date, y, height: SIZES.dayTitleHeight });
    y += SIZES.dayTitleHeight;

    if (measures.length === 0) {
      page.push({ kind: 'empty', date: day.date, y, height: SIZES.emptyLineHeight });
      y += SIZES.emptyLineHeight;
      continue;
    }

    measures.forEach((item, index) => {
      if (index > 0) {
        if (!fits(SIZES.mealGap + item.height)) {
          newPage();
        } else {
          y += SIZES.mealGap;
        }
      }
      page.push({ kind: 'meal', meal: item.meal, measure: item.measure, y, height: item.height });
      y += item.height;
    });
  }

  return pages;
}

/** Regroupe les repas (déjà triés) par jour, sur toute la plage, jours vides compris. */
export function groupByDay(dates: string[], meals: Meal[]): DayInput[] {
  const byDate = new Map<string, Meal[]>();
  for (const meal of meals) {
    const list = byDate.get(meal.date);
    if (list) list.push(meal);
    else byDate.set(meal.date, [meal]);
  }
  return dates.map((date) => ({ date, meals: byDate.get(date) ?? [] }));
}
