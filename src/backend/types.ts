import type { Meal } from '../domain/types';

export type Unsubscribe = () => void;

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

/** checking : réponse du serveur pas encore reçue ; pending : compte connecté mais non approuvé. */
export type AccessState = 'checking' | 'allowed' | 'pending';

export interface AuthService {
  /** Appelé une première fois avec l'état courant (null = déconnecté), puis à chaque changement. */
  onUser(callback: (user: AuthUser | null) => void): Unsubscribe;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  /** Suit l'approbation du compte (liste blanche) ; signale une demande d'accès si le compte n'est pas approuvé. */
  watchAccess(user: AuthUser, callback: (state: AccessState) => void): Unsubscribe;
}

/** Stockage des données d'un utilisateur : repas et réglages. */
export interface Store {
  /** Repas dont la date est comprise entre start et end (bornes incluses), dans un ordre quelconque. */
  watchMeals(start: string, end: string, callback: (meals: Meal[]) => void): Unsubscribe;
  getMeals(start: string, end: string): Promise<Meal[]>;
  getMeal(id: string): Promise<Meal | undefined>;
  /** Résout dès que l'écriture est prise en compte localement (sans attendre le serveur, hors ligne). */
  putMeal(meal: Meal): Promise<void>;
  deleteMeal(id: string): Promise<void>;
  watchSetting(key: string, callback: (value: unknown) => void): Unsubscribe;
  setSetting(key: string, value: unknown): Promise<void>;
}

export interface Backend {
  auth: AuthService;
  createStore(uid: string): Store;
}
