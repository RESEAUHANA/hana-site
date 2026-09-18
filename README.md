# HANA — site hanahealth.fr (v7)

Site statique, mobile-first. Aucune dépendance à installer.

## Mise en ligne (GitHub Pages)
1. Pousser le contenu de ce dossier à la racine du repo (branche `main`).
2. Settings → Pages → Deploy from branch → `main` / root.
3. Quand le DNS OVH est prêt : Settings → Pages → Custom domain → `hanahealth.fr`, cocher Enforce HTTPS.
4. Zone DNS OVH : 4 enregistrements A (185.199.108.153, .109.153, .110.153, .111.153) + CNAME `www` → `VOTREUSER.github.io`. Ne pas toucher aux MX.

## Formulaire de rappel (contact.html)
- Le formulaire pointe vers Formspree. Créer un compte gratuit sur formspree.io avec contact@hanahealth.fr, créer un formulaire, puis remplacer `VOTRE_ID` dans `contact.html` (attribut `action`) par l'identifiant fourni.
- Tant que `VOTRE_ID` n'est pas remplacé, le formulaire bascule automatiquement en email pré-rempli vers contact@hanahealth.fr : il est donc fonctionnel dès le premier jour, mais Formspree est plus propre (pas d'ouverture du client mail du visiteur).

## Photos à remplacer par le shooting
Trois emplacements, repérables par le badge « Photo provisoire » :
- index.html : portrait consultation (bloc « Moi, j'en viens ») + équipe médicale (bloc méthode)
- methode.html : consultation praticien/patiente (bloc écosystème)
Si une image provisoire ne charge pas, un cadre « Emplacement photo — shooting à prévoir » s'affiche à la place : rien ne casse.
Remplacement : déposer vos fichiers dans `assets/img/` et remplacer les `src` Unsplash.

## Curseur
Curseur glider (jeu de la vie) sur desktop uniquement, décliné par page (couleur/orientation différentes sur accueil, méthode, tarifs, contact). Défini en CSS dans `site.css`, section « curseurs glider ».

## Divers
- Email affiché partout : contact@hanahealth.fr (plus de Gmail).
- `demo/` : conservé tel quel depuis la v6, non lié depuis le site.
- Respecte prefers-reduced-motion : toutes les animations se coupent.

## v7.1 — refonte Hostinger + nouvelles pages
- Typo : DM Sans (900 pour les titres), hero clair, accent vert vif #2FA36B, la grille vivante devient une carte produit interactive à droite du hero.
- 5 nouvelles pages : expertises.html (hub), seo-medical.html, visibilite-ia.html, ecosysteme.html, equipe.html.
- Graphiques en barres CSS, animés au scroll, avec sources datées :
  · Pew Research Center (juil. 2025) : clics 8 % avec résumé IA vs 15 % sans, 1 % dans le bloc
  · Ahrefs 2025 : −34,5 % de CTR en position 1 avec aperçu IA
  · SparkToro/Similarweb (Rand Fishkin, juin 2026) : 68 % de recherches sans clic vs 60 % en 2024
  · Diplomeo/BDM 2025 (16-25 ans, France) : s'informent via Instagram 51 %, YouTube 47 %, TikTok 38 %, LinkedIn 25 %
  · IAB Espagne/Epsilon 2025 : 48 % consultent les réseaux avant achat, 44 % influencés
- Zone d'accompagnement affichée : France, Suisse, DOM-TOM, Espagne.
- Photo portrait fondatrice en provisoire sur equipe.html : à remplacer par ton vrai portrait.

## v7.2 → v7.3
- Hero home : dégradé vif animé navy → teal → vert (#2FC98B), halo lumineux en mouvement, cellules du jeu de la vie en fond. Animations coupées si prefers-reduced-motion.
- Héros intérieurs : dégradé clair vert avec halo, sur les 8 pages.
- Micro-animations : pastilles IA qui pulsent, mockups et cartes qui se soulèvent au survol, cellules des rôles qui pivotent.
- Équipe : portrait supprimé (choix Sihem), remplacé par le parcours en 3 domaines : chirurgie esthétique (7 ans, libéral), médecine esthétique et chirurgie réfractive (3 ans, groupe de cliniques, même période).
- Photos provisoires ajoutées sur seo-medical, ecosysteme, expertises, equipe (badge « Photo provisoire », fallback si URL morte). À remplacer via Claude Code : chercher les <figure class="ph"> dans les pages.

## v7.3 → v7.4
- Home : nouveau bloc « Plus de trente actes, connus de l'intérieur » (deux bandeaux de chips défilant en sens inverse, pause au survol, statique si reduced-motion).
- Home : la section exclusivité devient « Un praticien par ville. Un maillage entre confrères » — le maillage (cocitations, graphe de liens, précédent Doctolib) y est central, avec bouton vers la méthode.
- Graphiques : cartes blanches y compris sur fond navy, barres 20 px, valeurs en 22 px vert foncé. Lisible en un coup d'œil.
- Rédaction : YMYL et E-E-A-T explicités sur seo-medical, titres réécrits (équipe : « Dix ans de pratique, au contact des patients »), text-wrap:balance sur tous les titres contre les coupures moches.
