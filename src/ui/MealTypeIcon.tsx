import { ICON_STROKE, MEAL_ICONS } from '../domain/mealIcons';
import type { MealType } from '../domain/types';

/** Pictogramme du type de repas, de la couleur du texte courant. Décoratif : le libellé est toujours écrit. */
export function MealTypeIcon({ type }: { type: MealType }) {
  return (
    <svg
      class="meal-type-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      stroke-width={ICON_STROKE}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {MEAL_ICONS[type].map((s) =>
        s.kind === 'circle' ? (
          <circle cx={s.cx} cy={s.cy} r={s.r} />
        ) : s.closed ? (
          <polygon points={s.pts.map((p) => p.join(',')).join(' ')} />
        ) : (
          <polyline points={s.pts.map((p) => p.join(',')).join(' ')} />
        ),
      )}
    </svg>
  );
}
