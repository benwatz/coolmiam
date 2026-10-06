import { createMemoryStore } from './memory';
import type { AccessRequest, AdminService, AuthService, AuthUser, Backend } from './types';

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

// Administrateur si localStorage["coolmiam.fakeAdmin"] = "1" ; deux demandes factices en attente.
function createAdmin(): AdminService {
  let items: AccessRequest[] = [
    { uid: 'u-alice', email: 'alice@example.com', name: 'Alice', requestedAt: '2026-10-05T09:00:00.000Z', approved: false },
    { uid: 'u-bob', email: 'bob@example.com', name: 'Bob', requestedAt: '2026-10-04T09:00:00.000Z', approved: true },
  ];
  const listeners = new Set<() => void>();
  const change = (next: AccessRequest[]) => {
    items = next;
    listeners.forEach((l) => l());
  };
  return {
    watchAdminStatus: (_uid, callback) => (
      callback({ isAdmin: localStorage.getItem('coolmiam.fakeAdmin') === '1', error: null }), () => {}
    ),
    watchAccessList(callback) {
      const emit = () => callback([...items]);
      listeners.add(emit);
      emit();
      return () => listeners.delete(emit);
    },
    approve: async (r) => change(items.map((i) => (i.uid === r.uid ? { ...i, approved: true } : i))),
    revoke: async (uid) => change(items.map((i) => (i.uid === uid ? { ...i, approved: false } : i))),
    reject: async (uid) => change(items.filter((i) => i.uid !== uid)),
  };
}

export function createFakeBackend(): Backend {
  return { auth: createAuth(), admin: createAdmin(), createStore: () => createMemoryStore(DATA_KEY) };
}
