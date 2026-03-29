# Product Requirements Document (PRD)
# Plateforme d'Hébergements Touristiques - Open Data

**Version:** 1.0
**Date:** 27 Mars 2026
**Statut:** ✅ PRÊT POUR DÉVELOPPEMENT

---

## 1. RÉSUMÉ EXÉCUTIF

### 1.1 Contexte

Projet de soutenance de Master Engineering visant à créer une plateforme d'agrégation et de valorisation des données ouvertes d'hébergements touristiques issues de data.gouv.fr.

### 1.2 Objectif

Développer en 14 jours une application web complète qui agrège, normalise et rend consultable l'ensemble des données d'hébergements touristiques (hôtels, campings, résidences, meublés) issues des datasets open data français.

### 1.3 Périmètre

- **Durée:** 14 jours
- **Équipe:** 5 développeurs
- **Stack:** Next.js 14, Node.js, PostgreSQL + PostGIS, Leaflet
- **Sources:** 10+ datasets data.gouv.fr (INSEE, UNAJ, FTVAC)
- **Cible:** MVP avec agrégation, recherche, carte, fiches, avis, analytics

---

## 2. EXIGENCES FONCTIONNELLES

### 2.1 Agrégation de Données data.gouv.fr

#### EPIC DATA-01: Import et Normalisation

**User Story DATA-01.01:** En tant que système, je veux importer les datasets depuis data.gouv.fr

**Critères d'acceptation:**
- [ ] Connexion API data.gouv.fr fonctionnelle
- [ ] Import automatique des datasets: hôtels, campings, résidences, meublés, auberges, villages vacances
- [ ] Parsing CSV/JSON des datasets
- [ ] Détection des doublons (SIRET, nom + commune)
- [ ] Log d'import avec statistiques

**User Story DATA-01.02:** En tant que système, je veux normaliser les données importées

**Critères d'acceptation:**
- [ ] Schéma commun pour tous types d'hébergements
- [ ] Géocodage des adresses sans GPS (Nominatim API)
- [ ] Normalisation des noms (uppercase, trim)
- [ ] Standardisation des codes postaux, départements, régions
- [ ] Mapping des équipements (nomenclature commune)

**User Story DATA-01.03:** En tant qu'admin, je veux planifier les mises à jour automatiques

**Critères d'acceptation:**
- [ ] Scheduler quotidien (node-cron)
- [ ] Détection des nouveaux enregistrements
- [ ] Mise à jour des établissements modifiés
- [ ] Notification en cas d'échec d'import
- [ ] Dashboard admin avec stats d'import

---

### 2.2 Recherche et Exploration

#### EPIC SEARCH-01: Trouver un Hébergement

**User Story SEARCH-01.01:** En tant que voyageur, je veux rechercher des hébergements par texte

**Critères d'acceptation:**
- [ ] Barre de recherche full-text (nom, commune, code postal)
- [ ] Autocomplétion des communes
- [ ] Historique des recherches (local)
- [ ] Résultats pertinents triés par score
- [ ] Suggestion de corrections orthographiques

**User Story SEARCH-01.02:** En tant que voyageur, je veux filtrer les résultats

**Critères d'acceptation:**
- [ ] Filtre par type (hôtel, camping, résidence, meublé, auberge, village vacances)
- [ ] Filtre par classement (étoiles: 1-5)
- [ ] Filtre par capacité (nombre de chambres/emplacements)
- [ ] Filtre par région/département
- [ ] Filtre par équipements (WiFi, parking, piscine, etc.)
- [ ] Filtre par note moyenne (1-5 étoiles)
- [ ] Application des filtres en temps réel

**User Story SEARCH-01.03:** En tant que voyageur, je veux voir les résultats sur une carte

**Critères d'acceptation:**
- [ ] Carte interactive Leaflet/OpenStreetMap
- [ ] Markers clusterisés (SuperCluster)
- [ ] Info window avec nom, type, étoiles, prix
- [ ] Click marker → fiche établissement
- [ ] Zoom et pan fluides
- [ ] Géolocalisation utilisateur ("autour de moi")

**User Story SEARCH-01.04:** En tant que voyageur, je veux sauvegarder mes favoris

**Critères d'acceptation:**
- [ ] Bouton "Cœur" sur chaque établissement
- [ ] Liste des favoris accessible (même sans compte)
- [ ] Synchronisation si connecté
- [ ] Export de la liste des favoris

---

### 2.3 Fiches Établissements

#### EPIC INFO-01: Consulter les Détails

**User Story INFO-01.01:** En tant que voyageur, je veux consulter la fiche détaillée d'un hébergement

**Critères d'acceptation:**
- [ ] Page dédiée avec URL unique (/hebergement/:id)
- [ ] Nom, type, classement étoiles
- [ ] Adresse complète avec carte
- [ ] Coordonnées (téléphone, email, site web)
- [ ] Capacité (chambres, emplacements)
- [ ] Liste des équipements
- [ ] Photos (si disponibles)
- [ ] Note moyenne et nombre d'avis
- [ ] Lien vers réservation (site officiel)

**User Story INFO-01.02:** En tant que voyageur, je veux voir les avis des autres voyageurs

**Critères d'acceptation:**
- [ ] Liste des avis triés par date
- [ ] Note globale et sous-notes (propreté, accueil, rapport qualité/prix, emplacement)
- [ ] Commentaire libre
- [ ] Date du séjour
- [ ] Badge "Séjour vérifié" si réservation confirmée
- [ ] Pagination des avis

---

### 2.4 Système d'Avis Communautaire

#### EPIC REVIEW-01: Déposer et Gérer les Avis

**User Story REVIEW-01.01:** En tant qu'utilisateur connecté, je veux déposer un avis

**Critères d'acceptation:**
- [ ] Formulaire accessible uniquement après connexion
- [ ] Note globale (1-5 étoiles)
- [ ] Sous-notes: propreté, accueil, rapport qualité/prix, emplacement
- [ ] Commentaire libre (min 50 caractères)
- [ ] Date du séjour (obligatoire)
- [ ] Upload de photos (optionnel)
- [ ] Validation modération (optionnel)

**User Story REVIEW-01.02:** En tant qu'utilisateur, je veux modifier/supprimer mon avis

**Critères d'acceptation:**
- [ ] Modification possible sous 30 jours
- [ ] Suppression avec confirmation
- [ ] Historique de mes avis

**User Story REVIEW-01.03:** En tant que propriétaire (futur), je veux répondre aux avis

**Critères d'acceptation:**
- [ ] Réponse affichée sous l'avis
- [ ] Badge "Réponse du propriétaire"
- [ ] Notification lors d'un nouvel avis

---

### 2.5 Dashboard Analytics

#### EPIC DASH-01: Statistiques et Analytics

**User Story DASH-01.01:** En tant qu'analyste, je veux voir les statistiques par territoire

**Critères d'acceptation:**
- [ ] Nombre d'hébergements par région
- [ ] Nombre d'hébergements par département
- [ ] Répartition par type (camembert)
- [ ] Répartition par classement étoiles
- [ ] Carte choroplèthe (densité par département)

**User Story DASH-01.02:** En tant qu'analyste, je veux voir l'évolution temporelle

**Critères d'acceptation:**
- [ ] Évolution du nombre d'hébergements (année par année)
- [ ] Évolution des capacités d'accueil
- [ ] Graphique temporel interactif

**User Story DASH-01.03:** En tant qu'analyste, je veux exporter les données

**Critères d'acceptation:**
- [ ] Export CSV complet
- [ ] Export Excel avec filtres
- [ ] Export JSON pour API
- [ ] Limitation: 1000 lignes gratuit, illimité avec compte

**User Story DASH-01.04:** En tant que professionnel, je veux voir les prix moyens

**Critères d'acceptation:**
- [ ] Prix moyen par type d'hébergement
- [ ] Prix moyen par région/département
- [ ] Prix moyen par classement étoiles
- [ ] Comparaison avec la moyenne nationale

---

### 2.6 Authentification et Compte Utilisateur

#### EPIC AUTH-01: Gestion des Comptes

**User Story AUTH-01.01:** En tant que visiteur, je veux créer un compte

**Critères d'acceptation:**
- [ ] Inscription avec email et mot de passe
- [ ] Validation email (format valide, unique)
- [ ] Mot de passe sécurisé (bcrypt)
- [ ] Token JWT généré
- [ ] Profil utilisateur basique

**User Story AUTH-01.02:** En tant qu'utilisateur, je veux me connecter

**Critères d'acceptation:**
- [ ] Connexion email + mot de passe
- [ ] Token JWT retourné
- [ ] Session persistante (8h)
- [ ] Déconnexion possible

**User Story AUTH-01.03:** En tant qu'utilisateur, je veux gérer mon profil

**Critères d'acceptation:**
- [ ] Modifier nom, prénom
- [ ] Changer mot de passe
- [ ] Supprimer mon compte (RGPD)
- [ ] Exporter mes données (RGPD)

---

### 2.7 Administration

#### EPIC ADMIN-01: Back-Office

**User Story ADMIN-01.01:** En tant qu'admin, je veux modérer les avis

**Critères d'acceptation:**
- [ ] Liste des avis signalés
- [ ] Valider/supprimer un avis
- [ ] Historique de modération

**User Story ADMIN-01.02:** En tant qu'admin, je veux gérer les imports de données

**Critères d'acceptation:**
- [ ] Lancer un import manuel
- [ ] Voir l'historique des imports
- [ ] Forcer la mise à jour d'un dataset

**User Story ADMIN-01.03:** En tant qu'admin, je veux voir les statistiques d'usage

**Critères d'acceptation:**
- [ ] Nombre de visiteurs
- [ ] Recherches populaires
- [ ] Établissements les plus consultés
- [ ] Inscriptions utilisateurs

---

## 3. EXIGENCES NON FONCTIONNELLES

### 3.1 Performance

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Temps de chargement page | < 3s | Lighthouse |
| API response time (p95) | < 500ms | Monitoring |
| Recherche full-text | < 1s | Benchmark |
| Affichage carte (1000 markers) | < 2s | Performance |
| Images optimisées | < 200KB | Audit |

### 3.2 Sécurité

| Exigence | Implémentation |
|----------|----------------|
| Authentification | JWT avec expiration 8h |
| Mots de passe | bcrypt (10 salt rounds) |
| HTTPS | Obligatoire en production |
| Données sensibles | Chiffrées en base |
| OWASP Top 10 | Audit et correction |
| RGPD | Consentement, droit à l'oubli |
| Rate limiting | 100 req/15min par IP |
| CORS | Whitelist domaines |

### 3.3 Disponibilité

- **Cible:** 99% uptime (hors maintenance)
- **Backup DB:** Quotidien automatique
- **Rollback:** Plan de retour arrière documenté

### 3.4 Scalabilité

- **Utilisateurs simultanés:** 100+ sans dégradation
- **Requêtes API:** 10 000/jour supportées
- **Database:** 100 000 hébergements (MongoDB Atlas free tier 512MB, upgrade possible)

---

## 4. MODÈLE DE DONNÉES

### 4.1 Schéma Entités Principales

```
┌─────────────────┐       ┌─────────────────┐
│   HEBERGEMENT   │       │    UTILISATEUR  │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ source          │       │ email           │
│ nom             │       │ password        │
│ type            │       │ role            │
│ adresse         │       │ createdAt       │
│ codePostal      │       └─────────────────┘
│ commune         │                │
│ departement     │                │
│ region          │                ▼
│ latitude        │       ┌─────────────────┐
│ longitude       │       │     FAVORI      │
│ capacite        │       ├─────────────────┤
│ classement      │       │ userId          │
│ equipements     │       │ hebergementId   │
│ telephone       │       └─────────────────┘
│ email           │
│ url             │              ▲
│ prixMoyen       │              │
│ updatedAt       │       ┌─────────────────┐
└─────────────────┘       │      REVIEW     │
        │                 ├─────────────────┤
        │                 │ id              │
        │                 │ userId          │
        │                 │ hebergementId   │
        │                 │ rating          │
        │                 │ comment         │
        │                 │ createdAt       │
        │                 └─────────────────┘
        │
        ▼
┌─────────────────┐
│   IMPORT_LOG    │
├─────────────────┤
│ id              │
│ dataset         │
│ recordsImported │
│ status          │
│ executedAt      │
└─────────────────┘
```

### 4.2 Collections MongoDB

| Collection | Documents | Index |
|------------|-----------|-------|
| hebergements | ~50 000+ | type, codePostal, commune, departement, region, 2dsphere (lat/lng), text (nom/commune) |
| utilisateurs | ~1 000+ | email (unique) |
| favoris | ~5 000+ | utilisateurId + hebergementId (unique) |
| reviews | ~10 000+ | hebergementId, utilisateurId |
| import_logs | ~100+ | dataset, executedAt |

---

## 5. API ENDPOINTS

### 5.1 Hébergements

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/hebergements | Liste avec filtres/pagination | ❌ |
| GET | /api/hebergements/:id | Détail un établissement | ❌ |
| GET | /api/hebergements/search?q= | Recherche full-text | ❌ |
| GET | /api/hebergements/nearby?lat=&lng=&radius= | Autour de moi | ❌ |

### 5.2 Authentification

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Inscription | ❌ |
| POST | /api/auth/login | Connexion | ❌ |
| POST | /api/auth/logout | Déconnexion | ✅ |
| GET | /api/auth/me | Profil courant | ✅ |
| PUT | /api/auth/password | Changer mot de passe | ✅ |

### 5.3 Avis (Reviews)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/hebergements/:id/reviews | Avis d'un établissement | ❌ |
| POST | /api/reviews | Créer un avis | ✅ |
| PUT | /api/reviews/:id | Modifier son avis | ✅ |
| DELETE | /api/reviews/:id | Supprimer son avis | ✅ |

### 5.4 Favoris

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/favoris | Mes favoris | ✅ |
| POST | /api/favoris | Ajouter un favori | ✅ |
| DELETE | /api/favoris/:id | Supprimer un favori | ✅ |

### 5.5 Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/analytics/regions | Stats par région | ❌ |
| GET | /api/analytics/departements | Stats par département | ❌ |
| GET | /api/analytics/types | Répartition par type | ❌ |
| GET | /api/analytics/evolution | Évolution temporelle | ❌ |
| GET | /api/analytics/export | Export CSV/Excel | ✅ |

### 5.6 Administration

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/admin/import | Lancer un import | ✅ Admin |
| GET | /api/admin/imports | Historique imports | ✅ Admin |
| GET | /api/admin/stats | Stats d'usage | ✅ Admin |
| PUT | /api/admin/reviews/:id/moderate | Modérer un avis | ✅ Admin |

---

## 6. USER INTERFACE

### 6.1 Pages Publiques

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page avec recherche + carte |
| Search | `/search` | Résultats de recherche (liste + carte) |
| Hébergement | `/hebergement/[id]` | Fiche détaillée établissement |
| Login | `/login` | Connexion |
| Register | `/register` | Inscription |

### 6.2 Pages Utilisateur

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Vue d'ensemble |
| Favoris | `/favoris` | Liste des favoris |
| Mes Avis | `/avis` | Historique des avis |
| Paramètres | `/settings` | Gestion compte |

### 6.3 Pages Analytics

| Page | Route | Description |
|------|-------|-------------|
| Analytics | `/analytics` | Dashboard statistiques |
| Export | `/export` | Export de données |

### 6.4 Administration

| Page | Route | Description |
|------|-------|-------------|
| Admin | `/admin` | Dashboard admin |
| Imports | `/admin/imports` | Gestion des imports data.gouv |
| Modération | `/admin/moderation` | Modération des avis |

---

## 7. CRITÈRES D'ACCEPTATION GLOBAUX

### 7.1 Fonctionnels

- [ ] Toutes les user stories implémentées
- [ ] Tous les critères d'acceptation validés
- [ ] Flux complet testé (recherche → fiche → avis)
- [ ] 0 bug bloquant ou majeur

### 7.2 Techniques

- [ ] Code review effectué
- [ ] Tests unitaires passing (80%+ coverage)
- [ ] Tests E2E passing
- [ ] Performance targets atteints
- [ ] Sécurité auditée (OWASP)

### 7.3 Données

- [ ] 10+ datasets data.gouv.fr importés
- [ ] 45 000+ hébergements en base
- [ ] Géocodage 100% des adresses
- [ ] Mise à jour automatique fonctionnelle

### 7.4 Documentation

- [ ] README.md complet
- [ ] API documentée (Swagger/OpenAPI)
- [ ] Guide de déploiement
- [ ] Guide d'utilisation
- [ ] Attribution data.gouv.fr visible

---

## 8. VALIDATION

**Statut:** ✅ PRÊT POUR DÉVELOPPEMENT

**Date de validation:** 27 Mars 2026

| Rôle | Validé |
|------|--------|
| PM/Lead Dev | ⬜ |
| Frontend Lead | ⬜ |
| Backend Lead | ⬜ |
| Fullstack Dev | ⬜ |
| QA/UX/Docs | ⬜ |

---

*Mention légale: Cette plateforme utilise les données ouvertes de data.gouv.fr sous licence Open Database License (ODbL).*

*Document de référence pour le développement - Version 1.0*
