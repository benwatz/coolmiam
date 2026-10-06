import { isMealType, type MealInput } from '../../domain/types';

/**
 * Brouillon du formulaire en cours, conservé dans localStorage à chaque frappe pour ne pas perdre
 * la saisie si le système ferme l'application lorsqu'elle est en arrière-plan.
 */
export interface FormDraft {
  mealId: string | null;
  values: MealInput;
}

const KEY = 'coolmiam.formDraft';

export function saveDraft(draft: FormDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Stockage indisponible (navigation privée...) : on continue sans brouillon.
  }
}

export function loadDraft(): FormDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FormDraft;
    const v = parsed?.values;
    if (
      !v ||
      typeof v.date !== 'string' ||
      typeof v.time !== 'string' ||
      !isMealType(v.type) ||
      typeof v.description !== 'string' ||
      typeof v.notes !== 'string'
    ) {
      return null;
    }
    return { mealId: typeof parsed.mealId === 'string' ? parsed.mealId : null, values: { ...v, extra: Boolean(v.extra) } };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignoré
  }
}
