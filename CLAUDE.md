# Coolmiam - Journal alimentaire (PWA)

Spécification d'origine : `docs/specification.md` (version 1.1 du 06/10/2026). La relire avant
toute évolution fonctionnelle. Dépôt Git = seule source de vérité partagée entre les machines.

## Pile et commandes

Vite + TypeScript + Preact, Firebase (Firestore + Authentication Google), vite-plugin-pwa, jsPDF. Voir `README.md` pour les
commandes (`npm test`, `npm run test:e2e`, `npm run build`).

## Décisions de conception

- **Preact plutôt que React** (la spec autorisait les deux) : bundle plus léger. Pas de
  `preact/compat` : le hook `useLiveQuery` (`src/db/useLiveQuery.ts`) s'abonne aux méthodes
  `repo.watch…` (écoutes Firestore `onSnapshot`).
- **Firebase remplace IndexedDB/Dexie** (octobre 2026, la spec d'origine disait "local uniquement" :
  ses sections stockage et confidentialité sont caduques). `Store` (`src/backend/types.ts`) est
  l'interface de stockage ; `createRepository(store)` porte la logique métier. Implémentations :
  Firestore (`firebase.ts`, cache persistant multi-onglets), mémoire (`memory.ts`, tests unitaires)
  et faux backend E2E (`fake.ts`, chargé seulement en mode `e2e`, absent du build de production).
- **Écritures Firestore non attendues** : `putMeal`/`deleteMeal`/`setSetting` ne font pas `await`
  sur `setDoc`/`deleteDoc` (hors ligne, ces promesses ne se résolvent qu'à la reconnexion) ; l'écriture
  locale est visible immédiatement par les écoutes. Les erreurs serveur sont seulement journalisées.
- **Accès sur liste blanche** : `AuthGate` (connexion Google par popup) puis lecture de
  `allowedUsers/{uid}` ; sinon écran "Accès en attente" et demande dans `accessRequests/{uid}`.
  Règles dans `firestore.rules` (publiées à la main dans la console Firebase). Un document absent du
  cache local n'est pas une réponse (`metadata.fromCache`) : on reste en "Vérification".
- **Pas de migration** des anciens repas IndexedDB (saisis avant octobre 2026) : ils restent dans le
  navigateur mais ne sont plus lus.
- **Couleurs non stockées par repas** : table `settings`, clé `typeColors`, normalisée par
  `normalizeTypeColors()` (types manquants ou valeurs invalides retombent sur les défauts).
- **Couleur du texte** : `textColorFor()` choisit noir ou blanc selon le meilleur contraste WCAG ;
  l'une des deux atteint toujours au moins 4,58:1 (test exhaustif par échantillonnage).
- **Mise en page PDF séparée du rendu** : `src/pdf/layout.ts` (pur, testé) calcule les positions ;
  `src/pdf/render.ts` dessine avec jsPDF. Règles : bloc repas jamais coupé, titre de jour toujours
  avec son premier élément, l'en-tête de la première page compte comme haut de page.
- **Polices PDF** : Roboto Regular/Bold/Italic (`src/pdf/fonts/`, copiées depuis le paquet
  `@expo-google-fonts/roboto`), chargées par `fetch()` au moment de l'export puis précachées par
  le service worker (export hors ligne). jsPDF est importé dynamiquement (chargé seulement à
  l'export). Les modules optionnels de jsPDF (html2canvas, dompurify, canvg) sont exclus du
  précache (`globIgnores` dans `vite.config.ts`).
- **Brouillon du formulaire** : enregistré à chaque modification dans `localStorage`
  (`coolmiam.formDraft`) et restauré au lancement, pour ne pas perdre la saisie si le système tue
  l'application en arrière-plan. Effacé à l'enregistrement, l'annulation ou la suppression.
- **Type proposé par défaut** à la création selon l'heure (`suggestMealType()`), modifiable. Ajout
  non prévu par la spec.
- **Après enregistrement**, le Journal se positionne sur la date du repas (utile quand la date a
  été modifiée).
- **Confirmation de suppression** : boîte de dialogue intégrée (`ConfirmDialog`) plutôt que
  `window.confirm()`, plus fiable en mode standalone iOS.
- **Bandeau de date** : champ `<input type="date">` natif transparent superposé au libellé de la
  date (un appui ouvre le sélecteur du système, y compris sur iOS sans `showPicker()`). Sur écran
  de 360 px, la date longue passe sur deux lignes plutôt que d'être tronquée.
- **Pièges CSS** : `.field label` (padding/marge nuls) s'applique aussi aux pastilles de type
  (labels dans un fieldset `.field`) ; d'où les sélecteurs renforcés `.type-picker .type-option`.

## Déploiement

GitHub Pages via `.github/workflows/deploy.yml` (tests unitaires + E2E, build avec
`BASE_PATH=/<dépôt>/`, publication). Réglage requis une fois : Settings > Pages > Source :
GitHub Actions.

## Hors périmètre v1 / pistes

Export/import JSON de sauvegarde (recommandé, stockage local seul), duplication d'un repas,
repas favoris, page d'administration des accès. Pas de calories, photos, statistiques.

## Design

Référence visuelle : `docs/design/design-system.md` (jetons, logo, changements demandés). La relire avant toute modification d'interface. Logos sources : `docs/design/logo/`. Le thème sombre est une proposition non validée.
