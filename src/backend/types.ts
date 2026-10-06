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

/** Un compte ayant demandé l'accès (ou déjà approuvé). */
export interface AccessRequest {
  uid: string;
  email: string;
  name: string;
  /** Date ISO de la demande, absente tant que le serveur ne l'a pas horodatée. */
  requestedAt: string | null;
  approved: boolean;
}

/** Gestion de la liste blanche, réservée aux administrateurs (documents admins/{uid}). */
export interface AdminService {
  watchIsAdmin(uid: string, callback: (isAdmin: boolean) => void): Unsubscribe;
  watchAccessList(callback: (items: AccessRequest[]) => void): Unsubscribe;
  approve(request: AccessRequest): Promise<void>;
  /** Retire l'accès d'un compte approuvé (ses données sont conservées mais redeviennent illisibles). */
  revoke(uid: string): Promise<void>;
  /** Supprime une demande en attente ; elle réapparaît si le compte se reconnecte. */
  reject(uid: string): Promise<void>;
}

export interface Backend {
  auth: AuthService;
  admin: AdminService;
  createStore(uid: string): Store;
}
