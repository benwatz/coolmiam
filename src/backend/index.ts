import type { Backend } from './types';

/** Charge le backend : Firebase, sauf en mode "e2e" (faux backend sans réseau, jamais utilisé en production). */
export async function loadBackend(): Promise<Backend> {
  if (import.meta.env.MODE === 'e2e') {
    return (await import('./fake')).createFakeBackend();
  }
  return (await import('./firebase')).createFirebaseBackend();
}
