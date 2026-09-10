# Site HANA — hanahealth.fr

Site vitrine statique (HTML/CSS, sans framework). 4 pages : index, methode, tarifs, contact.

## Déploiement (instructions pour Claude Code)
1. Créer un repo GitHub public `hana-site` sur le compte de l'utilisatrice et pousser ce dossier.
2. Activer GitHub Pages (branche main, racine).
3. Quand le domaine est acheté : le configurer dans Settings > Pages, guider l'ajout des 2 enregistrements DNS chez le registrar, activer Enforce HTTPS.
4. Si le domaine final n'est pas hanahealth.fr : remplacer ce domaine dans les balises canonical/og:url de chaque page, dans robots.txt et sitemap.xml.

## Modifications courantes
- Tarifs : `tarifs.html` (et le teaser sur `index.html`).
- Header/footer : dupliqués dans chaque page (chercher `class="nav"` et `<footer>`).
