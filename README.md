# Plateforme d'Hébergements Touristiques - Open Data

> **Projet de Soutenance - Master Engineering**
>
> Une plateforme complète qui agrège, valorise et rend consultable les données ouvertes d'hébergements touristiques issues de data.gouv.fr

---

## Sommaire

1. [Vue d'ensemble](#-vue-densemble)
2. [Architecture](#-architecture)
3. [Démarrage Rapide avec Docker](#-démarrage-rapide-avec-docker)
4. [Installation Manuelle](#-installation-manuelle)
5. [Services et Ports](#-services-et-ports)
6. [Fonctionnalités](#-fonctionnalités)
7. [Documentation](#-documentation)
8. [Équipe](#-équipe)
9. [Roadmap](#-roadmap)

---

## Vue d'Ensemble

### Contexte

La France dispose d'un patrimoine touristique exceptionnel avec des milliers d'hébergements (hôtels, campings, résidences, meublés de tourisme). Les données sur ces hébergements sont publiques et accessibles sur **data.gouv.fr**, mais elles sont :
- dispersées dans de multiples datasets
- difficiles à comparer
- peu exploitables pour le grand public

### Solution

Une plateforme web qui **agrège, normalise et rend consultable** l'ensemble des données ouvertes d'hébergements touristiques :

- **Agrégation automatique** des datasets data.gouv.fr (10+ sources)
- **Moteur de recherche** avec filtres avancés
- **Carte interactive** Leaflet/OpenStreetMap
- **Dashboard analytics** avec statistiques par territoire
- **Système d'avis** communautaire
- **Favoris** pour sauvegarder ses établissements

### Données Sources

| Source | Type | Enregistrements |
|--------|------|-----------------|
| INSEE | Hôtels | ~18 000 |
| INSEE | Campings | ~8 000 |
| INSEE | Résidences hôtelières | ~2 000 |
| INSEE | Meublés de tourisme | ~15 000 |
| UNAJ | Auberges de jeunesse | ~500 |
| FTVAC | Villages vacances | ~1 000 |

**Total:** 45 000+ hébergements référencés

---

## Architecture

### Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTS (Navigateurs Web)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE (10 services)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Frontend   │  │   Backend   │  │   MongoDB               │ │
│  │  React+Nginx│  │   Node.js   │  │   Port: 27017           │ │
│  │  Port: 3500 │  │   Port: 3400│  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Airflow   │  │  PostgreSQL │  │  PostgreSQL DWH         │ │
│  │   Webserver │  │  (Airflow)  │  │  Port: 5433             │ │
│  │  Port: 8080 │  │  Port: 5432 │  │  (algo_db)              │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   Airflow   │  │  Metabase   │                              │
│  │  Scheduler  │  │  Port: 3000 │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React 18 + Vite + TailwindCSS + Leaflet |
| **Backend** | Node.js 20 + Express + TypeScript + Mongoose |
| **Database** | MongoDB 7 (données métier) |
| **Orchestration** | Apache Airflow (pipelines ETL) |
| **Data Warehouse** | PostgreSQL 15 (analytics) |
| **BI** | Metabase (dashboards) |
| **Containerisation** | Docker + Docker Compose |

---

## Démarrage Rapide avec Docker

### Prérequis

- Docker Desktop installé
- Docker Compose v2.0+
- 4GB RAM minimum recommandé
- 10GB d'espace disque libre

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/votre-user/votre-projet.git
cd Algo_dev_projet_final

# 2. Copier le fichier d'environnement
cp .env.exemple .env

# 3. Lancer tous les services
docker-compose up -d

# 4. Vérifier que les services sont démarrés
docker-compose ps
```

### Arrêter les services

```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION: données effacées)
docker-compose down -v
```

### Accéder aux interfaces

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Frontend** | http://localhost:3500 | - |
| **Backend API** | http://localhost:3400 | - |
| **Airflow UI** | http://localhost:8080 | airflow / airflow |
| **Metabase** | http://localhost:3000 | - |
| **MongoDB** | localhost:27017 | - |
| **PostgreSQL (Airflow)** | localhost:5432 | airflow / airflow |
| **PostgreSQL (DWH)** | localhost:5433 | dwh_user / dwh_password |

### Commandes Utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend

# Reconstruire après modifications
docker-compose up -d --build

# Redémarrer un service
docker-compose restart backend

# Exécuter une commande dans un container
docker-compose exec backend npm run dev

# Trigger un DAG Airflow manuellement
docker-compose exec airflow-webserver airflow dags trigger import_hebergements_touristiques
```

### Health Checks

Les services suivants disposent de health checks automatiques :

- **Frontend:** `http://localhost:3500/health`
- **Backend:** `http://localhost:3400/health`
- **Airflow:** `http://localhost:8080/health`
- **MongoDB:** Commande `mongosh --eval "db.adminCommand('ping')"`
- **PostgreSQL:** Commande `pg_isready -U airflow`

---

## Installation Manuelle

### Backend

```bash
cd backend
npm install
cp .env.exemple .env
# Éditer .env avec MONGODB_URI
npm run dev
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### Variables d'Environnement

**`.env` (racine):**
```bash
MONGO_URI=mongodb://localhost:27017/tourisme
POSTGRES_URI=postgresql://dwh_user:dwh_password@localhost:5433/algo_db
```

**`backend/.env`:**
```bash
MONGODB_URI=mongodb://localhost:27017/tourisme
JWT_SECRET=votre_secret_tres_long_et_secure
FRONTEND_URL=http://localhost:3500
PORT=3400
AIRFLOW_URL=http://localhost:8080
```

---

## Services et Ports

### Conteneurs Docker

| Service | Container | Port Host | Port Container | Réseau |
|---------|-----------|-----------|----------------|--------|
| Frontend | tourisme-frontend | 3500 | 80 | tourisme-network |
| Backend | tourisme-backend | 3400 | 3400 | tourisme-network |
| MongoDB | tourisme-mongodb | 27017 | 27017 | tourisme-network |
| Airflow Webserver | tourisme-airflow-webserver | 8080 | 8080 | tourisme-network |
| Airflow Scheduler | tourisme-airflow-scheduler | - | - | tourisme-network |
| PostgreSQL (Airflow) | tourisme-postgres | 5432 | 5432 | tourisme-network |
| PostgreSQL (DWH) | tourisme-postgres-dwh | 5433 | 5432 | tourisme-network |
| Metabase | tourisme-metabase | 3000 | 3000 | tourisme-network |

### Volumes Persistants

| Volume | Usage |
|--------|-------|
| `mongodb-data` | Données MongoDB |
| `mongodb-config` | Configuration MongoDB |
| `postgres-db-volume` | DB Airflow metadata |
| `postgres-dwh-volume` | Data Warehouse analytics |
| `metabase-data` | Dashboards Metabase |
| `data-lake-non-traitees` | Fichiers bruts data.gouv |
| `data-lake-traitees` | Fichiers traités |

---

## Fonctionnalités

### MVP Core (Semaine 1)

- [x] Agrégation automatique datasets data.gouv.fr
- [x] Moteur de recherche avec filtres
- [x] Carte interactive Leaflet
- [x] Fiches établissements détaillées
- [x] Authentification utilisateurs

### Fonctionnalités Avancées (Semaine 2)

- [x] Système d'avis et notations
- [x] Favoris personnalisés
- [x] Dashboard analytics
- [x] Export de données
- [x] Pipelines ETL Airflow

---

## Documentation

| Document | Description | Lien |
|----------|-------------|------|
| **Product Brief** | Vision produit, utilisateurs, périmètre | [documentation/01-Product-Brief.md](./documentation/01-Product-Brief.md) |
| **PRD** | Exigences fonctionnelles et techniques | [documentation/02-PRD.md](./documentation/02-PRD.md) |
| **Architecture** | Architecture technique complète | [documentation/03-Architecture.md](./documentation/03-Architecture.md) |
| **Epics & Stories** | Backlog détaillé des fonctionnalités | [documentation/04-Epics-and-Stories.md](./documentation/04-Epics-and-Stories.md) |
| **Roadmap** | Plan détaillé sur 14 jours | [documentation/05-Roadmap-14-Jours.md](./documentation/05-Roadmap-14-Jours.md) |

---

## Équipe (5 Développeurs)

| Rôle | Membre | Responsabilités |
|------|--------|-----------------|
| **PM/Lead Backend** | P1 | Architecture, Auth, API, Deployment |
| **Frontend Lead** | P2 | UI/UX, React, Responsive, Animations |
| **Backend Lead** | P3 | Base de données, APIs métier, MongoDB |
| **Fullstack Dev** | P4 | Maps, Data Pipeline, Notifications |
| **QA/UX/Docs** | P5 | Tests, Documentation, Support soutenance |

---

## Roadmap 14 Jours

### Semaine 1 : MVP Core

| Jour | Focus | Livrables |
|------|-------|-----------|
| **J1** | Cadrage & Initialisation | Repo, MongoDB, Comptes APIs |
| **J2** | Spécifications & Architecture | PRD, Architecture, Design System |
| **J3** | Authentification | Auth API, Pages Login/Register |
| **J4** | Import data.gouv.fr | 45 000+ hébergements en DB |
| **J5** | Recherche + Filtres | Moteur search, filtres multiples |
| **J6** | Carte Interactive | Leaflet, markers clusterisés |
| **J7** | Fiches Établissements | Pages détail, SEO |

### Semaine 2 : Finalisation

| Jour | Focus | Livrables |
|------|-------|-----------|
| **J8** | Avis + Favoris | Système reviews, favoris |
| **J9** | Dashboard Analytics | Stats, graphiques, export |
| **J10** | Bug Fixes & Polish UX | Stable, Performance |
| **J11** | Tests E2E & Sécurité | Suite Playwright, Audit OWASP |
| **J12** | Déploiement | Docker Compose fonctionnel |
| **J13** | Préparation Soutenance | PPT, Démo script, Vidéo |
| **J14** | Répétition & Buffer | PRÊT POUR SOUTENANCE |

---

## Critères de Succès

### Techniques
- [ ] Temps de chargement < 3s
- [ ] API response time < 500ms
- [ ] Test coverage 80%+
- [ ] 0 vulnérabilité critique
- [ ] 45 000+ hébergements en DB

### Métier (Démo)
- [ ] 10+ datasets data.gouv.fr agrégés
- [ ] Recherche fonctionnelle (texte + filtres + carte)
- [ ] Fiche établissement complète
- [ ] Système d'avis opérationnel
- [ ] Dashboard analytics avec graphiques

### Soutenance
- [ ] Présentation 10-15 min prête
- [ ] Démo live scénarisée
- [ ] Vidéo backup enregistrée
- [ ] README GitHub professionnel
- [ ] Documentation complète
- [ ] Attribution data.gouv.fr visible

---

## Licence

Projet académique - Master Engineering

**Mention légale:** Cette plateforme utilise les données ouvertes de data.gouv.fr sous licence [Open Database License (ODbL)](https://www.data.gouv.fr/fr/licences/).

---

**Dernière mise à jour:** 16 Avril 2026
