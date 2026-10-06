# Coolmiam

Journal alimentaire personnel sous forme d'application web progressive (PWA), installable sur
Android et iPhone. Saisie de plusieurs repas par jour, couleur par type de repas, marquage
"Extra", export PDF A4 partageable.

Connexion par compte Google (accès sur liste blanche) ; les repas sont enregistrés dans Firestore,
dans un espace privé par utilisateur, et mis en cache sur l'appareil pour fonctionner hors ligne.
Pas de télémétrie. Rien d'autre ne sort de l'appareil, sauf lorsque l'utilisateur partage
lui-même un PDF.

## Pile technique

| Élément | Choix |
|---|---|
| Build | Vite + TypeScript |
| Interface | Preact, CSS simple (variables CSS) |
| Données et connexion | Firebase : Firestore (cache hors ligne) + Authentication (Google) |
| PWA | vite-plugin-pwa (manifeste + service worker, précache complet) |
| PDF | jsPDF (vectoriel, texte sélectionnable) + police Roboto intégrée (accents) |
| Tests | Vitest (unitaires), Playwright (E2E, émulation Pixel 7) |

## Prérequis

- Node.js 22 ou supérieur, npm 10 ou supérieur.

## Commandes

```bash
npm install          # installation des dépendances
npm run dev          # serveur de développement (http://localhost:5173)
npm test             # tests unitaires (Vitest)
npm run test:e2e     # tests E2E (Playwright : build + preview automatiques)
npm run build        # contrôle TypeScript + build de production dans dist/
npm run preview      # sert dist/ sur http://localhost:4173
npm run icons        # régénère les icônes PNG depuis public/favicon.svg
```

Première exécution des tests E2E sur une nouvelle machine : `npx playwright install chromium`.
Pour utiliser un Chromium déjà installé : variable d'environnement `PW_CHROMIUM=<chemin>`.

## Structure

```
src/
  backend/        Firebase (firebase.ts), stockage mémoire (tests), faux backend E2E
  auth/           écran de connexion / accès en attente (AuthGate), session
  db/             accès aux données (repository), hook useLiveQuery
  domain/         types, libellés, couleurs par défaut, dates, validation, contraste
  features/
    journal/      écran Journal, bandeau de date
    meal-form/    formulaire d'ajout / modification, brouillon
    export/       écran Export, partage (Web Share API)
    settings/     écran Réglages (couleurs)
  pdf/            mise en page (layout.ts, testable), rendu jsPDF, polices Roboto
  ui/             composants partagés (carte repas, onglets, dialogue, icônes)
public/           icônes et favicon
tests/unit/       tests Vitest
tests/e2e/        tests Playwright
```

## Firebase (projet `coolmiam`)

- Données : `users/{uid}/meals/{id}` et `users/{uid}/settings/typeColors`.
- Accès : liste blanche. Règles dans `firestore.rules` (à publier dans la console : Firestore
  Database > Règles). Un compte approuvé a un document `allowedUsers/{uid}`, créé à la main dans la
  console. Un compte inconnu qui se connecte écrit une demande dans `accessRequests/{uid}` (email,
  nom) : copier son UID vers `allowedUsers` pour l'approuver (le document peut être vide).
- Authentication > Settings > Domaines autorisés : `localhost` et le domaine GitHub Pages.
- Les tests E2E utilisent un faux backend (build `--mode e2e`, `npm run build:e2e`), sans réseau.

## Déploiement statique en HTTPS (GitHub Pages)

Le HTTPS est obligatoire pour l'installation PWA et la Web Share API. GitHub Pages le fournit.

1. Pousser le dépôt sur GitHub (branche `main`).
2. Dans le dépôt : **Settings > Pages > Build and deployment > Source : GitHub Actions**.
3. Chaque push sur `main` lance `.github/workflows/deploy.yml` : tests unitaires, tests E2E,
   build avec `BASE_PATH=/<nom-du-dépôt>/`, puis publication.
4. L'application est servie à `https://<compte>.github.io/<nom-du-dépôt>/`.

Pour un autre hébergeur statique (Netlify, Cloudflare Pages...) : `npm run build`, puis publier le
dossier `dist/`. Variable `BASE_PATH` à renseigner seulement si l'application est servie dans un
sous-dossier (par défaut `/`).

Après une mise à jour, le service worker se met à jour automatiquement au lancement suivant.

## Installation sur l'écran d'accueil

**Android (Chrome)**
1. Ouvrir l'URL de l'application dans Chrome.
2. Menu (trois points) > **Ajouter à l'écran d'accueil** (ou **Installer l'application**).
3. Lancer Coolmiam depuis l'icône : l'application s'ouvre en plein écran.

**iPhone (Safari)**
1. Ouvrir l'URL dans **Safari** (obligatoire : les autres navigateurs iOS ne proposent pas toujours l'option).
2. Bouton **Partager** > **Sur l'écran d'accueil** > **Ajouter**.
3. Lancer Coolmiam depuis l'icône.

Ouvrir l'application une première fois avec du réseau : elle fonctionne ensuite en mode avion.

## Points d'attention

- **Partage de fichier** : la Web Share API avec fichiers n'est pas disponible partout. Si elle
  manque, l'écran Export propose le téléchargement ("Enregistrer / ouvrir") avec un message
  explicite. Le partage vers une messagerie doit être testé sur appareil réel (Android et iPhone).
- **Persistance** : l'application demande un stockage persistant (`navigator.storage.persist()`)
  au lancement. Cela réduit le risque d'effacement sans l'annuler : réinitialiser le navigateur ou
  changer de téléphone fait perdre les données (pas de sauvegarde en version 1).
- **Couleurs** : stockées par type et non par repas ; un PDF reflète les couleurs en vigueur au
  moment de l'export.

## Tests manuels obligatoires (appareils réels)

- Feuille de partage avec le PDF et envoi par messagerie électronique : Android (Chrome),
  iPhone (Safari et application installée).
- Impression réelle ou aperçu A4 du PDF, en couleur et en noir et blanc.

## Licences

Police Roboto : SIL Open Font License 1.1 (`src/pdf/fonts/LICENSE-Roboto.txt`).
