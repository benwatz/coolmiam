import { DESCRIPTION_MAX, NOTES_MAX, isMealType, type Meal, type MealInput, type MealType } from './types';
import { isValidDateStr, isValidTimeStr, nowTimeStr } from './dates';

/** Tri d'affichage : date croissante, puis heure croissante, puis createdAt croissant. */
export function compareMeals(a: Meal, b: Meal): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.time !== b.time) return a.time < b.time ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return 0;
}

export function sortMeals(meals: Meal[]): Meal[] {
  return [...meals].sort(compareMeals);
}

export type MealErrors = Partial<Record<keyof MealInput, string>>;

export function validateMeal(input: MealInput): MealErrors {
  const errors: MealErrors = {};
  if (!isValidDateStr(input.date)) {
    errors.date = 'Veuillez saisir une date valide.';
  }
  if (!isValidTimeStr(input.time)) {
    errors.time = 'Veuillez saisir une heure valide.';
  }
  if (!isMealType(input.type)) {
    errors.type = 'Veuillez choisir un type de repas.';
  }
  const description = input.description.trim();
  if (description.length === 0) {
    errors.description = 'La description est obligatoire.';
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `La description ne doit pas dépasser ${DESCRIPTION_MAX} caractères.`;
  }
  if (input.notes.trim().length > NOTES_MAX) {
    errors.notes = `Les notes ne doivent pas dépasser ${NOTES_MAX} caractères.`;
  }
  return errors;
}

export function hasErrors(errors: MealErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Nettoie la saisie avant enregistrement. */
export function normalizeInput(input: MealInput): MealInput {
  return {
    date: input.date,
    time: input.time,
    type: input.type,
    description: input.description.trim(),
    notes: input.notes.trim(),
    extra: Boolean(input.extra),
  };
}

/** "journal-alimentaire_AAAA-MM-JJ_AAAA-MM-JJ.pdf". */
export function exportFileName(start: string, end: string): string {
  return `journal-alimentaire_${start}_${end}.pdf`;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Repli (contexte non sécurisé) : UUID v4 à partir de getRandomValues ou Math.random.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Type de repas proposé par défaut selon l'heure de saisie (modifiable dans le formulaire). */
export function suggestMealType(time: string): MealType {
  const [h, m] = time.split(':').map(Number);
  const minutes = h * 60 + m;
  if (minutes >= 5 * 60 && minutes < 10 * 60 + 30) return 'petit_dejeuner';
  if (minutes >= 11 * 60 && minutes < 14 * 60 + 30) return 'dejeuner';
  if (minutes >= 15 * 60 && minutes < 18 * 60) return 'collation';
  if (minutes >= 18 * 60 + 30 && minutes < 22 * 60 + 30) return 'diner';
  return 'autre';
}

/** Heure proposée quand on choisit un type de repas ; "autre" reprend l'heure actuelle. */
export function defaultTimeForType(type: MealType, now: () => string = nowTimeStr): string {
  switch (type) {
    case 'petit_dejeuner':
      return '07:00';
    case 'dejeuner':
      return '12:00';
    case 'collation':
      return '16:00';
    case 'diner':
      return '19:00';
    default:
      return now();
  }
}
