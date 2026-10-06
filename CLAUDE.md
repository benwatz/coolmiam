# Coolmiam - Journal alimentaire (PWA)

Spécification d'origine : `docs/specification.md` (version 1.1 du 06/10/2026). La relire avant
toute évolution fonctionnelle. Dépôt Git = seule source de vérité partagée entre les machines.

## Pile et commandes

Vite + TypeScript + Preact, Dexie (IndexedDB), vite-plugin-pwa, jsPDF. Voir `README.md` pour les
commandes (`npm test`, `npm run test:e2e`, `npm run build`).

## Décisions de conception

- **Preact plutôt que React** (la spec autorisait les deux) : bundle plus léger. Pas de
  `preact/compat` : le hook `useLiveQuery` (`src/db/useLiveQuery.ts`) remplace
  `dexie-react-hooks` en s'abonnant directement à `liveQuery()` de Dexie.
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
repas favoris. Pas de comptes, synchronisation, calories, photos, statistiques.
