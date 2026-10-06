import { addDays, formatLongDate, isValidDateStr, todayStr } from '../../domain/dates';
import { IconChevronLeft, IconChevronRight } from '../../ui/icons';

interface Props {
  date: string;
  onChange: (date: string) => void;
}

export function DateBar({ date, onChange }: Props) {
  const isToday = date === todayStr();
  return (
    <div class="datebar">
      <button type="button" class="icon-btn datebar__step" aria-label="Jour précédent" onClick={() => onChange(addDays(date, -1))}>
        <IconChevronLeft />
      </button>
      <label class="datebar__picker">
        <span class="datebar__label" data-testid="current-date">
          {formatLongDate(date)}
        </span>
        {/* Champ date natif superposé : un appui ouvre le sélecteur du système. */}
        <input
          type="date"
          class="datebar__input"
          aria-label="Choisir une date"
          value={date}
          onChange={(e) => {
            const value = e.currentTarget.value;
            if (isValidDateStr(value)) onChange(value);
          }}
        />
      </label>
      <button type="button" class="icon-btn datebar__step" aria-label="Jour suivant" onClick={() => onChange(addDays(date, 1))}>
        <IconChevronRight />
      </button>
      <button type="button" class="btn btn--small datebar__today" disabled={isToday} onClick={() => onChange(todayStr())}>
        Aujourd'hui
      </button>
    </div>
  );
}
