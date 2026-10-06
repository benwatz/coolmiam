# Spécification - PWA "Coolmiam" (journal alimentaire)

Document destiné à Claude Code. Version 1.1 - 06/10/2026.

> **Mise à jour 06/10/2026 :** le stockage local (IndexedDB/Dexie, sans compte) est remplacé par Firebase
> (Firestore + connexion Google, accès sur liste blanche). Les mentions "local uniquement", "sans compte",
> "aucun appel réseau" et "Dexie" ci-dessous sont caduques ; voir `CLAUDE.md` et `README.md`.

## 1. Objectif

Réaliser une application web progressive (PWA), installable sur Android et iOS, permettant de :

- saisir chaque jour plusieurs repas à des heures différentes ;
- distinguer visuellement chaque repas par une couleur de fond liée à son type ;
- modifier ou supprimer un repas après saisie ;
- marquer un repas comme "Extra" (contour rouge) ;
- exporter le journal sur une plage de dates au format PDF A4 imprimable, partageable via la feuille de partage du téléphone (par exemple vers une application de messagerie électronique).

## 2. Décisions de cadrage

| Sujet | Décision |
|---|---|
| Nom de l'application | Coolmiam (affiché sous l'icône et dans l'en-tête de l'application) |
| Titre du document PDF | "Journal alimentaire" (sans mention du nom de l'application) |
| Plateforme | PWA installable (Android Chrome, iOS Safari - "Ajouter à l'écran d'accueil") |
| Stockage | Local uniquement, sur l'appareil, sans compte ni serveur |
| Export | PDF A4, via Web Share API (partage de fichier) |
| Période d'export | Plage de dates libre (début et fin) |
| Couleurs | Une couleur de fond par type de repas ; contour rouge si "Extra" coché |
| Langue de l'interface | Français (fr-FR) uniquement |

## 3. Pile technique recommandée

Claude Code peut ajuster ces choix s'il justifie une alternative plus simple ou plus robuste.

- Build : Vite + TypeScript.
- Interface : React (ou Preact), CSS simple (variables CSS, pas de framework lourd).
- Stockage : IndexedDB via la bibliothèque Dexie.
- PWA : vite-plugin-pwa (manifeste + service worker avec précache complet pour un usage hors ligne).
- Génération PDF : jsPDF (génération vectorielle, texte sélectionnable). Ne pas utiliser de capture d'écran HTML (html2canvas) pour le PDF.
- Police PDF : intégrer une police TTF libre (par exemple Noto Sans ou Roboto) afin de garantir le rendu des accents français et des caractères spéciaux saisis.
- Tests : Vitest (unitaires), Playwright (E2E, émulation mobile).
- Aucune dépendance à un CDN externe, aucun appel réseau, aucune télémétrie.
- Hébergement : site statique en HTTPS (obligatoire pour l'installation PWA et la Web Share API).

## 4. Modèle de données

### 4.1 Entité Meal (table "meals")

| Champ | Type | Contraintes |
|---|---|---|
| id | string (UUID) | clé primaire, généré à la création |
| date | string "YYYY-MM-DD" | date locale de l'appareil, obligatoire, indexée |
| time | string "HH:mm" | obligatoire |
| type | enum | petit_dejeuner, dejeuner, collation, diner, autre ; obligatoire |
| description | string | obligatoire, 1 à 1000 caractères |
| notes | string | optionnel, 0 à 1000 caractères (symptômes, ressenti) |
| extra | boolean | défaut false |
| createdAt | ISO 8601 | automatique |
| updatedAt | ISO 8601 | automatique, mis à jour à chaque modification |

Index : `date` et `[date+time]`.

Tri d'affichage : date croissante, puis heure croissante, puis createdAt croissant.

### 4.2 Entité Settings (table "settings")

Clé/valeur. Clé `typeColors` : objet associant chaque type de repas à une couleur hexadécimale.

### 4.3 Libellés et couleurs par défaut

| Type | Libellé affiché | Couleur de fond par défaut |
|---|---|---|
| petit_dejeuner | Petit-déjeuner | #FFE9A8 |
| dejeuner | Déjeuner | #BFE3C0 |
| collation | Collation | #D9C8F0 |
| diner | Dîner | #B9D7F2 |
| autre | Autre | #E0E0E0 |

- Couleur du contour "Extra" : #D32F2F, non modifiable.
- Couleur du texte : calculée automatiquement (noir ou blanc) selon le contraste avec la couleur de fond, avec un ratio minimal de 4,5:1 (WCAG AA).

## 5. Spécification fonctionnelle

### 5.1 Navigation

Barre d'onglets inférieure à trois entrées : Journal, Export, Réglages.

### 5.2 Écran "Journal" (accueil)

- Bandeau de date : jour précédent, jour suivant, date affichée au format long ("lundi 6 octobre 2026"), accès à un sélecteur de date, bouton "Aujourd'hui".
- Date initiale : jour courant de l'appareil.
- Liste des repas du jour, triés par heure. Chaque carte affiche : heure, libellé du type, description, notes (si renseignées).
- Fond de la carte : couleur du type de repas.
- Repas "Extra" : contour rouge de 3 px, et mention textuelle "EXTRA" visible sur la carte (la mention évite de dépendre uniquement de la couleur).
- Appui sur une carte : ouverture du formulaire en modification.
- Bouton d'action flottant "+" : ajout d'un repas pour la date affichée.
- État vide : message "Aucun repas saisi pour ce jour" et rappel du bouton d'ajout.

### 5.3 Formulaire d'ajout et de modification

Champs :

1. Date (préremplie avec la date affichée, modifiable).
2. Heure (champ de type heure natif, préremplie avec l'heure courante en création).
3. Type de repas (sélecteur segmenté ou liste, chaque option affichant sa couleur).
4. Description (zone de texte multiligne, obligatoire).
5. Notes (zone de texte multiligne, optionnelle, libellé "Notes (symptômes, ressenti)").
6. Case à cocher "Extra".

Comportements :

- Boutons : Enregistrer, Annuler. En modification : Supprimer (avec confirmation).
- Validation : description non vide, heure et date valides ; messages d'erreur en français sous les champs concernés.
- Plusieurs repas peuvent exister à la même heure et au même type.
- L'aperçu du formulaire reflète en direct la couleur du type et le contour rouge si "Extra" est coché.
- Ne pas perdre la saisie en cours en cas de mise en arrière-plan de l'application.

### 5.4 Écran "Export"

- Champs : date de début, date de fin. Valeurs par défaut : 7 derniers jours (fin = aujourd'hui).
- Contrôle : fin supérieure ou égale au début, sinon message d'erreur.
- Affichage du nombre de repas inclus dans la période avant génération.
- Bouton "Générer le PDF" (désactivé si aucun repas sur la période, avec message explicatif).
- Une fois le PDF généré : bouton "Partager" et bouton "Enregistrer / ouvrir" (téléchargement).
- Le partage utilise `navigator.share({ files: [pdf], title })` après contrôle par `navigator.canShare({ files })`.
- Recommandation : séparer la génération et le partage en deux appuis distincts, afin que l'appel de partage soit déclenché par un geste utilisateur récent (exigence courante des navigateurs).
- Repli : si `canShare` est absent ou renvoie false, proposer le téléchargement du PDF et afficher un message indiquant que le partage direct n'est pas disponible sur cet appareil.
- Nom de fichier : `journal-alimentaire_AAAA-MM-JJ_AAAA-MM-JJ.pdf`.
- Annulation du partage par l'utilisateur (erreur AbortError) : ne pas afficher d'erreur.

### 5.5 Contenu et mise en page du PDF

- Format A4 portrait (210 x 297 mm), marges de 15 mm.
- En-tête de la première page : titre "Journal alimentaire", ligne "Période : du JJ/MM/AAAA au JJ/MM/AAAA", ligne "Généré le JJ/MM/AAAA à HH:mm".
- Pied de page sur chaque page : "Page n/N".
- Corps : une section par jour de la période, en ordre chronologique, avec le titre du jour en toutes lettres ("Lundi 6 octobre 2026").
- Jour sans repas : une ligne compacte "Aucun repas saisi".
- Chaque repas est un bloc rectangulaire :
  - fond : couleur du type de repas (couleurs courantes des réglages au moment de l'export) ;
  - ligne 1 : "HH:mm - Libellé du type" en gras ; à droite, la mention "EXTRA" en gras si applicable ;
  - description (retour à la ligne automatique) ;
  - "Notes : ..." en italique si renseignées ;
  - contour rouge #D32F2F de 0,8 mm si "Extra".
- Règles de pagination : un bloc repas n'est jamais coupé entre deux pages ; un titre de jour n'est jamais isolé en bas de page (il suit son premier repas).
- Lisibilité à l'impression noir et blanc : la mention textuelle "EXTRA" est obligatoire, la couleur seule ne suffit pas.
- Taille de police minimale : 10 pt pour le corps.

### 5.6 Écran "Réglages"

- Une ligne par type de repas avec sélecteur de couleur (champ couleur natif) et aperçu.
- Bouton "Rétablir les couleurs par défaut".
- La modification d'une couleur s'applique à l'ensemble des repas existants de ce type (la couleur n'est pas stockée par repas).
- Informations : version de l'application ; rappel que les données sont stockées uniquement sur cet appareil.

## 6. Exigences non fonctionnelles

- Hors ligne : toutes les fonctions (saisie, modification, export PDF) fonctionnent sans réseau après la première visite.
- Persistance : appeler `navigator.storage.persist()` au premier lancement pour limiter le risque d'effacement des données par le navigateur.
- Ergonomie mobile : conception à partir de 360 px de largeur, zones tactiles d'au moins 44 x 44 px, gestion des zones sûres (encoche) via `env(safe-area-inset-*)`.
- Performance : affichage d'une journée en moins de 200 ms ; génération d'un PDF de 31 jours en moins de 5 s sur un téléphone d'entrée de gamme.
- Accessibilité : contraste AA, libellés associés aux champs, navigation au lecteur d'écran sur les écrans principaux.
- Confidentialité : aucune donnée n'est transmise hors de l'appareil, sauf lorsque l'utilisateur partage lui-même le PDF.
- Manifeste : `name` "Coolmiam", `short_name` "Coolmiam", `lang` "fr", `display` "standalone", icônes 192 et 512 px dont une version "maskable", `theme_color` et `background_color` définis.
- Dates et heures : toujours en heure locale de l'appareil ; stockage de la date sous forme de chaîne "YYYY-MM-DD" pour éviter les décalages liés aux fuseaux horaires et aux changements d'heure.

## 7. Structure de projet suggérée

```
/src
  /db            (schéma Dexie, accès aux données, requêtes par plage de dates)
  /domain        (types, libellés, couleurs par défaut, calcul de contraste)
  /features
    /journal     (écran journal, cartes, bandeau de date)
    /meal-form   (formulaire)
    /export      (écran export, génération PDF, partage)
    /settings    (couleurs)
  /pdf           (mise en page jsPDF, polices intégrées)
  main.tsx
/public          (icônes, manifeste)
/tests
  /unit
  /e2e
README.md
```

## 8. Critères d'acceptation

1. L'application s'installe sur l'écran d'accueil d'un appareil Android (Chrome) et d'un iPhone (Safari) et se lance en mode standalone.
2. L'utilisateur peut créer au moins 6 repas pour un même jour, à des heures différentes, et les voit triés par heure.
3. Chaque repas affiche la couleur de fond correspondant à son type.
4. Un repas peut être modifié (tous les champs, y compris la date) puis supprimé après confirmation.
5. Cocher "Extra" affiche un contour rouge et la mention "EXTRA" sur la carte, et les retire une fois décochée.
6. Modifier la couleur d'un type dans les Réglages met à jour l'affichage de tous les repas de ce type et les PDF suivants.
7. L'export refuse une plage invalide (fin avant début) et signale une période sans repas.
8. Le PDF généré est au format A4, contient les repas de la période dans l'ordre chronologique, avec couleurs de fond, contour rouge et mention "EXTRA" pour les repas concernés, notes incluses.
9. Aucun bloc repas n'est coupé entre deux pages ; la numérotation "Page n/N" est correcte.
10. Le bouton "Partager" ouvre la feuille de partage du téléphone avec le PDF en pièce jointe ; le choix d'une application de messagerie électronique joint bien le fichier.
11. Si le partage de fichier n'est pas disponible, le PDF est proposé en téléchargement avec un message explicite.
12. L'application fonctionne en mode avion après une première ouverture avec réseau.
13. Les accents français, apostrophes et caractères saisis dans les descriptions et notes s'affichent correctement dans l'application et dans le PDF.

## 9. Plan de test

- Unitaires (Vitest) : tri des repas, requête par plage de dates (bornes incluses), validation du formulaire, calcul du contraste du texte, génération du nom de fichier, découpage en pages.
- E2E (Playwright, émulation mobile) : création, modification, suppression, case "Extra", changement de couleur, export avec téléchargement du PDF, comportement hors ligne.
- Tests manuels sur appareils réels (obligatoires) : feuille de partage avec fichier PDF et envoi par messagerie électronique, sur Android (Chrome) et sur iPhone (Safari et application installée) ; impression réelle ou aperçu A4 du PDF, en couleur et en noir et blanc.

## 10. Livrables

- Code source complet, buildable par `npm install` puis `npm run build`.
- README en français : installation, commandes de développement, de test et de build, procédure de déploiement statique en HTTPS, procédure d'installation sur l'écran d'accueil (Android et iOS).
- Jeu de tests décrit en section 9 et exécutable en ligne de commande.

## 11. Hors périmètre (version 1)

- Comptes utilisateurs, synchronisation, sauvegarde cloud.
- Calcul de calories ou de valeurs nutritionnelles, base d'aliments.
- Photos des repas.
- Statistiques et graphiques.
- Multi-utilisateurs, multilingue.

Options à évaluer ultérieurement : export/import d'un fichier de sauvegarde JSON (utile car le stockage local seul expose à une perte de données en cas de réinitialisation du navigateur ou de changement de téléphone), duplication d'un repas, repas favoris à réutiliser.

## 12. Points d'attention techniques

- La Web Share API avec fichiers n'est pas disponible sur tous les navigateurs (statut "Limited availability" selon la documentation) : le test sur appareil réel et le repli par téléchargement sont indispensables.
- Les données IndexedDB restent soumises aux politiques de stockage du navigateur : la demande de persistance réduit le risque sans l'annuler.
- Les couleurs étant stockées par type et non par repas, le PDF d'une période ancienne reflète les couleurs en vigueur au moment de l'export.

## 13. Références

- MDN Web Docs, Navigator: share() method - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share (consulté le 06/10/2026)
- MDN Web Docs, Navigator: canShare() method - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare (consulté le 06/10/2026)
- Web Platform DX, fiche "navigator.share()" - https://web-platform-dx.github.io/web-features-explorer/features/share (consulté le 06/10/2026)
