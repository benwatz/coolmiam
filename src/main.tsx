import { render } from 'preact';
import { App } from './App';
import { AuthGate } from './auth/AuthGate';
import './styles.css';

/** Demande de stockage persistant au premier lancement (limite le risque d'effacement). */
async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // Non pris en charge : sans conséquence sur le fonctionnement.
  }
}

/**
 * Une page restée ouverte pendant un déploiement garde l'ancien code, dont les modules chargés à la
 * demande (export PDF) n'existent plus. Quand une nouvelle version du service worker prend le
 * contrôle, on recharge donc la page pour repartir sur le code à jour (le brouillon est conservé).
 */
function reloadOnAppUpdate() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

void requestPersistence();
reloadOnAppUpdate();
render(
  <AuthGate>
    <App />
  </AuthGate>,
  document.getElementById('app')!,
);
