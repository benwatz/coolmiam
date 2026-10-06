export const MEAL_TYPES = ['petit_dejeuner', 'dejeuner', 'collation', 'diner', 'autre'] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export interface Meal {
  id: string;
  /** Date locale de l'appareil, "YYYY-MM-DD". */
  date: string;
  /** Heure locale, "HH:mm". */
  time: string;
  type: MealType;
  description: string;
  notes: string;
  extra: boolean;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

/** Champs saisis dans le formulaire (sans les champs techniques). */
export type MealInput = Pick<Meal, 'date' | 'time' | 'type' | 'description' | 'notes' | 'extra'>;

export type TypeColors = Record<MealType, string>;

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  collation: 'Collation',
  diner: 'Dîner',
  autre: 'Autre',
};

export const DEFAULT_TYPE_COLORS: TypeColors = {
  petit_dejeuner: '#FFE9A8',
  dejeuner: '#BFE3C0',
  collation: '#D9C8F0',
  diner: '#B9D7F2',
  autre: '#E0E0E0',
};

/** Couleur du contour "Extra", non modifiable. */
export const EXTRA_COLOR = '#D32F2F';

export const DESCRIPTION_MAX = 1000;
export const NOTES_MAX = 1000;

export function isMealType(value: unknown): value is MealType {
  return typeof value === 'string' && (MEAL_TYPES as readonly string[]).includes(value);
}

/** Fusionne des couleurs stockées avec les valeurs par défaut (types manquants ou invalides). */
export function normalizeTypeColors(stored: unknown): TypeColors {
  const result: TypeColors = { ...DEFAULT_TYPE_COLORS };
  if (stored && typeof stored === 'object') {
    for (const type of MEAL_TYPES) {
      const value = (stored as Record<string, unknown>)[type];
      if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
        result[type] = value.toUpperCase();
      }
    }
  }
  return result;
}
