import type { MealType } from './types';

/** Forme d'un pictogramme, sur une grille de 24 x 24, tracée au trait (sans remplissage). */
export type IconShape =
  | { kind: 'poly'; pts: [number, number][]; closed?: boolean }
  | { kind: 'circle'; cx: number; cy: number; r: number };

/** Largeur du trait, en unités de la grille. */
export const ICON_STROKE = 1.8;

/** Pictogrammes des types de repas ; une seule définition pour l'app (SVG) et l'export (jsPDF). */
export const MEAL_ICONS: Record<MealType, IconShape[]> = {
  // Tasse de café fumante.
  petit_dejeuner: [
    { kind: 'poly', closed: true, pts: [[4, 9], [4, 16], [7, 19], [14, 19], [17, 16], [17, 9]] },
    { kind: 'poly', pts: [[17, 11], [20, 11], [20, 15], [17, 15]] },
    { kind: 'poly', pts: [[8, 3], [8, 6]] },
    { kind: 'poly', pts: [[12, 3], [12, 6]] },
  ],
  // Assiette pleine : bord et contenu.
  dejeuner: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'circle', cx: 12, cy: 12, r: 5 },
  ],
  // Pomme avec sa queue et sa feuille.
  collation: [
    { kind: 'circle', cx: 12, cy: 14, r: 7 },
    { kind: 'poly', pts: [[12, 7], [12, 4]] },
    { kind: 'poly', pts: [[12, 5], [16, 3]] },
  ],
  // Bol de soupe chaude.
  diner: [
    { kind: 'poly', closed: true, pts: [[3, 12], [21, 12], [19, 17], [16, 20], [8, 20], [5, 17]] },
    { kind: 'poly', pts: [[8, 4], [8, 8]] },
    { kind: 'poly', pts: [[12, 4], [12, 8]] },
    { kind: 'poly', pts: [[16, 4], [16, 8]] },
  ],
  // Réfrigérateur : deux portes et leurs poignées.
  autre: [
    { kind: 'poly', closed: true, pts: [[6, 3], [18, 3], [18, 21], [6, 21]] },
    { kind: 'poly', pts: [[6, 10], [18, 10]] },
    { kind: 'poly', pts: [[9, 6], [9, 8]] },
    { kind: 'poly', pts: [[9, 13], [9, 16]] },
  ],
  // Basket : tige, semelle et lacets.
  sport: [
    { kind: 'poly', closed: true, pts: [[3, 5], [9, 5], [10, 9], [14, 12], [20, 14], [21, 17], [21, 19], [3, 19]] },
    { kind: 'poly', pts: [[3, 16], [21, 16]] },
    { kind: 'poly', pts: [[11, 10], [13, 8]] },
    { kind: 'poly', pts: [[14, 12], [15.5, 10.5]] },
  ],
};
