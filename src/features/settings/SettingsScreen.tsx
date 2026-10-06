import { useEffect, useState } from 'preact/hooks';
import { useSession } from '../../auth/session';
import { useLiveQuery } from '../../db/useLiveQuery';
import { textColorFor } from '../../domain/contrast';
import type { AdminStatus } from '../../backend/types';
import { AdminPanel } from './AdminPanel';
import { DEFAULT_TYPE_COLORS, MEAL_TYPES, MEAL_TYPE_LABELS, type MealType, type TypeColors } from '../../domain/types';

interface Props {
  colors: TypeColors;
}

export function SettingsScreen({ colors }: Props) {
  const { repo, admin, user, signOut } = useSession();
  const adminStatus = useLiveQuery<AdminStatus>((cb) => admin.watchAdminStatus(user.uid, cb), [admin, user.uid]);
  const isAdmin = adminStatus?.isAdmin === true;
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  const setColor = (type: MealType, value: string) => {
    void repo.setTypeColors({ ...colors, [type]: value });
  };

  const isDefault = MEAL_TYPES.every((t) => colors[t].toUpperCase() === DEFAULT_TYPE_COLORS[t].toUpperCase());

  return (
    <section class="screen" aria-labelledby="settings-title">
      <div class="screen__scroll">
        <h2 id="settings-title" class="screen__title">
          Réglages
        </h2>

        <h3 class="section-title">Couleurs des types de repas</h3>
        <ul class="color-list">
          {MEAL_TYPES.map((type) => {
            const bg = colors[type];
            return (
              <li key={type} class="color-row">
                <span class="color-row__preview" style={{ backgroundColor: bg, color: textColorFor(bg) }}>
                  {MEAL_TYPE_LABELS[type]}
                </span>
                <input
                  type="color"
                  class="color-row__input"
                  aria-label={`Couleur ${MEAL_TYPE_LABELS[type]}`}
                  data-testid={`color-${type}`}
                  value={bg.toLowerCase()}
                  onInput={(e) => setColor(type, e.currentTarget.value)}
                />
              </li>
            );
          })}
        </ul>
        <button type="button" class="btn btn--block" disabled={isDefault} onClick={() => void repo.resetTypeColors()}>
          Rétablir les couleurs par défaut
        </button>

        <h3 class="section-title">Compte</h3>
        <p data-testid="account-email">Connecté en tant que {user.email}</p>
        <button type="button" class="btn btn--block" onClick={() => void signOut()}>
          Se déconnecter
        </button>

        {isAdmin && <AdminPanel />}

        <h3 class="section-title">Informations</h3>
        <dl class="info-list">
          <dt>Version</dt>
          <dd data-testid="app-version">{__APP_VERSION__}</dd>
          <dt>Données</dt>
          <dd>
            Vos repas sont enregistrés dans votre espace privé Firebase (Google), lié à votre compte, et conservés sur
            cet appareil pour fonctionner hors ligne. Rien d'autre n'est transmis, sauf lorsque vous partagez vous-même
            un PDF.
          </dd>
          {persisted !== null && (
            <>
              <dt>Stockage persistant</dt>
              <dd>
                {persisted
                  ? 'Activé : le navigateur ne doit pas effacer les données automatiquement.'
                  : "Non accordé par le navigateur : les données pourraient être effacées en cas de manque d'espace."}
              </dd>
            </>
          )}
        </dl>
      </div>
    </section>
  );
}
