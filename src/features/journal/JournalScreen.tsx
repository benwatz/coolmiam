import { useRepo } from '../../auth/session';
import { useLiveQuery } from '../../db/useLiveQuery';
import type { Meal, TypeColors } from '../../domain/types';
import { MealCard } from '../../ui/MealCard';
import { IconPlus } from '../../ui/icons';
import { DateBar } from './DateBar';

interface Props {
  date: string;
  colors: TypeColors;
  onDateChange: (date: string) => void;
  onAdd: () => void;
  onEdit: (meal: Meal) => void;
}

export function JournalScreen({ date, colors, onDateChange, onAdd, onEdit }: Props) {
  const repo = useRepo();
  const meals = useLiveQuery<Meal[]>((cb) => repo.watchMealsByDate(date, cb), [repo, date]);

  return (
    <section class="screen screen--journal" aria-labelledby="journal-title">
      <h2 id="journal-title" class="visually-hidden">
        Journal du jour
      </h2>
      <DateBar date={date} onChange={onDateChange} />
      <div class="screen__scroll">
        {meals === undefined ? null : meals.length === 0 ? (
          <div class="empty-state" data-testid="empty-state">
            <p>Aucun repas saisi pour ce jour</p>
            <p class="empty-state__hint">Appuyez sur le bouton "+" pour ajouter un repas.</p>
          </div>
        ) : (
          <ul class="meal-list" aria-label="Repas du jour">
            {meals.map((meal) => (
              <li key={meal.id}>
                <MealCard meal={meal} colors={colors} onClick={() => onEdit(meal)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" class="fab" aria-label="Ajouter un repas" onClick={onAdd}>
        <IconPlus size={28} />
      </button>
    </section>
  );
}
