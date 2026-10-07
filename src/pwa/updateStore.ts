/** État de la mise à jour de l'application (service worker) : logique pure, testée unitairement. */
export interface UpdateState {
  /** Une nouvelle version est installée et attend le rechargement. */
  available: boolean;
  checking: boolean;
  /** Dernière vérification réussie (ms depuis 1970), null tant qu'aucune n'a abouti. */
  checkedAt: number | null;
  /** La dernière vérification a échoué (hors ligne, serveur injoignable). */
  failed: boolean;
}

/** Sous-ensemble de ServiceWorkerRegistration nécessaire à la vérification. */
export interface UpdateSource {
  update(): Promise<unknown>;
  installing?: { state: string; addEventListener(type: 'statechange', cb: () => void): void } | null;
}

const INSTALL_WAIT_MS = 60_000;

/** Attend la fin d'installation d'une version en cours de téléchargement (ou le délai maximal). */
function waitForInstall(worker: NonNullable<UpdateSource['installing']>): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, INSTALL_WAIT_MS);
    const check = () => {
      if (worker.state === 'installed' || worker.state === 'redundant' || worker.state === 'activated') done();
    };
    worker.addEventListener('statechange', check);
    check();
  });
}

export function createUpdateStore() {
  let state: UpdateState = { available: false, checking: false, checkedAt: null, failed: false };
  let source: UpdateSource | null = null;
  const listeners = new Set<() => void>();

  const set = (patch: Partial<UpdateState>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    setSource(next: UpdateSource) {
      source = next;
    },
    markAvailable() {
      set({ available: true });
    },
    /** Cherche une nouvelle version ; sans effet si une vérification est déjà en cours. */
    async check() {
      if (!source || state.checking) return;
      set({ checking: true, failed: false });
      try {
        await source.update();
        if (source.installing) await waitForInstall(source.installing);
        // Laisse l'événement "waiting" du service worker arriver avant d'annoncer "à jour".
        await new Promise((r) => setTimeout(r, 0));
        set({ checking: false, checkedAt: Date.now() });
      } catch {
        set({ checking: false, failed: true });
      }
    },
  };
}
