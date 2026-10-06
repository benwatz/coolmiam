import { useEffect, useRef, useState } from 'preact/hooks';
import { useRepo } from '../../auth/session';
import { textColorFor } from '../../domain/contrast';
import { defaultTimeForType, hasErrors, validateMeal, type MealErrors } from '../../domain/meals';
import {
  DESCRIPTION_MAX,
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  type MealInput,
  type MealType,
  type TypeColors,
} from '../../domain/types';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { IconCheck } from '../../ui/icons';
import { saveDraft } from './draft';

/** Réduction minimale de la zone visible à partir de laquelle on considère le clavier ouvert. */
const KEYBOARD_MIN_HEIGHT = 120;
/** Marge ajoutée sous les boutons quand le clavier est ouvert (hauteur de la barre de suggestions). */
const SUGGESTION_BAR_MARGIN = 56;

interface Props {
  mealId: string | null;
  initialValues: MealInput;
  colors: TypeColors;
  onSaved: (date: string) => void;
  onCancel: () => void;
  onDeleted: () => void;
}

export function MealForm({ mealId, initialValues, colors, onSaved, onCancel, onDeleted }: Props) {
  const repo = useRepo();
  const [values, setValues] = useState<MealInput>(initialValues);
  const valuesRef = useRef(initialValues);
  const [errors, setErrors] = useState<MealErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isEdit = mealId !== null;

  useEffect(() => {
    saveDraft({ mealId, values });
    if (submitted) setErrors(validateMeal(values));
  }, [values]);

  // Clavier virtuel : il recouvre la page sans réduire la fenêtre de mise en page (iOS, Chrome Android).
  // On cale la hauteur de l'application sur la zone réellement visible pour que les boutons
  // Annuler / Enregistrer restent juste au-dessus du clavier.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    let fullHeight = Math.max(window.innerHeight, vv.height);
    const sync = () => {
      root.style.setProperty('--app-height', `${vv.height}px`);
      // La barre de suggestions du clavier n'est pas toujours retranchée de la zone visible : quand le
      // clavier est ouvert (zone visible nettement réduite), on ajoute une marge sous les boutons.
      fullHeight = Math.max(fullHeight, vv.height);
      const keyboardOpen = vv.height < fullHeight - KEYBOARD_MIN_HEIGHT;
      root.style.setProperty('--keyboard-margin', keyboardOpen ? `${SUGGESTION_BAR_MARGIN}px` : '0px');
      if (vv.offsetTop > 0) window.scrollTo(0, 0);
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      root.style.removeProperty('--app-height');
      root.style.removeProperty('--keyboard-margin');
    };
  }, []);

  // Le brouillon est enregistré tout de suite (pas seulement dans l'effet, exécuté après le rendu) :
  // un rechargement ou l'arrêt de l'application juste après la saisie ne doit pas la perdre.
  const update = <K extends keyof MealInput>(key: K, value: MealInput[K]) => {
    const next = { ...valuesRef.current, [key]: value };
    valuesRef.current = next;
    saveDraft({ mealId, values: next });
    setValues(next);
  };

  const selectType = (type: MealType) => {
    update('type', type);
    update('time', defaultTimeForType(type));
  };

  const submit = async (e: Event) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateMeal(values);
    setErrors(found);
    if (hasErrors(found)) {
      const first = (['date', 'time', 'type', 'description'] as const).find((k) => found[k]);
      if (first) document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (isEdit) await repo.updateMeal(mealId, values);
      else await repo.addMeal(values);
      onSaved(values.date);
    } catch (err) {
      console.error(err);
      setSaveError("L'enregistrement a échoué. Veuillez réessayer.");
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!mealId) return;
    await repo.deleteMeal(mealId);
    setConfirmDelete(false);
    onDeleted();
  };

  const errorProps = (key: keyof MealInput) =>
    errors[key] ? { 'aria-invalid': true, 'aria-describedby': `error-${key}` } : {};
  const errorMsg = (key: keyof MealInput) =>
    errors[key] ? (
      <p class="field__error" id={`error-${key}`} role="alert">
        {errors[key]}
      </p>
    ) : null;

  return (
    <section class="screen screen--form" aria-labelledby="form-title">
      <form class="meal-form" onSubmit={submit} noValidate>
        <div class="screen__scroll">
          <h2 id="form-title" class="screen__title">
            {isEdit ? 'Modifier le repas' : 'Nouveau repas'}
          </h2>

          <div class="field-row">
            <div class="field">
              <label for="field-date">Date</label>
              <input
                id="field-date"
                type="date"
                required
                value={values.date}
                onInput={(e) => update('date', e.currentTarget.value)}
                {...errorProps('date')}
              />
              {errorMsg('date')}
            </div>
            <div class="field">
              <label for="field-time">Heure</label>
              <input
                id="field-time"
                type="time"
                required
                value={values.time}
                onInput={(e) => update('time', e.currentTarget.value)}
                {...errorProps('time')}
              />
              {errorMsg('time')}
            </div>
          </div>

          <fieldset class="field type-picker" id="field-type" tabIndex={-1}>
            <legend>Type de repas</legend>
            <div class="type-picker__options">
              {MEAL_TYPES.map((type) => {
                const bg = colors[type];
                const checked = values.type === type;
                return (
                  <label
                    key={type}
                    class={`type-option${checked ? ' type-option--checked' : ''}`}
                    style={{ backgroundColor: bg, color: textColorFor(bg) }}
                  >
                    <input
                      type="radio"
                      name="meal-type"
                      value={type}
                      checked={checked}
                      onChange={() => selectType(type)}
                    />
                    {checked && <IconCheck />}
                    <span>{MEAL_TYPE_LABELS[type]}</span>
                  </label>
                );
              })}
              <label class="extra-check">
                <input
                  type="checkbox"
                  checked={values.extra}
                  onChange={(e) => update('extra', e.currentTarget.checked)}
                />
                <span>Extra</span>
              </label>
            </div>
            {errorMsg('type')}
          </fieldset>

          <div class="field">
            <label for="field-description">Description</label>
            <textarea
              id="field-description"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              required
              value={values.description}
              onInput={(e) => update('description', e.currentTarget.value)}
              {...errorProps('description')}
            />
            <span class="field__counter">
              {values.description.length}/{DESCRIPTION_MAX}
            </span>
            {errorMsg('description')}
          </div>

          {saveError && (
            <p class="field__error" role="alert">
              {saveError}
            </p>
          )}

          {isEdit && (
            <button type="button" class="btn btn--danger btn--block form-delete" onClick={() => setConfirmDelete(true)}>
              Supprimer
            </button>
          )}
        </div>

        <div class="form-actions">
          <button type="button" class="btn" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" class="btn btn--primary" disabled={saving}>
            Enregistrer
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer ce repas ?"
          message="Cette action est définitive."
          confirmLabel="Supprimer"
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </section>
  );
}
