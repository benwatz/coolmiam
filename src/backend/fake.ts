import { createMemoryStore } from './memory';
import type { AuthService, AuthUser, Backend } from './types';

// Faux backend des tests E2E (build en mode "e2e", voir vite.config.ts) : aucun appel réseau.
// L'état de connexion se règle par localStorage["coolmiam.fakeAuth"] : "out" ou "pending" ; sinon connecté et approuvé.
const USER: AuthUser = { uid: 'e2e-user', email: 'test@example.com', name: 'Test' };
const AUTH_KEY = 'coolmiam.fakeAuth';
const DATA_KEY = 'coolmiam.fakeData';

function createAuth(): AuthService {
  const listeners = new Set<(user: AuthUser | null) => void>();
  const current = () => (localStorage.getItem(AUTH_KEY) === 'out' ? null : USER);
  const emit = () => listeners.forEach((l) => l(current()));
  return {
    onUser(callback) {
      listeners.add(callback);
      callback(current());
      return () => listeners.delete(callback);
    },
    async signIn() {
      localStorage.removeItem(AUTH_KEY);
      emit();
    },
    async signOut() {
      localStorage.setItem(AUTH_KEY, 'out');
      emit();
    },
    watchAccess(_user, callback) {
      callback(localStorage.getItem(AUTH_KEY) === 'pending' ? 'pending' : 'allowed');
      return () => {};
    },
  };
}

export function createFakeBackend(): Backend {
  return { auth: createAuth(), createStore: () => createMemoryStore(DATA_KEY) };
}
