import { useState } from 'preact/hooks';
import { useSession } from '../../auth/session';
import type { AccessRequest } from '../../backend/types';
import { useLiveQuery } from '../../db/useLiveQuery';

function formatRequestDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Identity({ item }: { item: AccessRequest }) {
  return (
    <div class="admin-item__identity">
      <strong>{item.name || item.email || item.uid}</strong>
      {item.name && item.email && <span>{item.email}</span>}
      {item.requestedAt && <span>Demande du {formatRequestDate(item.requestedAt)}</span>}
    </div>
  );
}

/** Validation des demandes d'accès ; affiché seulement aux administrateurs (documents admins/{uid}). */
export function AdminPanel() {
  const { admin, user } = useSession();
  const items = useLiveQuery<AccessRequest[]>((cb) => admin.watchAccessList(cb), [admin]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (uid: string, action: () => Promise<void>) => {
    setBusy(uid);
    setError(null);
    try {
      await action();
    } catch {
      setError("L'action a échoué. Vérifiez votre connexion et vos droits, puis réessayez.");
    } finally {
      setBusy(null);
    }
  };

  const pending = (items ?? []).filter((i) => !i.approved).sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''));
  const approved = (items ?? []).filter((i) => i.approved).sort((a, b) => (a.email || a.uid).localeCompare(b.email || b.uid));

  return (
    <section aria-labelledby="admin-title" data-testid="admin-panel">
      <h3 id="admin-title" class="section-title">
        Administration des accès
      </h3>
      {error && (
        <p class="field__error" role="alert">
          {error}
        </p>
      )}
      {items === undefined ? (
        <p role="status">Chargement…</p>
      ) : (
        <>
          <h4 class="admin-subtitle">Demandes en attente ({pending.length})</h4>
          {pending.length === 0 ? (
            <p class="admin-empty">Aucune demande en attente.</p>
          ) : (
            <ul class="admin-list">
              {pending.map((item) => (
                <li key={item.uid} class="admin-item" data-testid="admin-pending">
                  <Identity item={item} />
                  <div class="admin-item__actions">
                    <button
                      type="button"
                      class="btn btn--primary btn--small"
                      disabled={busy === item.uid}
                      aria-label={`Approuver ${item.email || item.name || item.uid}`}
                      onClick={() => void run(item.uid, () => admin.approve(item))}
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      class="btn btn--small"
                      disabled={busy === item.uid}
                      aria-label={`Refuser ${item.email || item.name || item.uid}`}
                      onClick={() => void run(item.uid, () => admin.reject(item.uid))}
                    >
                      Refuser
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h4 class="admin-subtitle">Comptes approuvés ({approved.length})</h4>
          {approved.length === 0 ? (
            <p class="admin-empty">Aucun compte approuvé.</p>
          ) : (
            <ul class="admin-list">
              {approved.map((item) => (
                <li key={item.uid} class="admin-item" data-testid="admin-approved">
                  <Identity item={item} />
                  <div class="admin-item__actions">
                    {item.uid === user.uid ? (
                      <span class="admin-self">Vous</span>
                    ) : (
                      <button
                        type="button"
                        class="btn btn--danger btn--small"
                        disabled={busy === item.uid}
                        aria-label={`Révoquer ${item.email || item.name || item.uid}`}
                        onClick={() => void run(item.uid, () => admin.revoke(item.uid))}
                      >
                        Révoquer
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
