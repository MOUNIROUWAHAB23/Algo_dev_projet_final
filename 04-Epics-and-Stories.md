# Epics & User Stories
# Plateforme d'Hébergements Touristiques - Open Data (data.gouv.fr)

**Version:** 1.0
**Date:** 27 Mars 2026
**Database:** MongoDB Atlas
**Sprint:** 14 jours

---

## 📊 VUE D'ENSEMBLE DES EPICS

| Epic ID | Nom | Stories | Priorité | Sprint |
|---------|-----|---------|----------|--------|
| DATA-01 | Import data.gouv.fr | 4 | P0 | J1-4 |
| AVAIL-01 | Disponibilités Temps Réel | 4 | P0 | J2-5 |
| AUTH-01 | Authentification | 3 | P0 | J1-3 |
| SEARCH-01 | Recherche + Filtres | 4 | P0 | J4-5 |
| MAP-01 | Carte Interactive | 3 | P0 | J5-6 |
| INFO-01 | Fiches Établissements | 2 | P0 | J6-7 |
| REVIEW-01 | Système d'Avis | 3 | P1 | J7-8 |
| FAVORI-01 | Favoris | 2 | P1 | J8 |
| DASH-01 | Dashboard Analytics | 4 | P1 | J8-9 |
| TECH-01 | Infrastructure & Tests | 5 | P0 | J1-14 |

---

## 📥 EPIC DATA-01: Import des Données data.gouv.fr

### DATA-01.01: Téléchargement des Datasets

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J4

**En tant que** système,
**Je veux** télécharger les datasets depuis data.gouv.fr,
**Afin de** peupler la base de données.

**Critères d'acceptation:**
- [ ] 10+ datasets identifiés (hôtels, campings, résidences, meublés, auberges, villages vacances)
- [ ] URLs des datasets documentées
- [ ] Téléchargement automatique via script
- [ ] Fichiers CSV stockés temporairement
- [ ] Log de téléchargement

**Tâches techniques:**
- [ ] Identifier les datasets sur data.gouv.fr
- [ ] Créer service datagouv.service.ts
- [ ] Script de téléchargement axios
- [ ] Gestion erreurs + retry
- [ ] Tests integration

---

### DATA-01.02: Parsing et Normalisation CSV

**Priorité:** P0 | **Estimation:** 4h | **Sprint:** J4

**En tant que** système,
**Je veux** parser et normaliser les CSV,
**Afin d'**avoir un schema de données commun.

**Critères d'acceptation:**
- [ ] CSV parsés avec papaparse
- [ ] Schéma Mongoose unique pour tous types
- [ ] Champs normalisés: nom, adresse, codePostal, commune, departement, region
- [ ] Types d'hébergements mappés (HOTEL, CAMPING, RESIDENCE, MEUBLE, AUBERGE, VILLAGE_VACANCES)
- [ ] Équipements standardisés

**Tâches techniques:**
- [ ] Configurer papaparse
- [ ] Créer fonction parseCSV
- [ ] Mapping champs par dataset
- [ ] Normalisation noms (uppercase, trim)
- [ ] Tests unitaires parsing

---

### DATA-01.03: Géocodage des Adresses

**Priorité:** P1 | **Estimation:** 4h | **Sprint:** J4

**En tant que** système,
**Je veux** géocoder les adresses sans GPS,
**Afin de** permettre la recherche géolocalisée.

**Critères d'acceptation:**
- [ ] Utilisation Nominatim API (OpenStreetMap)
- [ ] Géocodage batch des adresses
- [ ] Cache des résultats (éviter appels dupliqués)
- [ ] Latitude/longitude stockées dans MongoDB
- [ ] Gestion échecs (adresse non trouvée)

**Tâches techniques:**
- [ ] Créer geocode.service.ts
- [ ] Appel API Nominatim
- [ ] Rate limiting (1 req/sec max)
- [ ] Stockage lat/lng dans documents
- [ ] Log géocodage échoués

---

### DATA-01.04: Insertion MongoDB (Bulk Write)

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J4

**En tant que** système,
**Je veux** insérer les données dans MongoDB,
**Afin de** les rendre consultables.

**Critères d'acceptation:**
- [ ] Utilisation bulkWrite pour performance
- [ ] Upsert (update if exists, insert if new)
- [ ] Détection doublons (nom + commune + source)
- [ ] Collection ImportLog mise à jour
- [ ] Stats d'import (insérés, modifiés, échoués)

**Tâches techniques:**
- [ ] Configurer Mongoose schemas
- [ ] Créer index MongoDB (2dsphere, text)
- [ ] Implémenter bulkWrite avec upsert
- [ ] Modèle ImportLog
- [ ] Tests charge (50 000 docs)

---

## ⏱️ EPIC AVAIL-01: Disponibilités en Temps Réel

### AVAIL-01.01: Infrastructure Stockage Disponibilités

**Priorité:** P0 | **Estimation:** 2h | **Sprint:** J2

**En tant que** système,
**Je veux** créer une collection MongoDB pour les disponibilités,
**Afin de** pouvoir stocker les statuts à jour de chaque hébergement.

**Critères d'acceptation:**
- [ ] Collection `availabilities` créée en MongoDB
- [ ] Index sur `hebergement_id` (foreign key)
- [ ] Index sur `updated_at` pour requêtes rapides
- [ ] Document de référence: 1 hébergement = N périodes de disponibilité
- [ ] Status enum: `available`, `unavailable`, `unknown`
- [ ] Timestamp mis à jour par DAG Airflow

**Tâches techniques:**
- [ ] Créer collection MongoDB avec schéma
- [ ] Créer 4 indexes (hebergement_id, dates, updated_at, status)
- [ ] Seed données test (10 hébergements × 30 jours)
- [ ] Valider connexion MongoDB Atlas

---

### AVAIL-01.02: DAG Airflow Mise à Jour Disponibilités

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J2

**En tant que** système,
**Je veux** que le DAG Airflow récupère les disponibilités toutes les 30 min,
**Afin de** garder les données à jour en temps réel.

**Critères d'acceptation:**
- [ ] DAG `recuperation_disponibilites` schedule TOUS LES 30 MIN
- [ ] Récupère disponibilités depuis source externe (API/web scraping/data.gouv.fr)
- [ ] Upsert en MongoDB (ne pas créer duplicates)
- [ ] Logs structurés (JSON) dans datalake
- [ ] Gestion erreurs + retry automatique
- [ ] DAG runs < 5 minutes par batch

**Tâches techniques:**
- [ ] Vérifier/compléter script `airflow/scripts/update_availabilities.py`
- [ ] Configurer API source (qui fournit les dispos?)
- [ ] Configurer schedule Airflow: `*/30 * * * *`
- [ ] Tester avec 100 hébergements
- [ ] Valider upsert MongoDB

---

### AVAIL-01.03: Backend API Disponibilités

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J3

**En tant que** frontend,
**Je veux** un endpoint qui me retourne les disponibilités d'un hébergement,
**Afin de** l'afficher à l'utilisateur.

**Critères d'acceptation:**
- [ ] GET `/api/hebergements/:id/availabilities` - Liste dispo par date
- [ ] GET `/api/availabilities/search?dates=2026-04-01..2026-04-30&regions=Ile-de-France` - Search multi-filtre
- [ ] Réponse JSON avec datas
- [ ] Cache Redis (5 min) pour perf
- [ ] Rate limit: 100 req/min/IP
- [ ] Tests: 80%+ coverage

**Tâches techniques:**
- [ ] Créer routes Express `/api/hebergements/:id/availabilities`
- [ ] Créer routes Express `/api/availabilities/search`
- [ ] Middleware: auth + cache Redis
- [ ] Query MongoDB optimisée (indexes!)
- [ ] Tests API (Supertest)

---

### AVAIL-01.04: Frontend - Affichage Disponibilités

**Priorité:** P0 | **Estimation:** 4h | **Sprint:** J4-5

**En tant que** utilisateur,
**Je veux** voir clairement si un hébergement est disponible à mes dates cherchées,
**Afin de** savoir si je peux le réserver.

**Critères d'acceptation:**
- [ ] Page Search: Affiche "✅ Disponible" ou "❌ Non disponible" par hébergement
- [ ] Fiche Détail (`/hebergement/:id`): Calendrier interactif avec dispos
- [ ] Couleur code: 🟢 = Disponible, 🔴 = Complet, ⚪ = Inconnu
- [ ] Responsive mobile (calendrier adapté)
- [ ] Filtre "Uniquement dispos" en search
- [ ] Mise à jour auto toutes les 5 min
- [ ] Affichage prix min/max en temps réel

**Tâches techniques:**
- [ ] Composant: `AvailabilityBadge` (search results)
- [ ] Composant: `AvailabilityCalendar` (fiche détail)
- [ ] Hook custom: `useAvailabilities()` → auto-refresh 5min
- [ ] Intégration search page + détail page
- [ ] Tests E2E Playwright

---

## 🔐 EPIC AUTH-01: Authentification

### AUTH-01.01: Inscription Utilisateur

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J3

**En tant que** visiteur,
**Je veux** créer un compte avec email et mot de passe,
**Afin de** déposer des avis et sauvegarder des favoris.

**Critères d'acceptation:**
- [ ] Formulaire avec email, mot de passe, confirmation
- [ ] Email valide et unique (vérification DB)
- [ ] Mot de passe min 8 caractères, 1 majuscule, 1 chiffre
- [ ] Hash bcrypt du mot de passe
- [ ] Document Utilisateur créé dans MongoDB
- [ ] Token JWT généré automatiquement

**Tâches techniques:**
- [ ] Endpoint POST /api/auth/register
- [ ] Schema Mongoose Utilisateur
- [ ] Validation Zod schema
- [ ] Hash password avec bcrypt
- [ ] Générer JWT avec userId
- [ ] Tests unitaires register

---

### AUTH-01.02: Connexion Utilisateur

**Priorité:** P0 | **Estimation:** 2h | **Sprint:** J3

**En tant qu'**utilisateur inscrit,
**Je veux** me connecter avec mes identifiants,
**Afin d'**accéder à mon compte.

**Critères d'acceptation:**
- [ ] Formulaire email + mot de passe
- [ ] Vérification des credentials dans MongoDB
- [ ] Token JWT retourné si succès
- [ ] Redirection automatique
- [ ] Gestion erreurs (email/mot de passe incorrect)

**Tâches techniques:**
- [ ] Endpoint POST /api/auth/login
- [ ] Vérifier password avec bcrypt.compare
- [ ] Générer JWT avec userId et role
- [ ] Gérer erreurs 401
- [ ] Tests unitaires login

---

### AUTH-01.03: Gestion du Profil

**Priorité:** P1 | **Estimation:** 3h | **Sprint:** J3

**En tant qu'**utilisateur,
**Je veux** modifier mon profil,
**Afin de** garder mes informations à jour.

**Critères d'acceptation:**
- [ ] Champs modifiables: nom, prénom
- [ ] Changer mot de passe
- [ ] Supprimer mon compte (RGPD)
- [ ] Exporter mes données (RGPD)
- [ ] Confirmation après sauvegarde

**Tâches techniques:**
- [ ] Endpoint PUT /api/auth/profile
- [ ] Endpoint DELETE /api/auth/account
- [ ] Endpoint GET /api/auth/export
- [ ] Validation Zod schema
- [ ] Tests integration

---

## 🔍 EPIC SEARCH-01: Recherche + Filtres

### SEARCH-01.01: Recherche Full-Text

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J5

**En tant que** voyageur,
**Je veux** rechercher des hébergements par texte,
**Afin de** trouver un établissement par nom ou commune.

**Critères d'acceptation:**
- [ ] Barre de recherche dans le header
- [ ] Recherche sur nom et commune
- [ ] Index text MongoDB configuré
- [ ] Résultats triés par pertinence
- [ ] Suggestion de corrections (optionnel)

**Tâches techniques:**
- [ ] Endpoint GET /api/hebergements/search?q=
- [ ] Index text sur nom + commune
- [ ] Query MongoDB avec $search text
- [ ] Composant SearchBar frontend
- [ ] Tests performance

---

### SEARCH-01.02: Filtres Multiples

**Priorité:** P0 | **Estimation:** 4h | **Sprint:** J5

**En tant que** voyageur,
**Je veux** filtrer les résultats,
**Afin de** trouver l'hébergement idéal.

**Critères d'acceptation:**
- [ ] Filtre par type (hôtel, camping, résidence, etc.)
- [ ] Filtre par classement (étoiles: 1-5)
- [ ] Filtre par capacité
- [ ] Filtre par région/département
- [ ] Filtre par équipements
- [ ] Filtres combinables

**Tâches techniques:**
- [ ] Endpoint GET /api/hebergements avec query params
- [ ] Query MongoDB dynamique (filtres optionnels)
- [ ] Composant FilterPanel frontend
- [ ] State management (Zustand)
- [ ] Tests filtres

---

### SEARCH-01.03: Pagination des Résultats

**Priorité:** P1 | **Estimation:** 2h | **Sprint:** J5

**En tant que** voyageur,
**Je veux** paginer les résultats,
**Afin de** naviguer facilement.

**Critères d'acceptation:**
- [ ] 20 résultats par page
- [ ] Navigation page précédente/suivante
- [ ] Numéros de page
- [ ] Total résultats affiché
- [ ] Performance maintenue

**Tâches techniques:**
- [ ] Query params: page, limit
- [ ] MongoDB skip/limit
- [ ] Composant Pagination frontend
- [ ] Tests pagination

---

### SEARCH-01.04: Tri des Résultats

**Priorité:** P1 | **Estimation:** 2h | **Sprint:** J5

**En tant que** voyageur,
**Je veux** trier les résultats,
**Afin de** afficher par pertinence, nom, note.

**Critères d'acceptation:**
- [ ] Tri par pertinence (défaut)
- [ ] Tri par nom (A-Z, Z-A)
- [ ] Tri par note moyenne
- [ ] Tri par capacité
- [ ] Tri applicable côté serveur

**Tâches techniques:**
- [ ] Query param: sortBy, sortOrder
- [ ] MongoDB sort()
- [ ] Composant SortSelect frontend
- [ ] Tests tri

---

## 🗺️ EPIC MAP-01: Carte Interactive

### MAP-01.01: Affichage Carte Leaflet

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J6

**En tant que** voyageur,
**Je veux** voir les hébergements sur une carte,
**Afin de** visualiser leur position.

**Critères d'acceptation:**
- [ ] Carte Leaflet avec tuiles OpenStreetMap
- [ ] Vue France entière au chargement
- [ ] Zoom et pan fonctionnels
- [ ] Responsive (mobile, tablette, desktop)

**Tâches techniques:**
- [ ] Installer leaflet + react-leaflet
- [ ] Composant MapView
- [ ] Tuiles OpenStreetMap
- [ ] Styles CSS pour hauteur carte
- [ ] Tests carte

---

### MAP-01.02: Markers Clusterisés

**Priorité:** P0 | **Estimation:** 4h | **Sprint:** J6

**En tant que** voyageur,
**Je veux** voir des markers clusterisés,
**Afin de** avoir une carte lisible.

**Critères d'acceptation:**
- [ ] Clusterisation automatique (SuperCluster)
- [ ] Click cluster → zoom
- [ ] Click marker → info window
- [ ] Performance avec 1000+ markers

**Tâches techniques:**
- [ ] Installer leaflet.markercluster ou supercluster
- [ ] Composant MarkerCluster
- [ ] Custom icons pour clusters
- [ ] Optimisation performance
- [ ] Tests charge markers

---

### MAP-01.03: Recherche Géolocalisée

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J6

**En tant que** voyageur,
**Je veux** chercher autour de moi,
**Afin de** trouver des hébergements proches.

**Critères d'acceptation:**
- [ ] Géolocalisation navigateur
- [ ] Bouton "Autour de moi"
- [ ] Rayon sélectionnable (5, 10, 20, 50 km)
- [ ] API nearby avec index 2dsphere
- [ ] Markers mis à jour

**Tâches techniques:**
- [ ] Hook useGeolocation
- [ ] Endpoint GET /api/hebergements/nearby
- [ ] Query MongoDB avec $near + 2dsphere
- [ ] Composant GeolocateButton
- [ ] Tests géolocalisation

---

## 📄 EPIC INFO-01: Fiches Établissements

### INFO-01.01: Page Détail Hébergement

**Priorité:** P0 | **Estimation:** 4h | **Sprint:** J7

**En tant que** voyageur,
**Je veux** consulter la fiche détaillée d'un hébergement,
**Afin de** connaître toutes les informations.

**Critères d'acceptation:**
- [ ] URL unique /hebergement/:id
- [ ] SSR pour SEO (Next.js)
- [ ] Nom, type, classement étoiles
- [ ] Adresse complète
- [ ] Coordonnées (téléphone, email, site web)
- [ ] Capacité
- [ ] Équipements
- [ ] Mini-carte position

**Tâches techniques:**
- [ ] Endpoint GET /api/hebergements/:id
- [ ] Page dynamique Next.js
- [ ] Composant HebergementDetails
- [ ] Mini-carte Leaflet
- [ ] Meta tags SEO
- [ ] Tests détail

---

### INFO-01.02: Photos et Galerie

**Priorité:** P2 | **Estimation:** 2h | **Sprint:** J7

**En tant que** voyageur,
**Je veux** voir des photos de l'hébergement,
**Afin de** me projeter.

**Critères d'acceptation:**
- [ ] Photos affichées si disponibles
- [ ] Galerie avec lightbox
- [ ] Fallback si pas de photos
- [ ] Optimisation chargement

**Tâches techniques:**
- [ ] Champ photos dans schema (si dataset fournit)
- [ ] Composant PhotoGallery
- [ ] Lightbox (react-image-lightbox)
- [ ] Lazy loading images
- [ ] Tests galerie

---

## ⭐ EPIC REVIEW-01: Système d'Avis

### REVIEW-01.01: Déposer un Avis

**Priorité:** P1 | **Estimation:** 3h | **Sprint:** J8

**En tant qu'**utilisateur connecté,
**Je veux** déposer un avis sur un hébergement,
**Afin de** partager mon expérience.

**Critères d'acceptation:**
- [ ] Accessible uniquement si connecté
- [ ] Note globale (1-5 étoiles)
- [ ] Sous-notes: propreté, accueil, rapport qualité/prix, emplacement
- [ ] Commentaire libre (min 50 caractères)
- [ ] Date du séjour (optionnelle)
- [ ] Document Review créé dans MongoDB

**Tâches techniques:**
- [ ] Endpoint POST /api/reviews
- [ ] Schema Mongoose Review
- [ ] Middleware auth requis
- [ ] Calcul note moyenne (agrégation MongoDB)
- [ ] Composant ReviewForm
- [ ] Tests avis

---

### REVIEW-01.02: Affichage des Avis

**Priorité:** P1 | **Estimation:** 3h | **Sprint:** J8

**En tant que** voyageur,
**Je veux** lire les avis sur un hébergement,
**Afin de** me faire une opinion.

**Critères d'acceptation:**
- [ ] Liste des avis triés par date
- [ ] Note globale et sous-notes affichées
- [ ] Nombre d'avis total
- [ ] Pagination des avis
- [ ] Badge "Séjour vérifié" (optionnel)

**Tâches techniques:**
- [ ] Endpoint GET /api/hebergements/:id/reviews
- [ ] Agrégation MongoDB pour note moyenne
- [ ] Composant ReviewList
- [ ] Composant StarRating
- [ ] Tests affichage avis

---

### REVIEW-01.03: Modifier/Supprimer son Avis

**Priorité:** P1 | **Estimation:** 2h | **Sprint:** J8

**En tant qu'**utilisateur,
**Je veux** modifier ou supprimer mon avis,
**Afin de** corriger ou retirer mon commentaire.

**Critères d'acceptation:**
- [ ] Modification possible (30 jours)
- [ ] Suppression avec confirmation
- [ ] Seul l'auteur peut modifier/supprimer
- [ ] Note moyenne recalculée après modification

**Tâches techniques:**
- [ ] Endpoint PUT /api/reviews/:id
- [ ] Endpoint DELETE /api/reviews/:id
- [ ] Vérification propriétaire avis
- [ ] Recalcul note moyenne
- [ ] Tests modification

---

## ❤️ EPIC FAVORI-01: Favoris

### FAVORI-01.01: Ajouter un Favori

**Priorité:** P1 | **Estimation:** 2h | **Sprint:** J8

**En tant qu'**utilisateur connecté,
**Je veux** sauvegarder un hébergement en favoris,
**Afin de** le retrouver facilement.

**Critères d'acceptation:**
- [ ] Bouton "Cœur" sur chaque établissement
- [ ] Toggle (ajouter/supprimer)
- [ ] Document Favori créé dans MongoDB
- [ ] Sync localStorage + DB si connecté

**Tâches techniques:**
- [ ] Endpoint POST /api/favoris
- [ ] Schema Mongoose Favori
- [ ] Index unique (utilisateurId, hebergementId)
- [ ] Composant FavoriteButton
- [ ] Tests favoris

---

### FAVORI-01.02: Liste des Favoris

**Priorité:** P1 | **Estimation:** 2h | **Sprint:** J8

**En tant qu'**utilisateur,
**Je veux** voir ma liste de favoris,
**Afin de** consulter mes établissements sauvegardés.

**Critères d'acceptation:**
- [ ] Page /favoris avec liste complète
- [ ] Cards hébergements favoris
- [ ] Suppression depuis la liste
- [ ] Nombre de favoris affiché

**Tâches techniques:**
- [ ] Endpoint GET /api/favoris
- [ ] Population hebergements depuis Favori
- [ ] Page /favoris frontend
- [ ] Composant FavoritesList
- [ ] Tests liste favoris

---

## 📊 EPIC DASH-01: Dashboard Analytics

### DASH-01.01: Stats par Région

**Priorité:** P1 | **Estimation:** 3h | **Sprint:** J9

**En tant qu'**analyste,
**Je veux** voir les statistiques par région,
**Afin de** comprendre la répartition géographique.

**Critères d'acceptation:**
- [ ] Nombre d'hébergements par région
- [ ] Capacité totale par région
- [ ] Répartition par type
- [ ] Graphique interactif

**Tâches techniques:**
- [ ] Endpoint GET /api/analytics/regions
- [ ] Agrégation MongoDB ($group by region)
- [ ] Composant RegionChart
- [ ] Tests agrégation

---

### DASH-01.02: Stats par Département

**Priorité:** P1 | **Estimation:** 3h | **Sprint:** J9

**En tant qu'**analyste,
**Je veux** voir les statistiques par département,
**Afin de** analyser au niveau local.

**Critères d'acceptation:**
- [ ] Nombre d'hébergements par département
- [ ] Carte choroplèthe (densité)
- [ ] Top 10 départements
- [ ] Filtre par type

**Tâches techniques:**
- [ ] Endpoint GET /api/analytics/departements
- [ ] Agrégation MongoDB ($group by departement)
- [ ] Composant DepartementMap
- [ ] Tests département

---

### DASH-01.03: Évolution Temporelle

**Priorité:** P2 | **Estimation:** 3h | **Sprint:** J9

**En tant qu'**analyste,
**Je veux** voir l'évolution du nombre d'hébergements,
**Afin de** analyser les tendances.

**Critères d'acceptation:**
- [ ] Évolution par année
- [ ] Graphique temporel interactif
- [ ] Filtre par type
- [ ] Comparaison période précédente

**Tâches techniques:**
- [ ] Endpoint GET /api/analytics/evolution
- [ ] Agrégation MongoDB ($group by year)
- [ ] Composant EvolutionChart
- [ ] Tests évolution

---

### DASH-01.04: Export des Données

**Priorité:** P1 | **Estimation:** 2h | **Sprint:** J9

**En tant qu'**analyste,
**Je veux** exporter les données,
**Afin de** les utiliser dans mes outils.

**Critères d'acceptation:**
- [ ] Export CSV complet
- [ ] Export Excel (optionnel)
- [ ] Filtres applicables avant export
- [ ] Limitation (1000 lignes gratuit)

**Tâches techniques:**
- [ ] Endpoint GET /api/analytics/export
- [ ] Génération CSV (json2csv)
- [ ] Téléèschargement fichier
- [ ] Composant ExportButton
- [ ] Tests export

---

## 🏗️ EPIC TECH-01: Infrastructure & Tests

### TECH-01.01: Setup Projet

**Priorité:** P0 | **Estimation:** 2h | **Sprint:** J1

**En tant que** développeur,
**Je veux** initialiser les repositories,
**Afin de** commencer le développement.

**Tâches:**
- [ ] Créer repo GitHub (frontend + backend)
- [ ] Configurer Next.js 14
- [ ] Configurer Express + TypeScript
- [ ] Setup MongoDB Atlas (cluster M0)
- [ ] CI/CD GitHub Actions
- [ ] Documentation README

---

### TECH-01.02: Tests Unitaires

**Priorité:** P0 | **Estimation:** 4h | **Sprint:** J2-14

**En tant que** développeur,
**Je veux** écrire des tests unitaires,
**Afin de** garantir la qualité du code.

**Tâches:**
- [ ] Setup Jest
- [ ] Tests services backend
- [ ] Tests composants React
- [ ] Coverage 80%+
- [ ] Integration CI

---

### TECH-01.03: Tests E2E

**Priorité:** P0 | **Estimation:** 4h | **Sprint:** J11

**En tant que** développeur,
**Je veux** écrire des tests E2E,
**Afin de** valider les flux complets.

**Tâches:**
- [ ] Setup Playwright
- [ ] Scénarios: inscription, recherche, fiche, avis, favoris
- [ ] Tests cross-browser
- [ ] Integration CI
- [ ] Screenshots échecs

---

### TECH-01.04: Déploiement

**Priorité:** P0 | **Estimation:** 3h | **Sprint:** J12

**En tant que** développeur,
**Je veux** déployer l'application,
**Afin de** la rendre accessible.

**Tâches:**
- [ ] Deploy frontend sur Vercel
- [ ] Deploy backend sur Render
- [ ] MongoDB Atlas production
- [ ] Variables d'environnement
- [ ] SSL/HTTPS
- [ ] Smoke tests production

---

### TECH-01.05: Documentation

**Priorité:** P1 | **Estimation:** 3h | **Sprint:** J13-14

**En tant que** développeur/mainteneur,
**Je veux** documenter le projet,
**Afin de** faciliter la maintenance.

**Tâches:**
- [ ] README.md complet
- [ ] API documentation
- [ ] Guide de déploiement
- [ ] Guide d'utilisation
- [ ] Attribution data.gouv.fr

---

## 📋 BACKLOG PRIORISÉ

### Sprint 1 (J1-7) - MVP Core
1. TECH-01.01 (Setup)
2. AUTH-01.01, AUTH-01.02 (Auth)
3. DATA-01.01, DATA-01.02, DATA-01.03, DATA-01.04 (Import data.gouv)
4. SEARCH-01.01, SEARCH-01.02 (Recherche + Filtres)
5. MAP-01.01, MAP-01.02, MAP-01.03 (Carte)
6. INFO-01.01 (Fiches établissements)

### Sprint 2 (J8-14) - Finalisation
1. REVIEW-01.01, REVIEW-01.02, REVIEW-01.03 (Avis)
2. FAVORI-01.01, FAVORI-01.02 (Favoris)
3. DASH-01.01, DASH-01.02, DASH-01.03, DASH-01.04 (Analytics)
4. TECH-01.02, TECH-01.03 (Tests)
5. TECH-01.04 (Deploy)
6. TECH-01.05 (Documentation)

---

## 🎯 DÉFINITION OF DONE

Une user story est **DONE** quand:
- [ ] Code implémenté et fonctionnel
- [ ] Tests unitaires passing
- [ ] Critères d'acceptation validés
- [ ] Code review effectué
- [ ] Documentation mise à jour
- [ ] Déployé en production (si sprint final)

---

*Mention légale: Cette plateforme utilise les données ouvertes de data.gouv.fr sous licence Open Database License (ODbL).*

*Document vivant - Dernière mise à jour: 27 Mars 2026*
