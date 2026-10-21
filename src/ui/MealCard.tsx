import type { ComponentChildren } from 'preact';
import { textColorFor } from '../domain/contrast';
import { MEAL_TYPE_LABELS, type MealInput, type TypeColors } from '../domain/types';
import { MealTypeIcon } from './MealTypeIcon';

interface Props {
  meal: Pick<MealInput, 'time' | 'type' | 'description' | 'notes' | 'extra'>;
  colors: TypeColors;
  /** Miniature de la photo du repas, si elle existe. */
  photo?: ComponentChildren;
  onClick?: () => void;
}

/** Carte d'un repas : fond selon le type, contour rouge et mention "EXTRA" si applicable. */
export function MealCard({ meal, colors, photo, onClick }: Props) {
  const background = colors[meal.type];
  const style = { backgroundColor: background, color: textColorFor(background) };
  const className = `meal-card${meal.extra ? ' meal-card--extra' : ''}`;
  const label = MEAL_TYPE_LABELS[meal.type];

  const content = (
    <>
      <span class="meal-card__head">
        <span class="meal-card__time">{meal.time || '--:--'}</span>
        <span class="meal-card__type">{label}</span>
        {meal.extra && <span class="meal-card__extra">EXTRA</span>}
        <MealTypeIcon type={meal.type} />
      </span>
      {meal.description && <span class="meal-card__desc">{meal.description}</span>}
      {meal.notes.trim() && <span class="meal-card__notes">Notes : {meal.notes}</span>}
      {photo}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        class={className}
        style={style}
        onClick={onClick}
        data-testid="meal-card"
        aria-label={`${meal.time}, ${label}${meal.extra ? ', extra' : ''}${meal.description ? ` : ${meal.description}` : ''}. Modifier`}
      >
        {content}
      </button>
    );
  }
  return (
    <div class={className} style={style} data-testid="meal-card">
      {content}
    </div>
  );
}
