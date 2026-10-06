import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { AdminService, AuthUser } from '../backend/types';
import type { Repository } from '../db/repository';

export interface Session {
  user: AuthUser;
  repo: Repository;
  admin: AdminService;
  signOut: () => Promise<void>;
}

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('Session absente : composant utilisé hors de AuthGate.');
  return session;
}

/** Accès aux données de l'utilisateur connecté. */
export function useRepo(): Repository {
  return useSession().repo;
}
