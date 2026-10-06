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

void requestPersistence();
render(
  <AuthGate>
    <App />
  </AuthGate>,
  document.getElementById('app')!,
);
