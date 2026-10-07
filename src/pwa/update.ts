import { registerSW } from 'virtual:pwa-register';
import { useEffect, useState } from 'preact/hooks';
import { createUpdateStore, type UpdateState } from './updateStore';

const store = createUpdateStore();
let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null;

/** Délai entre deux vérifications tant que l'application reste ouverte. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Enregistre le service worker et vérifie la présence d'une nouvelle version : au lancement, à chaque
 * retour au premier plan (une PWA installée reste souvent ouverte en arrière-plan), au retour de la
 * connexion, puis périodiquement. La nouvelle version n'est activée qu'à la demande (Réglages).
 */
export function startAppUpdate() {
  if (!('serviceWorker' in navigator)) return;
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh: () => store.markAvailable(),
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      store.setSource(registration);
      void store.check();
    },
  });
  const check = () => void store.check();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  window.addEventListener('online', check);
  setInterval(() => {
    if (document.visibilityState === 'visible') check();
  }, CHECK_INTERVAL_MS);
}

export function checkForUpdate() {
  return store.check();
}

/** Active la version en attente et recharge la page (le brouillon du formulaire est conservé). */
export function reloadToUpdate() {
  return applyUpdate?.(true);
}

export function useUpdateState(): UpdateState {
  const [state, setState] = useState(store.getState);
  useEffect(() => {
    setState(store.getState());
    return store.subscribe(() => setState(store.getState()));
  }, []);
  return state;
}
