# 📅 Roadmap 14 Jours
# Plateforme d'Hébergements Touristiques - Open Data

**Version:** 3.0 - Avec React, Node.js, Airflow, Docker
**Date:** 27 Mars 2026
**Équipe:** 5 développeurs
**Stack:** React + Node.js + Airflow + MongoDB + Docker

---

## 👥 COMPOSITION DE L'ÉQUIPE

| Rôle | Membre | Responsabilités | Compétences |
|------|--------|-----------------|-------------|
| **P1 - PM/Lead Dev** | Membre 1 | Architecture, Backend API, Docker | Node.js, DevOps |
| **P2 - Frontend Lead** | Membre 2 | React, UI/UX, Responsive | React, Tailwind |
| **P3 - Backend/API** | Membre 3 | API Node.js, MongoDB | Express, Mongoose |
| **P4 - Airflow/Data** | Membre 4 | DAGs, Pipelines data.gouv | Airflow, Python |
| **P5 - QA/UX/Docs** | Membre 5 | Tests, Documentation, Metabase | Testing, BI |

---

## 📊 VUE D'ENSEMBLE

```
SEMAINE 1: MVP CORE
┌─────┬─────────────────────────────────────┬──────────┬─────────┐
│ Jour│ Focus                               │ Livrable │ Statut  │
├─────┼─────────────────────────────────────┼──────────┼─────────┤
│ J1  │ Setup Docker & Architecture         │ Compose  │ ⬜      │
│ J2  │ Backend API (Node.js) + MongoDB     │ API Base │ ⬜      │
│ J3  │ Frontend React + Auth               │ React App│ ⬜      │
│ J4  │ Airflow DAGs (import data.gouv)     │ Pipelines│ ⬜      │
│ J5  │ Recherche + Filtres API             │ Search   │ ⬜      │
│ J6  │ Carte Interactive (Leaflet)         │ Map      │ ⬜      │
│ J7  │ Fiches Établissements               │ Details  │ ⬜      │
└─────┴─────────────────────────────────────┴──────────┴─────────┘

SEMAINE 2: FINALISATION
┌─────┬─────────────────────────────────────┬──────────┬─────────┐
│ Jour│ Focus                               │ Livrable │ Statut  │
├─────┼─────────────────────────────────────┼──────────┼─────────┤
│ J8  │ Avis + Favoris                      │ Reviews  │ ⬜      │
│ J9  │ Metabase Dashboard + Analytics      │ BI       │ ⬜      │
│ J10 │ Bug Fixes & Polish UX               │ Stable   │ ⬜      │
│ J11 │ Tests E2E & Sécurité                │ Tests    │ ⬜      │
│ J12 │ Déploiement Docker                  │ Live     │ ⬜      │
│ J13 │ Préparation Soutenance              │ PPT/Demo │ ⬜      │
│ J14 │ Répétition & Buffer                 │ PRÊT     │ ⬜      │
└─────┴─────────────────────────────────────┴──────────┴─────────┘
```

---

# 🗓️ SEMAINE 1 : MVP CORE

---

## **JOUR 1 - Setup Docker & Architecture**

**Date:** Jour 1
**Objectif:** Mettre en place l'environnement Docker et l'architecture

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:00 | Kickoff - Lecture cahier des charges | Tous | Compréhension commune |
| 10:00-11:30 | Création structure projets | P1 + P3 | Dossiers frontend/backend/airflow |
| 11:30-13:00 | Écriture docker-compose.yml | P1 | Docker Compose complet |
| 13:00-14:00 | **Pause Déjeuner** | - | - |
| 14:00-15:30 | Dockerfile Frontend (React + Nginx) | P2 | Dockerfile frontend |
| 15:30-17:00 | Dockerfile Backend (Node.js) | P3 | Dockerfile backend |

### ✅ Checklist de Validation

- [ ] Structure dossiers créée (frontend/, backend/, airflow/)
- [ ] docker-compose.yml fonctionnel
- [ ] MongoDB container démarre
- [ ] PostgreSQL (Airflow) container démarre
- [ ] `docker-compose up -d` fonctionne
- [ ] README.md initialisé

### 📁 Fichiers à Créer

```
docker-compose.yml
frontend/Dockerfile
backend/Dockerfile
airflow/Dockerfile
.env (JWT_SECRET, AIRFLOW_UID)
```

### 🎯 Critères de Succès

- [ ] Tous les containers démarrent sans erreur
- [ ] MongoDB accessible sur localhost:27017
- [ ] Code pushé sur GitHub

---

## **JOUR 2 - Backend API (Node.js) + MongoDB**

**Date:** Jour 2
**Objectif:** Initialiser l'API Node.js et les modèles MongoDB

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | Setup projet Node.js + TypeScript | P3 | package.json, tsconfig |
| 10:30-12:00 | Schémas Mongoose (Hebergement, User) | P3 + P1 | Models MongoDB |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Routes API de base (CRUD) | P3 | Routes fonctionnelles |
| 14:30-16:00 | Middleware Auth (JWT) | P1 | Auth middleware |
| 16:00-17:00 | Tests API (Postman) | P5 | Collection Postman |

### ✅ Checklist de Validation

- [ ] Server Express fonctionnel (port 3001)
- [ ] Connection MongoDB établie
- [ ] Schémas Mongoose créés
- [ ] Endpoints CRUD hébergements
- [ ] Middleware JWT fonctionnel
- [ ] API testée avec Postman

### 📁 Fichiers à Créer

```
backend/
├── package.json
├── tsconfig.json
├── src/index.ts
├── src/models/Hebergement.ts
├── src/models/Utilisateur.ts
├── src/controllers/hebergement.controller.ts
├── src/routes/hebergement.routes.ts
└── src/middleware/auth.middleware.ts
```

### 🎯 Critères de Succès

- [ ] API répond sur localhost:3001
- [ ] CRUD hébergements fonctionnel
- [ ] Auth JWT opérationnelle

---

## **JOUR 3 - Frontend React + Auth**

**Date:** Jour 3
**Objectif:** Initialiser le frontend React et l'authentification

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | Setup projet React + Vite | P2 | App React fonctionnelle |
| 10:30-12:00 | Configuration TailwindCSS + Routing | P2 | UI de base |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Pages Login/Register | P2 + P4 | Pages auth |
| 14:30-16:00 | Intégration API Auth | P4 | Login fonctionnel |
| 16:00-17:00 | Tests frontend | P5 | Tests passing |

### ✅ Checklist de Validation

- [ ] App React démarre (Vite)
- [ ] TailwindCSS configuré
- [ ] React Router configuré
- [ ] Page Login fonctionnelle
- [ ] Page Register fonctionnelle
- [ ] Connexion API Auth
- [ ] Token JWT stocké (localStorage)

### 📁 Fichiers à Créer

```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── pages/Login.jsx
    └── pages/Register.jsx
```

### 🎯 Critères de Succès

- [ ] Frontend accessible sur localhost:80
- [ ] Login/Register fonctionnels
- [ ] Navigation entre pages

---

## **JOUR 4 - Airflow DAGs (Import data.gouv.fr)**

**Date:** Jour 4
**Objectif:** Configurer Airflow et les pipelines d'import

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | Config Docker Airflow | P1 | Airflow container OK |
| 10:30-12:00 | DAG import datasets | P4 | dag_import_hebergements.py |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Scripts Python (download, parse) | P4 | Scripts fonctionnels |
| 14:30-16:00 | Chargement MongoDB | P3 + P4 | Data in DB |
| 16:00-17:00 | Tests DAGs | P5 | DAGs successful |

### ✅ Checklist de Validation

- [ ] Airflow webserver accessible (localhost:8080)
- [ ] DAG `import_hebergements_touristiques` créé
- [ ] Scripts download_datasets.py fonctionnel
- [ ] Scripts parse_csv.py fonctionnel
- [ ] Données chargées dans MongoDB
- [ ] 45 000+ hébergements en DB

### 📁 Fichiers à Créer

```
airflow/
├── Dockerfile
├── requirements.txt
├── dags/
│   └── dag_import_hebergements.py
├── scripts/
│   ├── download_datasets.py
│   ├── parse_csv.py
│   ├── normalize_data.py
│   └── load_mongodb.py
└── plugins/
    └── operators/
        └── datagouv_operator.py
```

### 🎯 Critères de Succès

- [ ] Airflow UI accessible
- [ ] DAG exécuté avec succès
- [ ] Données visibles dans MongoDB

---

## **JOUR 5 - Recherche + Filtres API**

**Date:** Jour 5
**Objectif:** Implémenter le moteur de recherche et les filtres

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | API recherche full-text | P3 | GET /search |
| 10:30-12:00 | API filtres multiples | P3 | Filtres API |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Frontend SearchBar | P2 | SearchBar component |
| 14:30-16:00 | Frontend FilterPanel | P2 | FilterPanel |
| 16:00-17:00 | Tests recherche | P5 | Tests passing |

### ✅ Checklist de Validation

- [ ] GET /api/hebergements/search?q= fonctionnel
- [ ] GET /api/hebergements?type=&region= fonctionnel
- [ ] Index MongoDB créés (text, 2dsphere)
- [ ] SearchBar frontend fonctionnelle
- [ ] Filtres appliqués en temps réel
- [ ] Pagination des résultats

### 📁 Fichiers à Créer

```
backend/
├── src/controllers/search.controller.ts
└── src/services/hebergement.service.ts

frontend/
├── src/pages/Search.jsx
├── src/components/search/SearchBar.jsx
└── src/components/search/FilterPanel.jsx
```

### 🎯 Critères de Succès

- [ ] Recherche rapide (< 500ms)
- [ ] Filtres combinables
- [ ] Results pertinents

---

## **JOUR 6 - Carte Interactive (Leaflet)**

**Date:** Jour 6
**Objectif:** Implémenter la carte interactive avec Leaflet

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | Intégration Leaflet | P2 | Carte affichée |
| 10:30-12:00 | API géolocalisée (2dsphere) | P3 | GET /nearby |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Markers clusterisés | P2 + P4 | MarkerCluster |
| 14:30-16:00 | Géolocalisation utilisateur | P4 | "Autour de moi" |
| 16:00-17:00 | Tests carte + perf | P5 | Tests passing |

### ✅ Checklist de Validation

- [ ] Carte Leaflet affichée
- [ ] Tuiles OpenStreetMap
- [ ] Markers pour hébergements
- [ ] Clusterisation fonctionnelle
- [ ] API /api/hebergements/nearby fonctionnelle
- [ ] Géolocalisation navigateur

### 📁 Fichiers à Créer

```
frontend/
├── src/components/maps/MapView.jsx
├── src/components/maps/MarkerCluster.jsx
└── src/pages/Search.jsx (vue carte)
```

### 🎯 Critères de Succès

- [ ] Carte fluide avec 1000+ markers
- [ ] Clusterisation opérationnelle
- [ ] Performance: < 2s affichage

---

## **JOUR 7 - Fiches Établissements**

**Date:** Jour 7
**Objectif:** Créer les pages de détail des hébergements

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | API détail hébergement | P3 | GET /:id |
| 10:30-12:00 | Page détail React | P2 | Page dynamique |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Composants fiche | P4 | Detail components |
| 14:30-16:00 | Mini-carte + infos | P2 + P4 | Map + infos |
| 16:00-17:00 | Tests fiches | P5 | Tests passing |

### ✅ Checklist de Validation

- [ ] GET /api/hebergements/:id fonctionnel
- [ ] Page /hebergement/:id React
- [ ] Toutes informations affichées
- [ ] Mini-carte position
- [ ] Équipements listés
- [ ] Lien vers site officiel

### 📁 Fichiers à Créer

```
frontend/
├── src/pages/HebergementDetails.jsx
├── src/components/hebergement/HebergementCard.jsx
└── src/components/hebergement/EquipementsList.jsx
```

### 🎯 Critères de Succès

- [ ] Fiche complète et lisible
- [ ] Navigation fluide
- [ ] Mobile responsive

---

# 🗓️ SEMAINE 2 : FINALISATION

---

## **JOUR 8 - Avis + Favoris**

**Date:** Jour 8
**Objectif:** Implémenter les avis utilisateurs et les favoris

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | API avis (CRUD) | P3 | Endpoints reviews |
| 10:30-12:00 | API favoris (CRUD) | P3 | Endpoints favoris |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Formulaire dépôt avis | P2 | ReviewForm |
| 14:30-16:00 | Liste avis + bouton favori | P4 | ReviewList + Heart |
| 16:00-17:00 | Tests avis + favoris | P5 | Tests passing |

### ✅ Checklist de Validation

- [ ] POST /api/reviews fonctionnel
- [ ] GET /api/hebergements/:id/reviews fonctionnel
- [ ] POST /api/favoris fonctionnel
- [ ] GET /api/favoris (mes favoris) fonctionnel
- [ ] Note moyenne calculée (agrégation MongoDB)
- [ ] Formulaire avis accessible si connecté

### 📁 Fichiers à Créer

```
backend/
├── src/models/Review.ts
├── src/models/Favori.ts
└── src/controllers/review.controller.ts

frontend/
├── src/components/review/StarRating.jsx
├── src/components/review/ReviewForm.jsx
└── src/components/hebergement/FavoriteButton.jsx
```

### 🎯 Critères de Succès

- [ ] Avis créé uniquement par utilisateurs connectés
- [ ] Note moyenne correcte
- [ ] Favoris synchronisés

---

## **JOUR 9 - Metabase Dashboard + Analytics**

**Date:** Jour 9
**Objectif:** Configurer Metabase et les dashboards analytics

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | API analytics (agrégations) | P3 | Endpoints analytics |
| 10:30-12:00 | Configuration Metabase | P5 | Metabase connecté |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Dashboard stats par région | P5 | Dashboard Metabase |
| 14:30-16:00 | Graphiques frontend | P2 + P4 | Recharts components |
| 16:00-17:00 | Tests analytics | P5 | Tests passing |

### ✅ Checklist de Validation

- [ ] Metabase accessible (localhost:3000)
- [ ] Connection MongoDB configurée
- [ ] GET /api/analytics/regions fonctionnel
- [ ] GET /api/analytics/departements fonctionnel
- [ ] Dashboard Metabase créé
- [ ] Graphiques frontend (Recharts)

### 📁 Fichiers à Créer

```
backend/
└── src/controllers/analytics.controller.ts

frontend/
├── src/pages/Analytics.jsx
└── src/components/analytics/

metabase/
└── dashboards/ (export JSON)
```

### 🎯 Critères de Succès

- [ ] Metabase dashboard fonctionnel
- [ ] Stats exactes
- [ ] Graphiques fluides

---

## **JOUR 10 - Bug Fixes & Polish UX**

**Date:** Jour 10
**Objectif:** Corriger les bugs et améliorer l'UX

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | Chasse aux bugs | Tous | Bugs fixes |
| 10:30-12:00 | Amélioration UX/UI | P2 + P5 | UI polish |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Optimisation performance | P1 + P3 | Perf gains |
| 14:30-16:00 | Tests cross-browser | P4 | Compatibilité |
| 16:00-17:00 | Tests responsive | P5 | Responsive OK |

### ✅ Checklist de Validation

- [ ] Bugs critiques/majeurs corrigés
- [ ] UI cohérente
- [ ] Animations fluides (60fps)
- [ ] Temps de chargement < 3s
- [ ] API response time < 500ms
- [ ] Compatible Chrome, Firefox, Edge
- [ ] Responsive mobile/tablette/desktop

### 🎯 Critères de Succès

- [ ] 0 bug critique
- [ ] Navigation fluide
- [ ] Performance targets atteints

---

## **JOUR 11 - Tests E2E & Sécurité**

**Date:** Jour 11
**Objectif:** Valider les flux complets et auditer la sécurité

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | Tests E2E (Playwright) | P4 + P5 | Suite E2E |
| 10:30-12:00 | Security audit (OWASP) | P1 | Rapport sécurité |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Tests charge | P3 | Perf report |
| 14:30-16:00 | Validation RGPD | P5 | Compliance check |
| 16:00-17:00 | Correction vulnérabilités | P1 | Fixes appliqués |

### ✅ Checklist de Validation

- [ ] Scénario E2E: inscription → recherche → fiche → favoris
- [ ] Scénario E2E: connexion → dépôt avis
- [ ] Audit OWASP Top 10 effectué
- [ ] XSS protégé
- [ ] CSRF protégé
- [ ] NoSQL injection protégé (Mongoose)
- [ ] Consentement RGPD implémenté

### 📁 Fichiers à Créer

```
tests-e2e/
├── auth.spec.ts
├── search.spec.ts
├── hebergement.spec.ts
└── review.spec.ts

docs/
├── security-audit.md
└── rgpd-compliance.md
```

### 🎯 Critères de Succès

- [ ] 100% scénarios E2E passing
- [ ] 0 vulnérabilité critique
- [ ] RGPD compliant

---

## **JOUR 12 - Déploiement Docker**

**Date:** Jour 12
**Objectif:** Déployer l'application avec Docker

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | Build Docker images | P1 | Images créées |
| 10:30-12:00 | Configuration production | P1 + P3 | Env vars prod |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Démarrage tous services | P3 | Containers up |
| 14:30-16:00 | Smoke tests production | P5 | Production OK |
| 16:00-17:00 | Documentation déploiement | P5 | Guide déployé |

### ✅ Checklist de Validation

- [ ] `docker-compose up -d` fonctionnel
- [ ] Frontend accessible (port 80)
- [ ] Backend API accessible (port 3001)
- [ ] MongoDB connecté
- [ ] Airflow webserver accessible (port 8080)
- [ ] Metabase accessible (port 3000)
- [ ] Données importées dans MongoDB
- [ ] Smoke tests passing

### 📁 Fichiers à Créer

```
docker-compose.yml (final)
.env.production
docs/deployment-guide.md
```

### 🎯 Critères de Succès

- [ ] Application accessible publiquement
- [ ] 0 erreur dans les logs Docker
- [ ] Toutes les fonctionnalités opérationnelles

---

## **JOUR 13 - Préparation Soutenance**

**Date:** Jour 13
**Objectif:** Préparer les supports de soutenance

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | Création support (PPT/Canva) | P5 | Slides |
| 10:30-12:00 | Scénarisation démo live | P2 + P4 | Script démo |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | README professionnel | P1 | README.md |
| 14:30-16:00 | Préparation Q/R | Tous | FAQ |
| 16:00-17:00 | Vidéo démo (backup) | P4 | MP4 enregistré |

### ✅ Checklist de Validation

- [ ] Présentation 10-15 minutes (10-15 slides)
- [ ] Structure: Contexte → Solution → Démo → Technique → Conclusion
- [ ] Scénario démo écrit et rodé
- [ ] README.md GitHub complet
- [ ] FAQ avec réponses aux questions probables
- [ ] Vidéo démo enregistrée (5-10 min)
- [ ] Attribution data.gouv.fr visible

### 📁 Fichiers à Créer

```
soutenance/
├── presentation.pptx (ou .pdf)
├── demo-script.md
├── FAQ.md
└── video-demo.mp4

README.md (racine du repo)
```

### 🎯 Critères de Succès

- [ ] Présentation claire et professionnelle
- [ ] Timing maîtrisé (10-15 min)
- [ ] Démo sans accroc
- [ ] README GitHub professionnel

---

## **JOUR 14 - Répétition & Buffer**

**Date:** Jour 14
**Objectif:** Répéter la soutenance et gérer les imprévus

### 📋 Tâches du Jour

| Heure | Tâche | Responsable | Livrable |
|-------|-------|-------------|----------|
| 09:00-10:30 | Répétition soutenance | Tous | Rodage |
| 10:30-12:00 | Buffer pour ajustements | Tous | Fixes |
| 12:00-13:00 | **Pause Déjeuner** | - | - |
| 13:00-14:30 | Validation finale | P1 + P3 | Production OK |
| 14:30-16:00 | Dernière répétition | Tous | PRÊTS |
| 16:00-17:00 | 🎉 Célébration | Tous | 🍕 |

### ✅ Checklist de Validation

- [ ] Timing soutenance maîtrisé (10-15 min)
- [ ] Répartition parole claire
- [ ] Démo rodée (0 accroc)
- [ ] Production vérifiée (tout fonctionne)
- [ ] Backup vidéo testée
- [ ] Questions/Réponses préparées

### 🎯 Critères de Succès

- [ ] Équipe prête pour la soutenance
- [ ] Application fonctionnelle et déployée
- [ ] Supports de présentation prêts

---

## 📊 TABLEAU DE SUIVI DE PROGRESSION

### Progression par Jour

```
Jour    │ Objectif                    │ Statut │ Livrables │ Notes
────────┼─────────────────────────────┼────────┼───────────┼──────
J1      │ Setup Docker & Arch         │ ⬜     │ Compose   │
J2      │ Backend API + MongoDB       │ ⬜     │ API Base  │
J3      │ Frontend React + Auth       │ ⬜     │ React App │
J4      │ Airflow DAGs data.gouv      │ ⬜     │ Pipelines │
J5      │ Recherche + Filtres         │ ⬜     │ Search    │
J6      │ Carte Interactive           │ ⬜     │ Map       │
J7      │ Fiches Établissements       │ ⬜     │ Details   │
────────┼─────────────────────────────┼────────┼───────────┼──────
J8      │ Avis + Favoris              │ ⬜     │ Reviews   │
J9      │ Metabase + Analytics        │ ⬜     │ BI        │
J10     │ Bug Fixes & Polish          │ ⬜     │ Stable    │
J11     │ Tests E2E & Sécurité        │ ⬜     │ Tests     │
J12     │ Déploiement Docker          │ ⬜     │ Live      │
J13     │ Préparation Soutenance      │ ⬜     │ PPT/Demo  │
J14     │ Répétition & Buffer         │ ⬜     │ PRÊT      │
```

### Progression Globale

```
SEMAINE 1 (J1-J7)  : ████████░░░░░░░░  57%  - MVP Core fonctionnel
SEMAINE 2 (J8-J14) : ████████████████ 100%  - Produit fini + Soutenance
```

---

## 🎯 CRITÈRES DE SUCCÈS DU PROJET

### Techniques

| Critère | Cible | Mesure |
|---------|-------|--------|
| Temps de chargement | < 3s | Lighthouse |
| API response time | < 500ms | Monitoring |
| Test coverage | 80%+ | Jest/Coveralls |
| 0 vulnérabilité critique | OWASP audit | Security scan |
| Docker containers | 8/8 fonctionnels | docker-compose ps |
| Données importées | 45 000+ | MongoDB count |

### Métier (Démo)

| Critère | Cible | Mesure |
|---------|-------|--------|
| Datasets agrégés | 10+ | ImportLog count |
| Hébergements en DB | 45 000+ | MongoDB count |
| Recherche fonctionnelle | OK | Test manuel |
| Carte interactive | OK | Test manuel |
| Avis + Favoris | OK | Test manuel |
| Dashboard Metabase | OK | Test manuel |

### Soutenance

| Critère | Cible | Mesure |
|---------|-------|--------|
| Présentation | 10-15 min | Timing |
| Démo live | Sans accroc | Observation |
| Vidéo backup | Enregistrée | Fichier MP4 |
| README GitHub | Complet | Checklist |
| Documentation | Complète | Tous docs présents |
| Attribution data.gouv | Visible | Vérification |

---

## ⚠️ GESTION DES RISQUES

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Docker containers ne démarrent pas | Faible | Élevé | Logs, debug réseau Docker |
| Airflow DAGs échouent | Moyenne | Élevé | Retry logic, logs détaillés |
| API data.gouv.fr indisponible | Faible | Élevé | Cache local, retry logic |
| MongoDB quota dépassé | Faible | Moyen | Upgrade free tier → paid |
| Retard développement | Moyenne | Élevé | Buffer J10 et J14, scope flexible |
| Performance carte lente | Moyenne | Moyen | Cluster markers, pagination |

---

## 📁 RÉCAPITULATIF DES LIVRABLES

### Documents (dossier Algo_dev_rendu)

- [ ] 00-README.md
- [ ] 01-Product-Brief.md
- [ ] 02-PRD.md
- [ ] 03-Architecture.md (React + Node.js + Airflow + Docker)
- [ ] 04-Epics-and-Stories.md
- [ ] 05-Roadmap-14-Jours.md (ce fichier)

### Code

- [ ] Repository GitHub (frontend + backend + airflow)
- [ ] docker-compose.yml fonctionnel
- [ ] Dockerfiles (frontend, backend, airflow)
- [ ] DAGs Airflow fonctionnels
- [ ] Tests unitaires et E2E

### Soutenance

- [ ] Présentation (PPT/PDF)
- [ ] Démo live scénarisée
- [ ] Vidéo démo (backup)
- [ ] README.md professionnel
- [ ] Documentation technique

---

*Mention légale: Cette plateforme utilise les données ouvertes de data.gouv.fr sous licence Open Database License (ODbL).*

*Bonne chance pour votre projet ! 🚀*

*Dernière mise à jour: 27 Mars 2026*
