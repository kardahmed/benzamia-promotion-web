# Visite virtuelle — hébergement et intégration

## L'export

Fichier fourni : `EXPORT.zip` — visite **3DVista** « BENZAMIA Promotion 360° ».

- ~120 Mo décompressé, **29 644 fichiers** (tuiles cube `webp`, `lib/tdvplayer.js`, `script*.js`, `skin/`, `locale/fr.txt`).
- 47 panoramas : hall, séjour/salon, chambres, cuisine, salle de bain — appartements témoins **Résidence La Cité** et **Résidence Azhar II** (une seule visite combinée).
- Point d'entrée : `EXPORT/index.htm`.
- Statique pur : aucun serveur applicatif requis, se sert depuis n'importe quel hébergement de fichiers.

## Pourquoi ce n'est PAS dans le dépôt

- 120 Mo / 29 000 fichiers gonfleraient chaque `git clone`, chaque `npm ci` de la CI et chaque déploiement Hostinger.
- CDC V2 §11 : les médias vivent sur **Supabase Storage**, pas dans le code.

Le dépôt ne contient que l'**intégration** (`src/components/virtual-tour-embed.tsx`) et une image d'aperçu légère (`public/visite-virtuelle/poster.jpg`).

## Où l'héberger

**Décision (2026-09-07) : Option B — sous-domaine statique Hostinger
`visite.benzamiapromotion.com`.** L'option A reste documentée pour référence.

### Option B — Sous-domaine statique Hostinger *(retenue)*

1. hPanel → **Sous-domaines** → créer `visite.benzamiapromotion.com`
   (docroot dédié, p. ex. `domains/visite.benzamiapromotion.com/public_html`).
2. Uploader `EXPORT.zip` dans ce docroot via le **Gestionnaire de fichiers**,
   puis **Extraire** — le contenu de `EXPORT/` doit se retrouver **à la racine**
   du sous-domaine (`index.htm` directement accessible, pas `EXPORT/index.htm`).
3. Vérifier : `https://visite.benzamiapromotion.com/index.htm` s'ouvre et la
   visite tourne. Activer le SSL du sous-domaine dans hPanel.
4. Renseigner la variable côté application principale :
   - **Prod** : hPanel → variables d'environnement de l'app Node →
     `NEXT_PUBLIC_VIRTUAL_TOUR_URL=https://visite.benzamiapromotion.com/index.htm`
   - **Local** : `.env.local` avec la même ligne.
5. Redéployer / rebuild l'app principale (la variable est `NEXT_PUBLIC_`, elle
   est injectée au build).

**Piège `X-Frame-Options`.** Le site principal envoie `X-Frame-Options: SAMEORIGIN`
sur toutes ses pages (`next.config.ts`) — cela concerne le fait *d'être* mis en
iframe, pas *d'en* afficher une, donc l'embed fonctionne. En revanche si
Hostinger ajoute par défaut `X-Frame-Options: SAMEORIGIN` **sur le sous-domaine**,
l'iframe restera blanche. Dans ce cas, sur le sous-domaine uniquement, ajouter un
`.htaccess` :

```apache
Header always unset X-Frame-Options
Header always set Content-Security-Policy "frame-ancestors 'self' https://benzamiapromotion.com https://www.benzamiapromotion.com"
```

### Option A — Supabase Storage (non retenue pour l'instant)

1. Projet Supabase unique `benzamia-promotion` → **Storage** → bucket **public** `tours`.
2. Uploader le contenu de `EXPORT/` sous `tours/benzamia-360/` (conserver l'arborescence).
   ```bash
   # exemple avec la CLI supabase (adapter le project-ref)
   supabase storage cp --recursive ./EXPORT "ss:///tours/benzamia-360"
   ```
3. URL publique du dossier :
   `https://<project-ref>.supabase.co/storage/v1/object/public/tours/benzamia-360`
4. `NEXT_PUBLIC_VIRTUAL_TOUR_URL` =
   `https://<project-ref>.supabase.co/storage/v1/object/public/tours/benzamia-360/index.htm`

Cache : Storage sert avec `cache-control` par défaut court — pousser `--cache-control 3600` (ou plus) sur l'upload pour les assets immuables.

## Intégration dans le site (déjà en place)

- `src/content/site.ts` → `virtualTour` lit `NEXT_PUBLIC_VIRTUAL_TOUR_URL`.
  Vide → la page affiche « bientôt disponible » (pas d'iframe).
- `VirtualTourEmbed` (`location="page_visite"`) sur `/visite-virtuelle` :
  - **l'iframe ne se charge qu'au clic** sur « Lancer la visite virtuelle » (CDC §8) ;
  - image d'aperçu `poster.jpg` avant le clic ;
  - `allowFullScreen` + `allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking"` ;
  - événement `start_virtual_tour` poussé au lancement (`{ location, interaction: "launch" }`).
- Section accueil (`virtual-tour.tsx`) : simple CTA vers `/visite-virtuelle`
  (`start_virtual_tour`, `{ location: "accueil", interaction: "cta" }`) — pas
  d'iframe sur l'accueil, pour la performance.
- Bouton « Réserver une visite sur place » visible sous la visite.

## Vérifications avant mise en ligne

- [ ] L'iframe s'ouvre en plein écran sur mobile et desktop.
- [ ] `locale/fr.txt` et les `webp` se chargent (regarder l'onglet réseau : tout doit être same-origin **dans** l'iframe).
- [ ] `Content-Security-Policy` du site : `frame-src` doit autoriser le domaine choisi (Supabase Storage ou `visite.benzamiapromotion.com`). Aujourd'hui `next.config.ts` ne pose pas de CSP `frame-src` restrictive — à vérifier si une CSP est ajoutée plus tard.
- [ ] Poids : la visite fait ~120 Mo au total mais 3DVista ne charge que le panorama courant ; vérifier que le premier rendu reste raisonnable sur 4G.
- [ ] Événement `start_virtual_tour` visible dans le DebugView GA4.

## Deep-link par projet (plus tard)

3DVista accepte `?media-name=<nom du panorama>` ou un hash `#media/<id>` pour
ouvrir directement une pièce. On pourra faire pointer chaque fiche projet vers
son premier panorama une fois les noms connus (`locale/fr.txt`).
