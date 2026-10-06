import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { loadBackend } from '../backend';
import type { AccessState, AuthUser, Backend } from '../backend/types';
import { createRepository } from '../db/repository';
import { SessionContext } from './session';

type Status =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'signed-out' }
  | { kind: 'signed-in'; user: AuthUser };

function Brand() {
  return (
    <div class="gate__brand">
      <img class="gate__logo" src={`${import.meta.env.BASE_URL}coolmiam-mark.svg`} alt="" width="72" height="72" />
      <h1>Coolmiam</h1>
    </div>
  );
}

function Screen({ children }: { children: ComponentChildren }) {
  return (
    <main class="gate">
      <Brand />
      {children}
    </main>
  );
}

/** Connexion Google puis accès réservé aux comptes approuvés (liste blanche gérée dans Firebase). */
export function AuthGate({ children }: { children: ComponentChildren }) {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [access, setAccess] = useState<AccessState>('checking');
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadBackend().then(
      (b) => !cancelled && setBackend(b),
      () => !cancelled && setStatus({ kind: 'error' }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!backend) return;
    return backend.auth.onUser((user) => {
      setAccess('checking');
      setStatus(user ? { kind: 'signed-in', user } : { kind: 'signed-out' });
    });
  }, [backend]);

  const uid = status.kind === 'signed-in' ? status.user.uid : null;
  useEffect(() => {
    if (!backend || status.kind !== 'signed-in') return;
    return backend.auth.watchAccess(status.user, setAccess);
  }, [backend, uid]);

  const repo = useMemo(() => (backend && uid ? createRepository(backend.createStore(uid)) : null), [backend, uid]);

  const signIn = async () => {
    setSignInError(null);
    try {
      await backend!.auth.signIn();
    } catch (error) {
      const code = (error as { code?: string }).code;
      // Fenêtre fermée par l'utilisateur : pas une erreur à afficher.
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setSignInError('La connexion a échoué. Réessayez.');
      }
    }
  };
  const signOut = () => backend!.auth.signOut();

  if (status.kind === 'loading') {
    return (
      <Screen>
        <p role="status">Chargement…</p>
      </Screen>
    );
  }
  if (status.kind === 'error') {
    return (
      <Screen>
        <p class="field__error" role="alert">
          Impossible de démarrer l'application. Vérifiez votre connexion puis rechargez la page.
        </p>
      </Screen>
    );
  }
  if (status.kind === 'signed-out') {
    return (
      <Screen>
        <p>Connectez-vous pour retrouver votre journal sur tous vos appareils.</p>
        <button type="button" class="btn btn--primary btn--block" onClick={() => void signIn()}>
          Se connecter avec Google
        </button>
        {signInError && (
          <p class="field__error" role="alert">
            {signInError}
          </p>
        )}
      </Screen>
    );
  }
  if (access === 'checking') {
    return (
      <Screen>
        <p role="status">Vérification de l'accès…</p>
      </Screen>
    );
  }
  if (access === 'pending') {
    return (
      <Screen>
        <div class="notice" role="status">
          <strong>Accès en attente d'approbation.</strong>
          <br />
          Une demande a été envoyée pour le compte {status.user.email}. Revenez plus tard : cet écran se met à jour
          dès que l'accès est accordé.
        </div>
        <button type="button" class="btn btn--block" onClick={() => void signOut()}>
          Se déconnecter
        </button>
      </Screen>
    );
  }
  return (
    <SessionContext.Provider key={status.user.uid} value={{ user: status.user, repo: repo!, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}
