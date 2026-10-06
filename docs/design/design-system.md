# Design system Coolmiam - passation pour l'implémentation

Source : design system Coolmiam (artefact Claude, 06/10/2026). Ce document est la référence visuelle pour toute modification d'interface. Il ne modifie aucun comportement fonctionnel défini dans `docs/specification.md`.

## Principes

- Interface calme, lisible, sans décoration superflue ; zones tactiles d'au moins 44px.
- Le vert `brand` porte l'identité (en-tête, bouton principal, bouton d'ajout, onglet actif). Le jaune `sun` est réservé au logo et ne porte jamais de texte ni d'information.
- Le type de repas se distingue par la teinte, mais le libellé du type reste toujours écrit. Un repas extra est signalé par le contour et le mot "EXTRA", jamais par la couleur seule.
- Aucun émoji. Icônes SVG en trait (24px, contour 2px, `currentColor`) déjà présentes dans `src/ui/icons.tsx`.
- Texte en français, apostrophes droites, ton direct et factuel.

## Jetons de couleur

| Jeton | Clair | Sombre | Usage |
| --- | --- | --- | --- |
| `bg` | #FFFBF2 | #14201A | Fond de page de l'application, derrière les écrans Journal, Export et Réglages. |
| `surface` | #FFFFFF | #1D2B24 | Bandeau de date, barre d'onglets, champs, boîtes de dialogue et cartes de résultat. Texte `ink` et `ink-muted` dessus. |
| `brand-soft` | #E8F3EE | #243A2F | Fond des encadrés d'information (`.notice`). Texte `ink` dessus. |
| `ink` | #1F2421 | #F2EFE6 | Texte principal sur `bg`, `surface` et `brand-soft`. |
| `ink-muted` | #4F5A54 | #B3C0B8 | Texte secondaire (aides, compteurs, libellés d'onglets inactifs) sur `bg` et `surface`. |
| `brand` | #2E7D5B | #6CCB9C | Vert Coolmiam : en-tête, boutons principaux, bouton d'ajout, onglet actif. Texte `on-brand` dessus ; en texte ou icône sur `bg` et `surface`. |
| `on-brand` | #FFFFFF | #0E2519 | Texte et icônes posées sur `brand`. |
| `sun` | #F6B73C | #F6B73C | Jaune soleil du logo et touches décoratives (anneau de l'assiette). Jamais pour du texte ni comme seul porteur de sens. |
| `border` | #CFD6D1 | #33453B | Filets décoratifs entre zones (bandeau de date, barre d'onglets). Ne suffit pas pour délimiter un champ : utiliser `border-strong`. |
| `border-strong` | #7A8780 | #7F9188 | Contour des champs, boutons secondaires et sélecteurs (au moins 3:1 sur `bg` et `surface`). |
| `danger` | #C62828 | #FF8A80 | Actions destructives, messages d'erreur. Texte `on-danger` sur fond `danger`. |
| `on-danger` | #FFFFFF | #2B0A0A | Texte posé sur un fond `danger`. |
| `extra` | #D32F2F | #FF8A80 | Contour et pastille EXTRA des repas hors cadre. Valeur fixe de la spécification, non modifiable par l'utilisateur. |
| `focus` | #1565C0 | #8AB4F8 | Anneau de focus de 3px, visible sur `bg` et `surface`. |
| `meal-breakfast` | #FFE9A8 | #FFE9A8 | Fond par défaut des repas de type Petit-déjeuner (modifiable dans Réglages). Texte `on-meal`. |
| `meal-lunch` | #BFE3C0 | #BFE3C0 | Fond par défaut des repas de type Déjeuner. Texte `on-meal`. |
| `meal-snack` | #D9C8F0 | #D9C8F0 | Fond par défaut des repas de type Collation. Texte `on-meal`. |
| `meal-dinner` | #B9D7F2 | #B9D7F2 | Fond par défaut des repas de type Dîner. Texte `on-meal`. |
| `meal-other` | #E0E0E0 | #E0E0E0 | Fond par défaut des repas de type Autre. Texte `on-meal`. |
| `on-meal` | #000000 | #000000 | Texte sur les fonds de repas par défaut (noir ou blanc selon le meilleur contraste, calculé par l'application pour les couleurs personnalisées). |

Correspondance avec les variables CSS actuelles de `src/styles.css` : `--bg` = `bg`, `--surface` = `surface`, `--text` = `ink`, `--text-muted` = `ink-muted`, `--primary` = `brand`, `--primary-text` = `on-brand`, `--border` = `border`, `--danger` = `danger`, `--extra` = `extra`, `--focus` = `focus`. Les couleurs de repas restent gérées par `DEFAULT_TYPE_COLORS` dans `src/domain/types.ts` (valeurs identiques aux jetons `meal-*`).

Nouveaux jetons à ajouter : `--border-strong`, `--brand-soft`, `--sun`, `--on-danger`.

## Typographie

Police système (aucune police à télécharger, application utilisable hors ligne) : `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.

| Style | Taille / interligne | Graisse | Usage |
| --- | --- | --- | --- |
| `app-title` | 20px / 28px | 700 | Nom de l'application dans l'en-tête vert. |
| `screen-title` | 21px / 29px | 700 | Titre d'un écran (Export, Réglages, formulaire). |
| `section-title` | 17px / 24px | 700 | Titre de section dans un écran. |
| `body` | 16px / 22px | 400 | Texte courant, description des repas. |
| `label` | 16px / 22px | 600 | Libellés de champs, boutons, type et heure des repas. |
| `small` | 14px / 20px | 400 | Messages d'erreur, aides. |
| `caption` | 13px / 18px | 600 | Libellés de la barre d'onglets, compteurs, pastille EXTRA. |

## Espacements

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `space-1` | 4px | Écart minimal entre icône et libellé. |
| `space-2` | 8px | Écart entre pastilles, padding vertical du bandeau. |
| `space-3` | 12px | Écart entre cartes de repas, padding des cartes. |
| `space-4` | 16px | Marge latérale des écrans, écart standard. |
| `space-5` | 24px | Écart entre sections. |
| `space-6` | 32px | Grand espacement vertical, états vides. |

## Rayons

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `radius-sm` | 6px | Pastille EXTRA, focus du sélecteur de date. |
| `radius-input` | 10px | Champs de saisie, aperçu de couleur. |
| `radius-md` | 12px | Boutons, cartes de repas, blocs de résultat. |
| `radius-lg` | 16px | Boîtes de dialogue. |
| `radius-pill` | 999px | Pastilles de type de repas, bouton d'ajout rond. |

## Ombres

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `shadow-card` | 0 1px 3px rgba(0, 0, 0, 0.12) | Cartes de repas. |
| `shadow-fab` | 0 4px 12px rgba(0, 0, 0, 0.25) | Bouton d'ajout flottant. |

## Logo

Assiette (disque crème, anneau jaune) portant des lunettes de soleil et un sourire.

- `docs/design/logo/coolmiam-icon.svg` : fond vert à coins arrondis. Sert de `public/favicon.svg` et de source pour les icônes PWA (192, 512, maskable 512, apple-touch-icon).
- `docs/design/logo/coolmiam-mark.svg` : assiette seule avec contour vert, pour l'en-tête et les fonds clairs.
- Marge de protection : un quart de la largeur. Taille minimale : 24px. Ne pas déformer, recolorier ni ajouter de texte dans l'image.
- Le nom "Coolmiam" s'écrit en texte (`app-title`) à côté de la marque, jamais dans l'image.
- Les SVG sont multicolores : les afficher par `<img>`, pas en ligne avec `currentColor`.
- Version maskable : la source doit occuper tout le cadre. Générer le fond vert en pleine page et placer l'assiette dans la zone de sécurité centrale (80 % du cadre).

## Changements demandés (périmètre de l'implémentation)

1. Ajouter les nouveaux jetons dans `:root` de `src/styles.css` et les utiliser : contour des champs, des boutons secondaires et des pastilles de type en `--border-strong` (contraste d'au moins 3:1) ; `.notice` en `--brand-soft` ; texte du bouton danger en `--on-danger`. `--border` reste réservé aux filets décoratifs.
2. En-tête (`.app-header`) : afficher `coolmiam-mark.svg` (28 à 32px, `alt=""`) devant le titre "Coolmiam". Fond vert et texte `on-brand` inchangés.
3. Remplacer le logo : `public/favicon.svg` est déjà remplacé ; adapter `scripts/generate-icons.mjs` pour produire `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` et `apple-touch-icon.png` à partir de `docs/design/logo/coolmiam-icon.svg`.
4. Vérifier `theme_color` et `background_color` du manifeste PWA dans `vite.config.ts` : `#2E7D5B` et `#FFFBF2`.
5. Thème sombre : proposition non validée, à n'implémenter qu'après confirmation de Ben (`@media (prefers-color-scheme: dark)`, `color-scheme: light dark`, valeurs de la colonne Sombre). Les couleurs de repas et `on-meal` restent identiques dans les deux thèmes.

## Contraintes

- Ne modifier ni la logique métier, ni la base de données, ni la mise en page PDF.
- Conserver les `data-testid`, les `aria-*` et les sélecteurs renforcés `.type-picker .type-option` (voir `CLAUDE.md`).
- Contraste d'au moins 4,5:1 pour le texte et 3:1 pour les contours, les icônes et l'anneau de focus.
- Avant de conclure : `npm test`, `npm run test:e2e`, `npm run build`, puis contrôle visuel sur écran de 360px.
