# 📋 ASSIGNMENT - Data Team Lead (Airflow & ETL)

**Rôle:** Data Analyst Lead - Orchestration & ETL Pipelines
**Durée Totale:** 36 heures (16h grille + 20h AVAIL-01)
**Dates:** 28 Mars - 5 Avril 2026
**Équipe:** 5 personnes (vous + 2 autres analysts + 2 fullstack devs)

---

## 🎯 PRIORITÉS

### **PRIORITÉ 1 (P1): Critères Grille d'Évaluation (/20 points)**
- ✅ Scraping (/3) - Récupérer données data.gouv.fr
- ✅ Nettoyage (/2) - Doublons, types corrects
- ✅ MongoDB (/2) - Collections cohérentes
- ✅ Data Warehouse (/3) - Tables structurées PostgreSQL
- ✅ Data Lake (/2) - Dossiers fichiers traités/non-traités
- ✅ Tests (/3) - Tests unitaires + intégration
- ❌ API REST (/2) - Backend (P3)
- ❌ SOLID (/3) - Code quality (P3)
- ❌ Soutenance (/2) - Prep (PM)

### **PRIORITÉ 2 (P2): Disponibilités Temps Réel (AVAIL-01)**
- Après P1 complétée
- DAG Airflow 30 min
- MongoDB collection availabilities
- Tests & validation

---

## 🎯 VOTRE MISSION

Vous êtes le **Data Team Lead**. Vous orchestrez les imports de données, développez les DAGs Airflow, et assurez que les données arrivent dans le DataLake.

---

## 📅 PHASE 0 - Immédiat (28 Mars, 1h)

### Tâche 0.1: DataLake Structure
**Durée:** 1 heure
**Importance:** CRITIQUE (bloque tout)

**Coordonné avec:** PM (qui lance le script)

**Votre travail:**
1. **Verifier le script s'est exécuté:**
```bash
# Vérifie que la structure existe
dir Algo_dev_rendu\datalake\

# Devrait voir:
# Volume in drive C has no label.
# Directory of C:\...\datalake
# 03/28/2026  fichiers_non_traites
# 03/28/2026  fichiers_traites
# 03/28/2026  archives
# 03/28/2026  status.log
# 03/28/2026  manifest.json
```

2. **Si le script a échoué, créer manuellement:**
```bash
mkdir Algo_dev_rendu\datalake\fichiers_non_traites
mkdir Algo_dev_rendu\datalake\fichiers_traites
mkdir Algo_dev_rendu\datalake\archives

# Créer status.json initial
echo { > Algo_dev_rendu\datalake\status.json
echo "status": "ready", >> Algo_dev_rendu\datalake\status.json
echo "lastUpdate": "2026-03-28T22:00:00Z" >> Algo_dev_rendu\datalake\status.json
echo } >> Algo_dev_rendu\datalake\status.json
```

3. **Vérifier permissions:**
```bash
# Assure que vous pouvez écrire dans ces dossiers
# Créer un fichier test
echo "test" > Algo_dev_rendu\datalake\fichiers_non_traites\test.txt
```

**Acceptance Criteria:**
- [ ] Dossiers créés et accessibles
- [ ] Permissions write OK
- [ ] status.json présent
- [ ] Prêt pour import data

**Blockers:** Aucun

---

## 📅 PHASE 1 - Airflow Setup (28-29 Mars = 2 jours, 9h)

### Tâche 1.1: Airflow DAG Development
**Durée:** 6 heures
**Importance:** CRITIQUE

**Description:**
Développer et tester les 3 DAGs Airflow pour l'import et traitement des données.

**DAGs découverts (80% complets):**

#### DAG 1: `import_hebergements_touristiques`
**Fréquence:** Quotidien 3h UTC
**Purpose:** Importer 45k+ hébergements depuis data.gouv.fr

**Étapes déjà codées:**
1. Download from data.gouv.fr API
2. Parse JSON
3. Normalize fields (encoding, types)
4. Geocode addresses
5. Load into MongoDB

**Votre travail (20% restant):**

```python
# airflow/dags/dag_import_hebergements.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
from pathlib import Path
import json
import requests
import pymongo

default_args = {
    'owner': 'data_team',
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'import_hebergements_touristiques',
    default_args=default_args,
    description='Import 45k accommodations from data.gouv.fr',
    schedule_interval='0 3 * * *',  # 3h UTC daily
    start_date=datetime(2026, 3, 28),
    catchup=False,
)

def download_data(**context):
    """Download from data.gouv.fr API"""
    url = "https://www.data.gouv.fr/api/datasets/d844cbc1-ac8b-4506-a5d3-5fde0301ecb1/resources/?format=json"
    response = requests.get(url)
    
    # Find CSV resource
    for resource in response.json()['data']:
        if 'csv' in resource['format'].lower():
            download_url = resource['url']
            break
    
    # Download file
    local_path = Path('/tmp/hebergements.csv')
    response = requests.get(download_url)
    local_path.write_bytes(response.content)
    
    # Save path for next task
    context['task_instance'].xcom_push(
        key='file_path',
        value=str(local_path)
    )
    
    return str(local_path)

def parse_and_normalize(**context):
    """Parse CSV and normalize data"""
    file_path = context['task_instance'].xcom_pull(
        task_ids='download_data',
        key='file_path'
    )
    
    import pandas as pd
    df = pd.read_csv(file_path, encoding='utf-8', sep=';')
    
    # Normalize columns
    df.columns = df.columns.str.lower().str.strip()
    
    # Filter required fields
    required = ['nom', 'adresse', 'codepostal', 'commune', 'type']
    df = df[required]
    
    # Save to datalake
    output_path = Path('/datalake/fichiers_non_traites/hebergements_raw.json')
    df.to_json(output_path, orient='records', force_ascii=False)
    
    context['task_instance'].xcom_push(
        key='normalized_path',
        value=str(output_path)
    )
    
    return {
        'record_count': len(df),
        'columns': list(df.columns)
    }

def geocode_addresses(**context):
    """Geocode addresses"""
    file_path = context['task_instance'].xcom_pull(
        task_ids='parse_and_normalize',
        key='normalized_path'
    )
    
    import json
    from geopy.geocoders import Nominatim
    
    with open(file_path) as f:
        records = json.load(f)
    
    geocoder = Nominatim(user_agent='hebergements_app')
    
    for record in records:
        try:
            location = geocoder.geocode(
                f"{record['adresse']} {record['commune']} {record['codepostal']}"
            )
            if location:
                record['latitude'] = location.latitude
                record['longitude'] = location.longitude
        except Exception as e:
            print(f"Geocoding failed for {record['nom']}: {e}")
            record['latitude'] = None
            record['longitude'] = None
    
    # Save geocoded data
    output_path = Path('/datalake/fichiers_traites/hebergements_geocoded.json')
    with open(output_path, 'w') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    
    return len(records)

def load_to_mongodb(**context):
    """Load into MongoDB"""
    file_path = Path('/datalake/fichiers_traites/hebergements_geocoded.json')
    
    import json
    client = pymongo.MongoClient('mongodb://localhost:27017')
    db = client['tourisme']
    
    with open(file_path) as f:
        records = json.load(f)
    
    # Clear old data (or use upsert)
    db['hebergements'].delete_many({})
    
    # Insert new records
    result = db['hebergements'].insert_many(records)
    
    # Create indexes
    db['hebergements'].create_index([('nom', 'text'), ('commune', 'text')])
    db['hebergements'].create_index([('latitude', 1), ('longitude', 1)])
    db['hebergements'].create_index('codePostal')
    
    return {
        'inserted_count': len(result.inserted_ids),
        'collection': 'hebergements'
    }

# Define tasks
download = PythonOperator(
    task_id='download_data',
    python_callable=download_data,
    dag=dag
)

normalize = PythonOperator(
    task_id='parse_and_normalize',
    python_callable=parse_and_normalize,
    dag=dag
)

geocode = PythonOperator(
    task_id='geocode_addresses',
    python_callable=geocode_addresses,
    dag=dag
)

load = PythonOperator(
    task_id='load_to_mongodb',
    python_callable=load_to_mongodb,
    dag=dag
)

# Define dependencies
download >> normalize >> geocode >> load
```

#### DAG 2: `recuperation_disponibilites`
**Fréquence:** Toutes les 30 minutes
**Purpose:** Récupérer les disponibilités en temps réel

**Stub (pour Phase 2):**
```python
# airflow/dags/dag_disponibilites.py
dag = DAG(
    'recuperation_disponibilites',
    schedule_interval='*/30 * * * *',  # Every 30 minutes
    start_date=datetime(2026, 3, 28),
    description='Real-time availability updates',
)

# Task: Fetch from external API
# Task: Normalize data
# Task: Store in MongoDB collection 'availabilities'
# Task: Update DataLake status
```

#### DAG 3: `data_lake_archivage`
**Fréquence:** Dimanches 5h UTC
**Purpose:** Archiver les fichiers > 30 jours

**Stub (pour Phase 2):**
```python
# airflow/dags/dag_archivage.py
dag = DAG(
    'data_lake_archivage',
    schedule_interval='0 5 * * 0',  # Sundays 5h UTC
    description='Archive old processed files',
)

# Task: Find files in fichiers_traites/ > 30 days old
# Task: Move to archives/
# Task: Cleanup manifest.json
```

**Votre travail:**

1. **Créer les 3 fichiers DAG** (3h)
   ```bash
   # Copy provided code into:
   airflow/dags/dag_import_hebergements.py
   airflow/dags/dag_disponibilites.py
   airflow/dags/dag_archivage.py
   ```

2. **Installer dépendances** (1h)
   ```bash
   cd airflow
   pip install -r requirements.txt
   # Should include: pandas, requests, geopy, pymongo
   ```

3. **Lancer Airflow** (1h)
   ```bash
   # Terminal 1: Airflow webserver
   airflow webserver --port 8080
   
   # Terminal 2: Airflow scheduler
   airflow scheduler
   
   # Terminal 3: Airflow triggerer (for async tasks)
   airflow triggerer
   ```

4. **Verifier DAGs dans UI** (1h)
   - Open http://localhost:8080
   - Look for 3 DAGs listed
   - Check for any syntax errors
   - Confirm schedule intervals

**Acceptance Criteria:**
- [ ] 3 DAGs créés et syntaxiquement correct
- [ ] Airflow UI affiche les DAGs
- [ ] Pas d'erreurs d'import
- [ ] Schedule intervals confirmés
- [ ] Prêt pour test (demain)

**Dépendances:**
- ✅ DataLake structure créée (Phase 0)
- ⚠️ MongoDB running (Fullstack #2 configure)

**Blockers:**
- ⚠️ MongoDB must be accessible

---

### Tâche 1.2: Data Validation & Deduplication Planning
**Durée:** 3 heures
**Importance:** HAUTE

**Description:**
Planifier la validation et déduplication des données importées.

**Steps:**

1. **Analyse des doublons possibles** (1h)
   ```python
   # Script: airflow/scripts/analyze_duplicates.py
   import pandas as pd
   import json
   
   # Read sample of data
   with open('/datalake/fichiers_traites/hebergements_geocoded.json') as f:
       records = json.load(f)
   
   df = pd.DataFrame(records)
   
   # Check duplicates by name
   duplicates_by_name = df[df['nom'].duplicated(keep=False)]
   print(f"Duplicates by name: {len(duplicates_by_name)}")
   
   # Check duplicates by coordinates
   duplicates_by_coords = df[df[['latitude', 'longitude']].duplicated(keep=False)]
   print(f"Duplicates by coordinates: {len(duplicates_by_coords)}")
   
   # Check duplicates by postal code + commune
   duplicates_by_location = df[df[['codepostal', 'commune']].duplicated(keep=False)]
   print(f"Duplicates by postal+commune: {len(duplicates_by_location)}")
   ```

2. **Créer stratégie de dédup** (1h)
   ```python
   # airflow/scripts/dedup_strategy.py
   def deduplicate_records(records):
       """
       Dedup strategy:
       1. Exact name + postal match → Merge (keep first, merge fields)
       2. Similar name (fuzzy match 95%) + same commune → Merge
       3. Same coordinates (within 100m) → Merge (keep higher quality)
       """
       from fuzzywuzzy import fuzz
       
       seen = {}
       merged = {}
       
       for record in records:
           key = (record['nom'].upper(), record['codepostal'])
           
           if key in seen:
               # Merge with existing
               existing = records[seen[key]]
               merged[key] = merge_records(existing, record)
           else:
               seen[key] = len(records)
               merged[key] = record
       
       return list(merged.values())
   
   def merge_records(rec1, rec2):
       """Keep best data from both records"""
       result = rec1.copy()
       
       # Take newer lat/lng if available
       if rec2.get('latitude') and not rec1.get('latitude'):
           result['latitude'] = rec2['latitude']
       
       # Merge amenities
       if 'amenities' in rec1 and 'amenities' in rec2:
           result['amenities'] = list(set(rec1['amenities'] + rec2['amenities']))
       
       return result
   ```

3. **Planifier le task dans DAG** (1h)
   - Ajouter step de déduplication dans `dag_import_hebergements.py`
   - Valider le nombre de records avant/après
   - Sauvegarder manifest avec stats

**Acceptance Criteria:**
- [ ] Script d'analyse créé et testé
- [ ] Stratégie de dédup documentée
- [ ] Prêt pour intégration dans DAG

---

## 📅 PHASE 1B - Airflow Testing (29 Mars = 1 jour, 5h)

### Tâche 1.3: DAG Testing & Validation
**Durée:** 4 heures
**Importance:** CRITIQUE

**Description:**
Tester les DAGs en local avant déploiement.

**Steps:**

1. **Test syntax** (30 min)
   ```bash
   # Test DAG file syntax
   airflow dags list
   
   # Should show all 3 DAGs without errors
   ```

2. **Unit test individual tasks** (2h)
   ```bash
   # Test import_hebergements task-by-task
   airflow tasks test import_hebergements_touristiques download_data 2026-03-29
   airflow tasks test import_hebergements_touristiques parse_and_normalize 2026-03-29
   airflow tasks test import_hebergements_touristiques geocode_addresses 2026-03-29
   airflow tasks test import_hebergements_touristiques load_to_mongodb 2026-03-29
   
   # Watch for errors in logs
   # tail -f ~/airflow/logs/import_hebergements_touristiques/...
   ```

3. **Full DAG test** (1h)
   ```bash
   # Test full DAG run
   airflow dags test import_hebergements_touristiques 2026-03-29
   
   # Verify:
   # - All tasks executed
   # - No errors
   # - Data in MongoDB
   ```

4. **Integration test** (30 min)
   ```bash
   # Check MongoDB has data
   mongosh
   use tourisme
   db.hebergements.countDocuments()
   
   # Should show: 45000+ documents
   
   # Check indexes
   db.hebergements.getIndexes()
   ```

**Acceptance Criteria:**
- [ ] Tous les DAGs listés sans erreur
- [ ] Tasks exécutés individuellement ✅
- [ ] Full DAG run réussi ✅
- [ ] 45000+ records dans MongoDB ✅
- [ ] Indexes créés ✅

**Blockers:**
- ⚠️ MongoDB must be running
- ⚠️ data.gouv.fr API must be accessible

---

### Tâche 1.4: DataLake Status & Monitoring
**Durée:** 1 heure
**Importance:** MOYENNE

**Description:**
Setup monitoring du DataLake et des imports.

**Votre travail:**

1. **Créer status.json tracking** (30 min)
   ```json
   {
     "status": "running",
     "lastUpdate": "2026-03-29T12:30:00Z",
     "imports": {
       "hebergements": {
         "status": "completed",
         "recordCount": 45123,
         "lastImport": "2026-03-29T03:00:00Z",
         "nextScheduled": "2026-03-30T03:00:00Z"
       },
       "disponibilites": {
         "status": "running",
         "lastUpdate": "2026-03-29T12:30:00Z",
         "nextScheduled": "2026-03-29T13:00:00Z"
       }
     },
     "dataLake": {
       "fichiers_non_traites_count": 2,
       "fichiers_traites_count": 15,
       "archives_count": 0,
       "diskUsage": "2.3 GB"
     }
   }
   ```

2. **Créer manifest.json pour chaque import** (30 min)
   ```json
   {
     "importId": "hebergements-2026-03-29",
     "type": "hebergements",
     "timestamp": "2026-03-29T03:00:00Z",
     "source": "data.gouv.fr",
     "recordCount": 45123,
     "fields": ["nom", "adresse", "commune", ...],
     "validation": {
       "totalRecords": 45123,
       "recordsWithGeoloc": 45000,
       "recordsWithMissingData": 123,
       "duplicatesRemoved": 50
     },
     "storage": {
       "fileSize": "125 MB",
       "path": "/datalake/fichiers_traites/hebergements-2026-03-29.json"
     }
   }
   ```

3. **Intégrer dans DAG**
   - Update manifest après chaque task
   - Log status après import complet

**Acceptance Criteria:**
- [ ] status.json créé et mis à jour par DAG
- [ ] manifest.json généré après chaque import
- [ ] Historique importations disponible

---

## 📅 PHASE 2 - Data Quality (30-31 Mars = 2 jours)

**NOTE:** Ces tâches sont partagées avec **Data Analyst #2 (Quality)**

### Tâche 2.7: Backend Data Validation
**Durée:** 2 heures (Shared)
**Coordonné avec:** Data Analyst #2 (Quality)

**Votre rôle:** Valider que les données importées sont correctes en MongoDB

```bash
# Check data integrity
mongosh
use tourisme

# Count records
db.hebergements.countDocuments()  # Should be 45000+

# Check for null values
db.hebergements.find({ "nom": null }).count()
db.hebergements.find({ "latitude": null }).count()

# Check data types
db.hebergements.findOne()

# Check indexes are used
db.hebergements.find({ "nom": /Paris/ }).explain()

# Check for duplicates
db.hebergements.aggregate([
  { $group: { _id: "$nom", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

# Should return empty (no duplicates after dedup)
```

---

## 📅 PHASE 2A - Data Warehouse (30-31 Mars = 2 jours, 10h) ⭐ GRILLE /3

### Tâche 2.8: Créer Data Warehouse PostgreSQL
**Durée:** 5 heures
**Importance:** 🔴 CRITIQUE (Grille: /3 points)

**Description:**
Créer un entrepôt de données structuré (PostgreSQL) avec tables normalisées, compatible Power BI. C'est différent du DataLake (fichiers bruts) et de MongoDB (NoSQL).

**Modèle Entrepôt Données:**

```sql
-- Database: tourisme_dw (Data Warehouse)

-- Dimension: Hébergements
CREATE TABLE dim_hebergements (
  id_hebergement SERIAL PRIMARY KEY,
  code_siret VARCHAR(14) UNIQUE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- hotel, camping, residence, meuble
  classe_tourisme VARCHAR(10),  -- 1-5 stars
  capacite_total INT,
  capacite_lits INT,
  adresse VARCHAR(500),
  code_postal VARCHAR(5),
  commune VARCHAR(100),
  departement VARCHAR(100),
  region VARCHAR(100),
  latitude FLOAT,
  longitude FLOAT,
  telephone VARCHAR(20),
  email VARCHAR(255),
  site_web VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Dimension: Localisation (pour jointures rapides)
CREATE TABLE dim_localisation (
  id_localisation SERIAL PRIMARY KEY,
  code_postal VARCHAR(5) NOT NULL,
  commune VARCHAR(100) NOT NULL,
  departement VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  UNIQUE(code_postal, commune)
);

-- Dimension: Type Hébergement
CREATE TABLE dim_type_hebergement (
  id_type SERIAL PRIMARY KEY,
  type_nom VARCHAR(50) NOT NULL UNIQUE,  -- hotel, camping, etc
  description VARCHAR(500)
);

-- Fact: Capacité Disponible (métriques clés)
CREATE TABLE fact_capacite (
  id_fact SERIAL PRIMARY KEY,
  id_hebergement INT NOT NULL REFERENCES dim_hebergements(id_hebergement),
  date_jour DATE NOT NULL,
  capacite_totale INT,
  capacite_occupee INT,
  taux_occupation FLOAT,
  chiffre_affaires FLOAT,
  created_at TIMESTAMP
);

-- Indexes pour perf
CREATE INDEX idx_hebergements_type ON dim_hebergements(type);
CREATE INDEX idx_hebergements_region ON dim_hebergements(region);
CREATE INDEX idx_hebergements_localisation ON dim_hebergements(latitude, longitude);
CREATE INDEX idx_hebergements_stars ON dim_hebergements(classe_tourisme);
CREATE INDEX idx_fact_date ON fact_capacite(date_jour);
```

**Étapes:**

1. **Installer PostgreSQL** (1h si pas déjà)
```bash
# Local: Download from postgresql.org
# Docker: docker pull postgres:15
# Windows: choco install postgresql
```

2. **Créer base de données DW** (1h)
```bash
psql -U postgres
CREATE DATABASE tourisme_dw;
\c tourisme_dw
# Exécuter le script SQL ci-dessus
```

3. **Script Python - ETL MongoDB → PostgreSQL** (2h)
```python
# airflow/scripts/load_dw.py
import psycopg2
from pymongo import MongoClient
from datetime import datetime

def load_hebergements_to_dw():
    """Load from MongoDB to PostgreSQL DW"""
    
    # Connect to MongoDB
    mongo_client = MongoClient('mongodb://localhost:27017')
    mongo_db = mongo_client['tourisme']
    hebergements = mongo_db['hebergements'].find()
    
    # Connect to PostgreSQL
    pg_conn = psycopg2.connect(
        host='localhost',
        database='tourisme_dw',
        user='postgres',
        password='postgres'
    )
    cursor = pg_conn.cursor()
    
    count = 0
    for hebergement in hebergements:
        try:
            cursor.execute("""
                INSERT INTO dim_hebergements 
                (code_siret, nom, type, classe_tourisme, capacite_total, 
                 capacite_lits, adresse, code_postal, commune, departement, 
                 region, latitude, longitude, telephone, email, site_web, 
                 created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                        %s, %s, %s, %s, %s)
            """, (
                hebergement.get('siret'),
                hebergement.get('nom'),
                hebergement.get('type'),
                hebergement.get('stars'),
                hebergement.get('capacite'),
                hebergement.get('lits'),
                hebergement.get('adresse'),
                hebergement.get('codePostal'),
                hebergement.get('commune'),
                hebergement.get('departement'),
                hebergement.get('region'),
                hebergement.get('latitude'),
                hebergement.get('longitude'),
                hebergement.get('telephone'),
                hebergement.get('email'),
                hebergement.get('siteWeb'),
                datetime.now(),
                datetime.now()
            ))
            count += 1
        except Exception as e:
            print(f"Error loading {hebergement.get('nom')}: {e}")
            continue
    
    pg_conn.commit()
    cursor.close()
    pg_conn.close()
    
    print(f"✅ Loaded {count} records to PostgreSQL DW")
    return count

if __name__ == "__main__":
    load_hebergements_to_dw()
```

4. **Tester Power BI Connection** (1h)
```
- Ouvrir Power BI Desktop
- New Data Source → PostgreSQL
- Server: localhost
- Database: tourisme_dw
- Load Tables: dim_hebergements, fact_capacite
- Créer un simple rapport (count by region)
- Vérifier refresh fonctionne
```

**Acceptance Criteria:**
- [ ] PostgreSQL running avec DB tourisme_dw
- [ ] 8 tables créées avec bon schéma
- [ ] 45000+ records chargés de MongoDB → PostgreSQL
- [ ] Tous les indexes créés
- [ ] Power BI peut se connecter et charger données
- [ ] Rapport simple (hébergements par région) fonctionnne
- [ ] Temps requête < 1s

**Dépendances:**
- ✅ MongoDB importé (Phase 1.3)

---

### Tâche 2.9: Tests Intégration - Data Pipeline
**Durée:** 5 heures
**Importance:** 🔴 CRITIQUE (Grille: /3 points Tests)

**Description:**
Écrire tests unitaires + intégration pour le pipeline ETL complet.

**Tests à écrire:**

```python
# tests/test_data_pipeline.py
import pytest
from pymongo import MongoClient
import psycopg2

# ===== TESTS UNITAIRES =====

def test_parse_csv():
    """Test parsing CSV data.gouv.fr"""
    from airflow.scripts.download import parse_csv
    
    data = parse_csv('test_data.csv')
    assert len(data) > 0
    assert 'nom' in data[0]
    assert 'adresse' in data[0]

def test_normalize_data():
    """Test data normalization"""
    from airflow.scripts.normalize import normalize_record
    
    record = {
        'nom': '  HOTEL PARIS  ',
        'codePostal': '75001',
        'stars': '5'
    }
    
    normalized = normalize_record(record)
    assert normalized['nom'] == 'HOTEL PARIS'
    assert normalized['codePostal'] == '75001'
    assert normalized['stars'] == 5  # int, not string

def test_detect_duplicates():
    """Test duplicate detection"""
    from airflow.scripts.dedup import detect_duplicates
    
    records = [
        {'siret': '12345', 'nom': 'Hotel A'},
        {'siret': '12345', 'nom': 'Hotel A'},  # duplicate
        {'siret': '67890', 'nom': 'Hotel B'}
    ]
    
    dupes = detect_duplicates(records)
    assert len(dupes) == 1
    assert dupes[0]['siret'] == '12345'

def test_geocode():
    """Test geocoding"""
    from airflow.scripts.geocode import geocode_address
    
    coords = geocode_address('1 Avenue Champs Élysées, 75008 Paris')
    assert coords['latitude'] is not None
    assert coords['longitude'] is not None
    assert abs(coords['latitude'] - 48.87) < 0.01

# ===== TESTS INTÉGRATION =====

@pytest.fixture
def mongo_client():
    client = MongoClient('mongodb://localhost:27017')
    yield client
    client.close()

def test_mongo_insert(mongo_client):
    """Test data insertion to MongoDB"""
    db = mongo_client['tourisme_test']
    col = db['hebergements']
    
    doc = {
        'nom': 'Test Hotel',
        'commune': 'Paris',
        'type': 'hotel',
        'latitude': 48.8566,
        'longitude': 2.3522
    }
    
    result = col.insert_one(doc)
    assert result.inserted_id is not None
    
    found = col.find_one({'_id': result.inserted_id})
    assert found['nom'] == 'Test Hotel'
    
    # Cleanup
    db.drop_collection('hebergements')

@pytest.fixture
def pg_conn():
    conn = psycopg2.connect(
        host='localhost',
        database='tourisme_dw_test',
        user='postgres',
        password='postgres'
    )
    yield conn
    conn.close()

def test_pg_insert(pg_conn):
    """Test data insertion to PostgreSQL DW"""
    cursor = pg_conn.cursor()
    
    cursor.execute("""
        INSERT INTO dim_hebergements 
        (code_siret, nom, type, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s)
    """, ('12345678901234', 'Test Hotel', 'hotel', 
          '2026-03-29', '2026-03-29'))
    
    pg_conn.commit()
    
    cursor.execute("SELECT * FROM dim_hebergements WHERE code_siret = %s", 
                   ('12345678901234',))
    row = cursor.fetchone()
    assert row is not None
    assert row[2] == 'Test Hotel'  # nom column

def test_pipeline_end_to_end():
    """Test full pipeline: CSV → MongoDB → PostgreSQL"""
    from airflow.scripts.full_pipeline import run_pipeline
    
    # Run pipeline
    result = run_pipeline('test_data.csv')
    
    # Verify MongoDB
    mongo = MongoClient('mongodb://localhost:27017')
    mongo_count = mongo['tourisme_test']['hebergements'].count_documents({})
    
    # Verify PostgreSQL
    pg = psycopg2.connect(...)
    cursor = pg.cursor()
    cursor.execute("SELECT COUNT(*) FROM dim_hebergements")
    pg_count = cursor.fetchone()[0]
    
    assert mongo_count > 0
    assert pg_count > 0
    assert mongo_count == pg_count

# Run tests
if __name__ == "__main__":
    pytest.main([__file__, '-v', '--cov=airflow'])
```

**Étapes:**

1. **Installer pytest + coverage** (30 min)
```bash
cd airflow
pip install pytest pytest-cov pytest-mock
```

2. **Écrire tests unitaires** (2h)
   - Tests parsing, normalization, dedup, geocode
   - Target: 80%+ coverage

3. **Écrire tests intégration** (1.5h)
   - Test MongoDB insert/query
   - Test PostgreSQL insert/query
   - Test full pipeline end-to-end

4. **Lancer tests + rapport coverage** (1h)
```bash
pytest tests/test_data_pipeline.py -v --cov=airflow
# Vérifier coverage > 80%
```

**Acceptance Criteria:**
- [ ] 20+ tests unitaires écrits et passent
- [ ] 5+ tests intégration écrits et passent
- [ ] Coverage: 80%+ (vérifier avec pytest-cov)
- [ ] Tous les critères grille testés
- [ ] Rapport coverage généré

**Dépendances:**
- ✅ ETL scripts complétés (Phase 1)

---

## 📅 PHASE 3 - Disponibilités Temps Réel (31 Mars - 1 Avril = 2 jours, 5h) ⭐ PRIORITÉ 2

### Tâche 2.1: MongoDB Collection - Disponibilités
**Durée:** 1 heure
**Importance:** CRITIQUE (bloque backend)

**Description:**
Créer la structure de stockage pour les disponibilités en temps réel.

**Votre travail:**

1. **Créer collection avec schema** (30 min)
```bash
mongosh
use tourisme

# Créer collection avec validators
db.createCollection("availabilities", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["hebergement_id", "date_debut", "date_fin", "status"],
      properties: {
        _id: { bsonType: "objectId" },
        hebergement_id: { bsonType: "string", description: "Reference à hebergements._id" },
        date_debut: { bsonType: "date" },
        date_fin: { bsonType: "date" },
        status: { enum: ["available", "unavailable", "unknown"], description: "Statut dispo" },
        updated_at: { bsonType: "date" },
        sync_batch_id: { bsonType: "string" },
        metadata: {
          bsonType: "object",
          properties: {
            prix_min: { bsonType: "double" },
            prix_max: { bsonType: "double" },
            nb_chambres: { bsonType: "int" }
          }
        }
      }
    }
  }
});
```

2. **Créer indexes** (20 min)
```bash
# CRITICAL pour perf!
db.availabilities.createIndex({ hebergement_id: 1 });
db.availabilities.createIndex({ date_debut: 1, date_fin: 1 });
db.availabilities.createIndex({ updated_at: -1 });
db.availabilities.createIndex({ status: 1 });

# Vérifier
db.availabilities.getIndexes();
```

3. **Seed test data** (10 min)
```bash
# Insérer 10 hébergements × 30 jours de données test
db.availabilities.insertMany([
  {
    hebergement_id: ObjectId("000000000000000000000001"),
    date_debut: new Date("2026-04-01"),
    date_fin: new Date("2026-04-02"),
    status: "available",
    updated_at: new Date(),
    sync_batch_id: "batch-001",
    metadata: {
      prix_min: 85,
      prix_max: 120,
      nb_chambres: 2
    }
  },
  // ... 299 autres documents
]);

# Vérifier
db.availabilities.countDocuments();  // Should be 300
```

**Acceptance Criteria:**
- [ ] Collection `availabilities` créée
- [ ] Schéma validators en place
- [ ] 4 indexes créés
- [ ] 300 documents test (10 × 30 jours)
- [ ] countDocuments() retourne 300

---

### Tâche 2.2: DAG Airflow Disponibilités
**Durée:** 2 heures
**Importance:** CRITIQUE

**Description:**
Configurer et tester le DAG `recuperation_disponibilites` pour mise à jour toutes les 30 min.

**Fichier:** `airflow/dags/dag_disponibilites.py`

**Votre travail:**

1. **Compléter le DAG** (1h)
```python
# airflow/dags/dag_disponibilites.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import requests
from pymongo import MongoClient
import os

default_args = {
    'owner': 'data_team',
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'timeout': 300,  # 5 min max
}

dag = DAG(
    'recuperation_disponibilites',
    default_args=default_args,
    description='Real-time availability updates every 30 min',
    schedule_interval='*/30 * * * *',  # CHAQUE 30 MIN!
    start_date=datetime(2026, 3, 28),
    catchup=False,
)

def fetch_and_upsert_availabilities(batch_id):
    """Fetch availabilities from external source and upsert to MongoDB"""
    
    # TODO: Identifier source données
    # Options: API externe, data.gouv.fr, web scraping, fichier CSV
    
    client = MongoClient(os.getenv('MONGODB_URL'))
    db = client[os.getenv('MONGODB_DB')]
    
    try:
        # 1. Récupérer données source
        # availability_data = fetch_from_api()  # TODO
        # OR
        # availability_data = fetch_from_csv()  # TODO
        # OR
        # availability_data = scrape_website()  # TODO
        
        # 2. Transformer format
        batch = transform_to_mongodb_format(availability_data, batch_id)
        
        # 3. Upsert en MongoDB (ne pas créer duplicates)
        for item in batch:
            db.availabilities.update_one(
                {
                    'hebergement_id': item['hebergement_id'],
                    'date_debut': item['date_debut'],
                    'date_fin': item['date_fin']
                },
                {'$set': item},
                upsert=True
            )
        
        print(f"✅ Updated {len(batch)} availability records")
        
        # 4. Log statut
        db.sync_logs.insert_one({
            'batch_id': batch_id,
            'timestamp': datetime.utcnow(),
            'status': 'success',
            'count': len(batch)
        })
        
        return len(batch)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.sync_logs.insert_one({
            'batch_id': batch_id,
            'timestamp': datetime.utcnow(),
            'status': 'failed',
            'error': str(e)
        })
        raise

def transform_to_mongodb_format(data, batch_id):
    """Transform raw data to MongoDB schema"""
    result = []
    for item in data:
        result.append({
            'hebergement_id': item.get('hebergement_id'),
            'date_debut': item.get('start_date'),
            'date_fin': item.get('end_date'),
            'status': 'available' if item.get('available', True) else 'unavailable',
            'updated_at': datetime.utcnow(),
            'sync_batch_id': batch_id,
            'metadata': {
                'prix_min': item.get('price_min'),
                'prix_max': item.get('price_max')
            }
        })
    return result

# Define task
task_fetch = PythonOperator(
    task_id='fetch_availabilities',
    python_callable=fetch_and_upsert_availabilities,
    op_kwargs={'batch_id': '{{ run_id }}'},
    dag=dag,
)

task_fetch
```

2. **Identifier et configurer source** (1h)
```bash
# TODO: Décider d'où viennent les disponibilités
# - data.gouv.fr: Il y a un dataset?
# - API externe: Booking, Airbnb, autre?
# - Fichier CSV: Qui le génère?
# - Web scraping: Quels sites?

# Créer docs/AVAILABILITY-SOURCE.md avec décision
```

**Acceptance Criteria:**
- [ ] DAG `recuperation_disponibilites` complété
- [ ] Schedule: `*/30 * * * *` confirmé
- [ ] Source données identifiée et documentée
- [ ] Script `update_availabilities.py` prêt
- [ ] Airflow UI montre le DAG sans erreur

---

### Tâche 2.3: Test DAG Disponibilités
**Durée:** 2 heures
**Importance:** HAUTE

**Description:**
Tester le DAG avec données test avant déploiement.

**Votre travail:**

1. **Test syntax** (30 min)
```bash
airflow dags test recuperation_disponibilites 2026-03-29

# Vérifier: pas d'erreurs d'import
```

2. **Test unitaire task** (30 min)
```bash
airflow tasks test recuperation_disponibilites fetch_availabilities 2026-03-29

# Vérifier logs: tail -f ~/airflow/logs/...
```

3. **Vérifier MongoDB** (1h)
```bash
mongosh
use tourisme

# Vérifier documents insérés
db.availabilities.countDocuments();

# Vérifier sync_logs
db.sync_logs.find().sort({timestamp: -1}).limit(1);

# Vérifier structure d'un document
db.availabilities.findOne();
```

**Acceptance Criteria:**
- [ ] DAG run sans erreur
- [ ] Documents insérés en MongoDB ✅
- [ ] sync_logs contient status success ✅
- [ ] Prêt pour scheduling

---

## 📊 RÉSUMÉ PHASE 2B

| Tâche | Durée | Status |
|-------|-------|--------|
| MongoDB collection | 1h | ⏳ |
| DAG configuration | 2h | ⏳ |
| DAG testing | 2h | ⏳ |
| **TOTAL** | **5h** | |

**Dépendance:** Phase 2 (Data Validation) complétée ✅

---



| Phase | Tâches | Durée | Status |
|-------|--------|-------|--------|
| 0 | DataLake Structure | 1h | ⏳ |
| 1 | DAG Development | 6h | ⏳ |
| 1 | Dedup Planning | 3h | ⏳ |
| 1B | DAG Testing | 4h | ⏳ |
| 1B | Status & Monitoring | 1h | ⏳ |
| 2 | Data Validation | 1h | ⏳ |
| **TOTAL** | **Data Orchestration & ETL** | **16h** | |

---

## 🎯 SUCCESS CRITERIA

- [ ] 3 DAGs créés et sans erreur
- [ ] 45000+ records importés dans MongoDB
- [ ] Indexes créés sur hebergements
- [ ] Pas de duplicates après import
- [ ] status.json et manifest.json tracking
- [ ] Tous les tests passent
- [ ] Prêt pour Phase 2 (temps réel)

---

**Assigné à:** Data Team Lead
**Créé:** 28 Mars 2026, 22:15 UTC
**Status:** 🟢 Ready after DataLake creation

**Next:** Créer DataLake physiquement, puis lancez DAG development! 🚀
