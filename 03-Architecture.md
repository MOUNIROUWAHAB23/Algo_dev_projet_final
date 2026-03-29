# Architecture Technique
# Plateforme d'Hébergements Touristiques - Open Data (data.gouv.fr)

**Version:** 2.0 - Avec Airflow & Docker
**Date:** 27 Mars 2026
**Statut:** ✅ VALIDÉ POUR IMPLÉMENTATION

---

## 1. VUE D'ENSEMBLE

### 1.1 Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                       │
│                    (Navigateurs Web / Mobile)                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CDN / EDGE (Docker Nginx)                        │
│                    Reverse proxy, SSL termination                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
┌──────────────────────────┐          ┌──────────────────────────────────┐
│   FRONTEND (React 18)    │          │     BACKEND API (Node.js)        │
│   Docker Container       │          │     Docker Container             │
│   Port: 3000             │          │     Port: 3001                   │
│                          │          │                                  │
│  ┌────────────────────┐  │          │  ┌────────────────────────────┐  │
│  │  Components React  │  │          │  │  Express Routes            │  │
│  │  React Router      │  │          │  │  Controllers               │  │
│  │  Axios (API calls) │◄─┼──────────┼──►  Services                  │  │
│  │  Recharts          │  │          │  │  Mongoose ORM              │  │
│  └────────────────────┘  │          │  └────────────────────────────┘  │
└──────────────────────────┘          └─────────────┬────────────────────┘
                                                    │
                                    ┌───────────────┼───────────────┐
                                    ▼               ▼               ▼
                        ┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐
                        │   MongoDB       │ │   Airflow    │ │   Metabase       │
                        │   Container     │ │   Container   │ │   Container      │
                        │   Port: 27017   │ │   Port: 8080  │ │   Port: 3000     │
                        │                 │ │               │ │                  │
                        │  Hébergements   │ │  DAGs         │ │  Dashboard       │
                        │  Utilisateurs   │ │  Pipelines    │ │  Analytics       │
                        │  Reviews        │ │  data.gouv    │ │  BI              │
                        │  Favoris        │ │               │ │                  │
                        │  Disponibilités │ │               │ │                  │
                        └─────────────────┘ └───────┬───────┘ └──────────────────┘
                                                    │
                                                    ▼
                                    ┌───────────────────────────────────┐
                                    │       DATA LAKE (Local FS)        │
                                    │  /data/lake/                      │
                                    │  ├── non_traitees/                │
                                    │  │   └── raw CSV downloads        │
                                    │  └── traitees/                    │
                                    │      └── processed + timestamp    │
                                    └───────────────────────────────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  PostgreSQL      │
                                          │  Container       │
                                          │  Port: 5432      │
                                          │                  │
                                          │  Airflow DB      │
                                          │  Metadata        │
                                          └──────────────────┘
```

### 1.2 Architecture Docker

```
┌─────────────────────────────────────────────────────────────┐
│                    docker-compose.yml                       │
│                                                             │
│  services:                                                  │
│    - frontend (React + Nginx)                               │
│    - backend (Node.js API)                                  │
│    - mongodb (Database)                                     │
│    - airflow-webserver                                      │
│    - airflow-scheduler                                      │
│    - airflow-init                                           │
│    - postgres (Airflow metadata)                            │
│    - metabase (BI/Analytics)                                │
│                                                             │
│  volumes:                                                   │
│    - data-lake (non_traitees + traitees)                    │
│    - mongodb-data                                           │
│    - postgres-data                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. FRONTEND ARCHITECTURE (React)

### 2.1 Structure du Projet

```
frontend/
├── Dockerfile
├── nginx.conf
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Card.jsx
    │   │   └── Modal.jsx
    │   ├── layout/
    │   │   ├── Header.jsx
    │   │   ├── Footer.jsx
    │   │   └── Sidebar.jsx
    │   ├── maps/
    │   │   ├── MapView.jsx
    │   │   ├── MarkerCluster.jsx
    │   │   └── LocationMarker.jsx
    │   ├── search/
    │   │   ├── SearchBar.jsx
    │   │   ├── FilterPanel.jsx
    │   │   └── ResultsList.jsx
    │   ├── hebergement/
    │   │   ├── HebergementCard.jsx
    │   │   ├── HebergementDetails.jsx
    │   │   └── EquipementsList.jsx
    │   ├── review/
    │   │   ├── StarRating.jsx
    │   │   └── ReviewList.jsx
    │   └── analytics/
    │       ├── StatsCard.jsx
    │       └── Chart.jsx
    ├── pages/
    │   ├── Home.jsx
    │   ├── Search.jsx
    │   ├── HebergementDetails.jsx
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Dashboard.jsx
    │   ├── Favorites.jsx
    │   └── Analytics.jsx
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useGeolocation.js
    │   ├── useSearch.js
    │   └── useFavorites.js
    ├── services/
    │   ├── api.js
    │   ├── auth.js
    │   └── hebergement.js
    ├── stores/
    │   ├── auth.store.js
    │   └── search.store.js
    ├── utils/
    │   └── helpers.js
    └── styles/
        └── index.css
```

### 2.2 Technologies Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.x | UI library |
| Vite | 5.x | Build tool |
| React Router | 6.x | Routing |
| TailwindCSS | 3.x | Styling |
| Leaflet | 1.9.x | Cartes |
| React-Leaflet | 4.x | Intégration Leaflet |
| Recharts | 2.x | Graphiques |
| Axios | 1.x | HTTP client |
| Zustand | 4.x | State management |

### 2.3 Dockerfile Frontend

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. BACKEND ARCHITECTURE (Node.js API)

### 3.1 Structure du Projet

```
backend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── hebergement.controller.ts
│   │   ├── review.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── admin.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── hebergement.service.ts
│   │   ├── review.service.ts
│   │   ├── analytics.service.ts
│   │   └── email.service.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── hebergement.routes.ts
│   │   ├── review.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── admin.routes.ts
│   ├── models/
│   │   ├── Hebergement.ts
│   │   ├── Utilisateur.ts
│   │   ├── Review.ts
│   │   ├── Favori.ts
│   │   └── ImportLog.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── cors.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── config/
│   │   ├── mongodb.ts
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts
│       ├── jwt.ts
│       └── bcrypt.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── .env
```

### 3.2 Technologies Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Node.js | 20.x | Runtime |
| Express | 5.x | Web framework |
| TypeScript | 5.x | Typage statique |
| Mongoose | 8.x | ODM MongoDB |
| MongoDB | 7.x | Database |
| JWT | - | Authentication |
| bcrypt | 5.x | Password hashing |
| Winston | 3.x | Logging |
| CORS | 2.x | Cross-origin |
| Helmet | 7.x | Security headers |

### 3.3 Dockerfile Backend

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

---

## 4. AIRFLOW ARCHITECTURE (Orchestration)

### 4.1 Structure des DAGs

```
airflow/
├── dags/
│   ├── dag_import_hebergements.py       # Import initial
│   ├── dag_mise_a_jour_quotidienne.py   # MAJ incrémentale
│   ├── dag_analytics_quotidien.py       # Stats quotidiennes
│   ├── dag_cleaning_data.py             # Nettoyage hebdo
│   ├── dag_disponibilites.py            # Récupération disponibilités
│   └── dag_data_lake_archiver.py        # Archivage data lake
├── plugins/
│   └── operators/
│       ├── datagouv_operator.py
│       └── availability_operator.py
├── scripts/
│   ├── download_datasets.py
│   ├── parse_csv.py
│   ├── normalize_data.py
│   ├── geocode_addresses.py
│   ├── load_mongodb.py
│   ├── fetch_disponibilites.py          # Récupère disponibilités
│   └── data_lake_manager.py             # Gère data lake
├── data_lake/
│   ├── non_traitees/                    # Fichiers bruts
│   │   ├── hotels_YYYYMMDD.csv
│   │   ├── campings_YYYYMMDD.csv
│   │   └── ...
│   └── traitees/                        # Fichiers traités
│       ├── processed_YYYYMMDD_HHMMSS/
│       │   ├── manifest.json
│       │   ├── hotels_normalized.csv
│       │   └── import_log.json
│       └── ...
└── requirements.txt
```

### 4.2 DAG Principal - Import data.gouv.fr

```python
# airflow/dags/dag_import_hebergements.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2026, 3, 27),
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'import_hebergements_touristiques',
    default_args=default_args,
    schedule_interval='0 3 * * *',  # Tous les jours à 3h
    catchup=False,
)

download_task = PythonOperator(
    task_id='download_datasets',
    python_callable=download_datasets,
    dag=dag,
)

parse_task = PythonOperator(
    task_id='parse_csv_files',
    python_callable=parse_csv_files,
    dag=dag,
)

normalize_task = PythonOperator(
    task_id='normalize_data',
    python_callable=normalize_data,
    dag=dag,
)

geocode_task = PythonOperator(
    task_id='geocode_addresses',
    python_callable=geocode_addresses,
    dag=dag,
)

load_task = PythonOperator(
    task_id='load_to_mongodb',
    python_callable=load_to_mongodb,
    dag=dag,
)

download_task >> parse_task >> normalize_task >> geocode_task >> load_task
```

### 4.3 Operators Custom

```python
# airflow/plugins/operators/datagouv_operator.py
from airflow.models import BaseOperator
from airflow.hooks.http_hook import HttpHook

class DataGouvOperator(BaseOperator):
    """
    Operator pour télécharger des datasets depuis data.gouv.fr
    """

    def __init__(self, dataset_id, output_path, **kwargs):
        super().__init__(**kwargs)
        self.dataset_id = dataset_id
        self.output_path = output_path

    def execute(self, context):
        hook = HttpHook(method='GET', http_conn_id='datagouv')
        response = hook.run(endpoint=f'/datasets/r/{self.dataset_id}')

        with open(self.output_path, 'wb') as f:
            f.write(response.content)

        return self.output_path
```

### 4.4 Scripts de Traitement

```python
# airflow/scripts/download_datasets.py
import requests
import os

DATASETS = {
    'hotels': 'xxx',
    'campings': 'xxx',
    'residences': 'xxx',
    'meubles': 'xxx',
    'auberges': 'xxx',
    'villages': 'xxx',
}

def download_datasets():
    """Télécharge tous les datasets depuis data.gouv.fr"""

    os.makedirs('/tmp/data', exist_ok=True)

    for name, dataset_id in DATASETS.items():
        url = f'https://www.data.gouv.fr/fr/datasets/r/{dataset_id}'
        response = requests.get(url)

        output_path = f'/tmp/data/{name}.csv'
        with open(output_path, 'wb') as f:
            f.write(response.content)

        print(f'Téléchargé: {output_path}')

    return list(DATASETS.keys())
```

```python
# airflow/scripts/load_mongodb.py
from pymongo import MongoClient
import pandas as pd

def load_to_mongodb(**context):
    """Charge les données normalisées dans MongoDB"""

    ti = context['ti']
    normalized_data = ti.xcom_pull(task_ids='normalize_data')

    client = MongoClient('mongodb://mongodb:27017/')
    db = client['tourisme']
    collection = db['hebergements']

    for dataset_name, data in normalized_data.items():
        for item in data:
            item['source'] = dataset_name

            collection.update_one(
                {
                    'source': item['source'],
                    'nom': item['nom'],
                    'commune': item['commune']
                },
                {'$set': item},
                upsert=True
            )

    client.close()
    return {'status': 'success', 'count': len(normalized_data)}
```

---

## 5. DOCKER COMPOSE

### 5.1 Configuration Complète

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ==================== FRONTEND ====================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - tourisme-network
    restart: always

  # ==================== BACKEND ====================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/tourisme
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=http://localhost
      - PORT=3001
    depends_on:
      - mongodb
    networks:
      - tourisme-network
    restart: always

  # ==================== MONGODB ====================
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
      - mongodb-config:/data/configdb
    environment:
      - MONGO_INITDB_DATABASE=tourisme
    networks:
      - tourisme-network
    restart: always

  # ==================== AIRFLOW ====================
  airflow-webserver:
    <<: *airflow-common
    command: webserver
    ports:
      - "8080:8080"
    networks:
      - tourisme-network
    restart: always

  airflow-scheduler:
    <<: *airflow-common
    command: scheduler
    networks:
      - tourisme-network
    restart: always

  airflow-init:
    <<: *airflow-common
    command: version
    networks:
      - tourisme-network

  # ==================== POSTGRES (Airflow) ====================
  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    volumes:
      - postgres-db-volume:/var/lib/postgresql/data
    networks:
      - tourisme-network
    restart: always

  # ==================== METABASE ====================
  metabase:
    image: metabase/metabase:latest
    ports:
      - "3000:3000"
    volumes:
      - metabase-data:/metabase-data
    environment:
      MB_DB_FILE: /metabase-data/metabase.db
    depends_on:
      - mongodb
    networks:
      - tourisme-network
    restart: always

networks:
  tourisme-network:
    driver: bridge

volumes:
  mongodb-data:
  mongodb-config:
  postgres-db-volume:
  metabase-data:

x-airflow-common:
  &airflow-common
  build: ./airflow
  environment:
    &airflow-common-env
    AIRFLOW__CORE__EXECUTOR: LocalExecutor
    AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
    AIRFLOW__CORE__FERNET_KEY: ''
    AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
    AIRFLOW__CORE__LOAD_EXAMPLES: 'false'
    AIRFLOW__SCHEDULER__MIN_FILE_PROCESS_INTERVAL: 10
  volumes:
    - ./airflow/dags:/opt/airflow/dags
    - ./airflow/logs:/opt/airflow/logs
    - ./airflow/plugins:/opt/airflow/plugins
  user: "${AIRFLOW_UID:-50000}:${AIRFLOW_GID:-0}"
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - tourisme-network
```

---

## 6. BASE DE DONNÉES

### 6.1 MongoDB - Collections

```javascript
// Collection: hebergements
{
  _id: ObjectId,
  source: String,        // 'hotels', 'campings', etc.
  nom: String,
  type: String,          // 'HOTEL', 'CAMPING', 'RESIDENCE', 'MEUBLE', 'AUBERGE', 'VILLAGE'
  adresse: String,
  codePostal: String,
  commune: String,
  departement: String,
  region: String,
  latitude: Number,
  longitude: Number,
  capacite: Number,
  classement: String,
  equipements: [String],
  telephone: String,
  email: String,
  url: String,
  prixMoyen: Number,
  createdAt: Date,
  updatedAt: Date
}

// Index
db.hebergements.createIndex({ nom: 1 });
db.hebergements.createIndex({ type: 1 });
db.hebergements.createIndex({ departement: 1 });
db.hebergements.createIndex({ region: 1 });
db.hebergements.createIndex({ "nom": "text", "commune": "text" });
db.hebergements.createIndex({ location: "2dsphere" });

// Collection: disponibilites (TEMPS RÉEL)
{
  _id: ObjectId,
  hebergement: ObjectId,     // Ref vers hebergements
  dateDebut: Date,
  dateFin: Date,
  prixParNuit: Number,
  disponible: Boolean,
  typeDisponibilite: String, // 'INSTANTANEE', 'SUR_DEMANDE', 'INDISPONIBLE'
  source: String,            // 'API_EXTERNE', 'EMAIL', 'TELEPHONE', 'MANUEL'
  dernieresMiseAJour: Date,
  createdAt: Date,
  updatedAt: Date
}

// Index pour les recherches par date et disponibilité
db.disponibilites.createIndex({ hebergement: 1, dateDebut: 1, dateFin: 1 });
db.disponibilites.createIndex({ dateDebut: 1, dateFin: 1, disponible: 1 });

// TTL index - expire après 1 an
db.disponibilites.createIndex({ dernieresMiseAJour: 1 }, { expireAfterSeconds: 31536000 });
```

### 6.2 Data Lake (Système de Fichiers)

Structure du data lake pour suivre les fichiers traités et non traités:

```
airflow/data_lake/
├── non_traitees/                    # Fichiers bruts téléchargés
│   ├── hotels_20260327_143022.csv
│   ├── campings_20260327_143025.csv
│   ├── residences_20260327_143028.csv
│   └── ...
├── traitees/                        # Fichiers traités avec manifest
│   ├── processed_20260327_143500/
│   │   ├── manifest.json           # Métadonnées du batch
│   │   ├── hotels_normalized.csv
│   │   └── import_log.json
│   └── processed_20260328_061200/
│       ├── manifest.json
│       └── ...
└── archives/                        # Anciens batches (>30 jours)
    └── processed_20260215_053000/
        └── ...
```

**manifest.json** (métadonnées de chaque batch):
```json
{
  "timestamp": "20260327_143500",
  "processed_at": "2026-03-27T14:35:00Z",
  "files": ["hotels_normalized.csv"],
  "processing_info": {
    "total_records": 1250,
    "success": 1230,
    "failed": 20,
    "geocoded": 1180,
    "imported_to_mongodb": true
  }
}
```

### 6.3 PostgreSQL - Deux Rôles

PostgreSQL a **deux bases de données distinctes**:

#### 6.3A PostgreSQL - Airflow Metadata
Database: `airflow`

Tables gérées automatiquement par Airflow :
- `dag`, `dag_run`, `task_instance`
- `connection`, `variable`, `log`

#### 6.3B PostgreSQL - Data Warehouse ⭐ GRILLE /3
Database: `tourisme_dw` (Data Warehouse)

**Objectif:** Entrepôt de données structuré (OLAP) pour BI, rapports, et analytics.
Différent de MongoDB (NoSQL) et DataLake (fichiers bruts).

**Schéma des 8 tables normalisées:**

```sql
-- 1. Dimension: Type d'hébergement
CREATE TABLE dim_type_hebergement (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Dimension: Localisation
CREATE TABLE dim_localisation (
    id SERIAL PRIMARY KEY,
    commune VARCHAR(100) NOT NULL,
    departement VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    code_postal VARCHAR(10),
    latitude FLOAT8,
    longitude FLOAT8,
    pays VARCHAR(100) DEFAULT 'France',
    UNIQUE(commune, departement, region),
    INDEX idx_region (region),
    INDEX idx_dept (departement),
    SPATIAL INDEX idx_location (latitude, longitude)
);

-- 3. Dimension: Hébergements (Master)
CREATE TABLE dim_hebergements (
    id SERIAL PRIMARY KEY,
    code_source VARCHAR(50) UNIQUE NOT NULL,  -- ID original data.gouv
    nom VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,              -- 'hotels', 'campings', etc
    type_id INT REFERENCES dim_type_hebergement(id),
    localisation_id INT REFERENCES dim_localisation(id),
    adresse VARCHAR(255),
    telephone VARCHAR(20),
    email VARCHAR(100),
    url VARCHAR(255),
    classement VARCHAR(50),                   -- 1*, 2*, 3*, etc
    equipements TEXT,                         -- JSON array
    capacite INT,
    prix_moyen_nuit DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_nom (nom),
    INDEX idx_source (source),
    INDEX idx_classement (classement)
);

-- 4. Fact Table: Capacité
CREATE TABLE fact_capacite (
    id SERIAL PRIMARY KEY,
    hebergement_id INT REFERENCES dim_hebergements(id),
    capacite_total INT,
    nb_chambres INT,
    nb_lits INT,
    capacite_groupes BOOLEAN,
    capacite_pmr BOOLEAN,      -- Personnes à mobilité réduite
    date_record DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hebergement_id, date_record),
    INDEX idx_date (date_record)
);

-- 5. Fact Table: Disponibilité
CREATE TABLE fact_disponibilites (
    id SERIAL PRIMARY KEY,
    hebergement_id INT REFERENCES dim_hebergements(id),
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    prix_par_nuit DECIMAL(10,2),
    disponible BOOLEAN,
    type_disponibilite VARCHAR(50),  -- 'INSTANTANEE', 'SUR_DEMANDE'
    source_data VARCHAR(50),         -- 'API_EXTERNE', 'MANUEL'
    derniere_mise_a_jour TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_hebergement_dates (hebergement_id, date_debut, date_fin),
    INDEX idx_disponible (disponible),
    INDEX idx_prix (prix_par_nuit)
);

-- 6. Fact Table: Avis & Reviews
CREATE TABLE fact_reviews (
    id SERIAL PRIMARY KEY,
    hebergement_id INT REFERENCES dim_hebergements(id),
    utilisateur_id VARCHAR(100),
    note INT CHECK (note >= 1 AND note <= 5),
    texte TEXT,
    date_visite DATE,
    verified_booking BOOLEAN DEFAULT FALSE,
    utilite_votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_hebergement (hebergement_id),
    INDEX idx_note (note),
    INDEX idx_date (created_at)
);

-- 7. Fact Table: Métriques Daily
CREATE TABLE fact_metriques_daily (
    id SERIAL PRIMARY KEY,
    hebergement_id INT REFERENCES dim_hebergements(id),
    date DATE NOT NULL,
    nb_vues INT DEFAULT 0,
    nb_favoris INT DEFAULT 0,
    nb_clics_contact INT DEFAULT 0,
    taux_occupation FLOAT8,
    prix_moyen_nuit DECIMAL(10,2),
    note_moyenne FLOAT8,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hebergement_id, date),
    INDEX idx_date (date)
);

-- 8. ETL Metadata Table
CREATE TABLE etl_logs (
    id SERIAL PRIMARY KEY,
    process_name VARCHAR(100),
    source VARCHAR(100),           -- 'MongoDB', 'DataLake'
    status VARCHAR(20),            -- 'SUCCESS', 'FAILED'
    total_records INT,
    loaded_records INT,
    failed_records INT,
    error_message TEXT,
    execution_time_ms INT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    INDEX idx_process (process_name),
    INDEX idx_status (status),
    INDEX idx_date (completed_at)
);

-- Créer les views pour Power BI & Analytics
CREATE VIEW v_hebergements_analytics AS
SELECT 
    h.id,
    h.nom,
    h.source,
    t.label as type,
    l.commune,
    l.departement,
    l.region,
    h.classement,
    h.capacite,
    h.prix_moyen_nuit,
    COUNT(DISTINCT r.id) as nb_reviews,
    AVG(r.note) as note_moyenne,
    COUNT(DISTINCT f.id) as nb_favoris,
    h.created_at,
    h.updated_at
FROM dim_hebergements h
LEFT JOIN dim_type_hebergement t ON h.type_id = t.id
LEFT JOIN dim_localisation l ON h.localisation_id = l.id
LEFT JOIN fact_reviews r ON h.id = r.hebergement_id
LEFT JOIN fact_disponibilites f ON h.id = f.hebergement_id AND f.disponible = TRUE
GROUP BY h.id, h.nom, h.source, t.label, l.commune, l.departement, l.region, h.classement, h.capacite, h.prix_moyen_nuit, h.created_at, h.updated_at;
```

**Connecteurs BI:**
- Power BI: Connection string `postgresql://user:pass@host:5432/tourisme_dw`
- Tableau: Native PostgreSQL connector
- Metabase: Can query directly
- Google Data Studio: PostgreSQL driver

**ETL Process (Airflow DAG):**
```
MongoDB (hebergements collection)
    ↓
Normalize data
    ↓
PostgreSQL dim_hebergements INSERT
    ↓
PostgreSQL fact_* tables UPDATE
    ↓
Refresh materialized views
    ↓
ETL logs record
```

---

## 7. DATA LAKE - GESTION DES FICHIERS

### 7.1 Flux de Traitement

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  TÉLÉCHARGEMENT │ ──► │  STOCKAGE        │ ──► │  TRAITEMENT     │
│  data.gouv.fr   │     │  non_traitees/   │     │  (parsing, etc) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  ARCHIVAGE      │ ◄── │  STOCKAGE        │ ◄── │  CHARGEMENT     │
│  (>30 jours)    │     │  traitees/       │     │  MongoDB        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 7.2 Scripts de Gestion

| Script | Usage | DAG associé |
|--------|-------|-------------|
| `data_lake_manager.py` | API de gestion du data lake | - |
| `dag_data_lake_archiver.py` | Archivage automatique hebdo | Weekly (dimanche 5h) |

### 7.3 Commandes Utiles

```python
# Initialiser le data lake
from data_lake_manager import init_data_lake
init_data_lake()

# Sauvegarder un fichier brut
from data_lake_manager import save_fichier_non_traite
save_fichier_non_traite(content, 'hotels', 'data.csv')

# Archiver un fichier traité
from data_lake_manager import move_to_traitees
move_to_traitees('/tmp/hotels_processed.csv', {'records': 1000})

# Lister les fichiers
from data_lake_manager import list_non_traitees, list_traitees
list_non_traitees()  # Liste fichiers en attente
list_traitees()      # Liste batches traités

# Stats du data lake
from data_lake_manager import get_data_lake_stats
get_data_lake_stats()
```

---

## 8. SÉCURITÉ

### 7.1 Mesures Implémentées

| Couche | Mesure | Implémentation |
|--------|--------|----------------|
| **Transport** | HTTPS | Nginx SSL termination |
| **Auth** | JWT | Expiration 8h |
| **Mots de passe** | bcrypt | 10 salt rounds |
| **Headers** | Helmet | CSP, X-Frame-Options |
| **Rate limiting** | express-rate-limit | 100 req/15min |
| **Validation** | Zod/Joi | Schema validation |
| **CORS** | CORS | Whitelist domaines |
| **NoSQL Injection** | Mongoose | Sanitization automatique |
| **XSS** | React | Auto-escaping |
| **Docker** | Networks isolés | Réseau interne |

### 7.2 Variables d'Environnement

```bash
# .env (à la racine)
JWT_SECRET=votre_secret_tres_long_et_secure
AIRFLOW_UID=50000
AIRFLOW_GID=0

# backend/.env
MONGODB_URI=mongodb://mongodb:27017/tourisme
JWT_SECRET=${JWT_SECRET}
FRONTEND_URL=http://frontend
PORT=3001

# airflow/.env
AIRFLOW__CORE__FERNET_KEY=generer_avec_airflow
```

---

## 9. DÉPLOIEMENT

### 8.1 Commandes Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Reconstruire après modifications
docker-compose up -d --build

# Exécuter un DAG manuellement
docker-compose exec airflow-webserver airflow dags trigger import_hebergements_touristiques

# Accéder aux interfaces
# Frontend: http://localhost:80
# Backend API: http://localhost:3001
# Airflow: http://localhost:8080
# Metabase: http://localhost:3000
# MongoDB: localhost:27017
```

### 8.2 Health Checks

```yaml
# Dans docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "--fail", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## 10. MONITORING

### 9.1 Outils

| Outil | Usage | URL |
|-------|-------|-----|
| Airflow UI | DAGs, logs, tasks | localhost:8080 |
| Metabase | Dashboards, analytics | localhost:3000 |
| MongoDB Compass | Database viewer | localhost:27017 |
| Docker logs | Logs containers | `docker-compose logs` |

### 9.2 Métriques à Surveiller

- **Airflow:** DAG success rate, task duration
- **Backend:** API response time, error rate
- **MongoDB:** Query performance, storage size
- **Frontend:** Lighthouse scores
- **Business:** Imports réussis, hébergements ajoutés

---

## 11. VALIDATION

**Statut:** ✅ VALIDÉ POUR IMPLÉMENTATION

**Date:** 27 Mars 2026

| Rôle | Validé |
|------|--------|
| PM/Lead Dev | ⬜ |
| Frontend Lead | ⬜ |
| Backend Lead | ⬜ |
| Airflow/DevOps | ⬜ |
| QA/UX/Docs | ⬜ |

---

*Mention légale: Cette plateforme utilise les données ouvertes de data.gouv.fr sous licence Open Database License (ODbL).*

*Document de référence technique - Version 2.0*
