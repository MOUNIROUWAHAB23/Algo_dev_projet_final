import os
import json
import sys
import time
import logging
import pandas as pd
from datetime import datetime, timezone
from pymongo import MongoClient, UpdateOne, GEOSPHERE, TEXT, ASCENDING
from dotenv import load_dotenv # <-- NOUVEL IMPORT


env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(dotenv_path=env_path)


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage()
        }
        if hasattr(record, 'extra_data'):
            log_record.update(record.extra_data)
        return json.dumps(log_record)

logger = logging.getLogger("MongoLoader")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(JSONFormatter())
logger.addHandler(ch)


# Fonctions de Transformation

def safe_int(value):
    """Convertit proprement une valeur en entier, ignore les tirets et valeurs vides."""
    if pd.isna(value): 
        return None
    val_str = str(value).strip()
    # Si c'est vide ou si c'est un tiret (ou autre déchet courant)
    if not val_str or val_str in ['-', 'nan', 'NR', 'NC', 'None']: 
        return None
    try:
        return int(float(val_str))
    except (ValueError, TypeError):
        return None
def transform_row_to_document(row):
    """Transforme une ligne Pandas (plate) en document MongoDB (imbriqué)"""
    
    # Gestion sécurisée des coordonnées
    coordinates = None
    if pd.notna(row.get('latitude')) and pd.notna(row.get('longitude')) and row.get('latitude') != "":
        try:
            # MongoDB GeoJSON attend STRICTEMENT [longitude, latitude]
            coordinates = {
                "type": "Point",
                "coordinates": [float(row['longitude']), float(row['latitude'])]
            }
        except ValueError:
            pass

    # Parsing des équipements depuis le string JSON généré à l'étape précédente
    try:
        equipements = json.loads(row.get('equipements', '[]'))
    except:
        equipements = []

    # Construction du document
    document = {
        "hash_record": row.get('hash_record'), # Clé unique pour l'upsert
        "identifiant_atout": str(row.get('identifiant_etablissement', '')),
        "nom": str(row.get('nom_hebergement', '')),
        "type": str(row.get('type_hebergement', 'AUTRE')),
        "classification": safe_int(row.get('classification_etoiles')),
        
        "localisation": {
            "adresse": str(row.get('adresse_rue', '')),
            "code_postal": str(row.get('code_postal', '')),
            "commune": str(row.get('commune', '')),
            "departement": str(row.get('departement', '')),
            "region": str(row.get('region', '')),
            "coordinates": coordinates
        },
        
        "contact": {
            "telephone": str(row.get('telephone_contact', '')),
            "email": str(row.get('email_contact', '')),
            "site_web": str(row.get('site_web', ''))
        },
        
        "equipements": equipements,
        
        "capacite": {
            "chambres": safe_int(row.get('nombre_chambres')),
            "lits": safe_int(row.get('nombre_lits'))
        },
        
        "metadata": {
            "source": str(row.get('source_donnees', 'ATOUT_FRANCE')),
            "date_classement": str(row.get('date_classement', '')),
            "imported_at": datetime.now(timezone.utc).isoformat()
        }
    }
    return document


# Pipeline Principal


def load_to_mongodb(csv_path, mongo_uri, db_name="algo_db", collection_name="hebergements"):
    logger.info(f"Démarrage de l'import MongoDB depuis {csv_path}")
    start_time = time.time()

    # 1. Connexion MongoDB
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]
        logger.info("Connexion MongoDB réussie.")
    except Exception as e:
        logger.error("Échec de la connexion MongoDB", extra={'extra_data': {'error': str(e)}})
        return False

    # 2. Création des Index (Opération Idempotente)
    logger.info("Configuration des index MongoDB...")
    collection.create_index([("nom", TEXT), ("localisation.commune", TEXT), ("localisation.region", TEXT)], name="search_text_index")
    collection.create_index([("localisation.coordinates", GEOSPHERE)], name="geo_2dsphere_index")
    collection.create_index([("type", ASCENDING), ("localisation.region", ASCENDING)], name="compound_type_region_index")
    collection.create_index("hash_record", unique=True, name="unique_hash_index")

    # 3. Lecture des données
    try:
        df = pd.read_csv(csv_path, dtype=str)
        # Remplacer les NaN par None pour éviter les floats Bizarre dans MongoDB
        df = df.where(pd.notnull(df), None)
    except Exception as e:
        logger.error("Erreur de lecture CSV", extra={'extra_data': {'error': str(e)}})
        return False

    total_records = len(df)
    
    # 4. Préparation du BulkWrite (Upsert)
    operations = []
    for _, row in df.iterrows():
        doc = transform_row_to_document(row)
        # Upsert: Si 'hash_record' existe, on met à jour ($set), sinon on insère
        op = UpdateOne(
            {'hash_record': doc['hash_record']}, 
            {'$set': doc}, 
            upsert=True
        )
        operations.append(op)

    # 5. Exécution du BulkWrite
    try:
        logger.info(f"Exécution du BulkWrite pour {total_records} documents...")
        result = collection.bulk_write(operations, ordered=False)
        duration = round(time.time() - start_time, 2)
        
        metrics = {
            "inserted_count": result.upserted_count,
            "updated_count": result.modified_count,
            "matched_count": result.matched_count,
            "errors": 0,
            "duration_seconds": duration,
            "records_per_second": round(total_records / duration if duration > 0 else total_records, 2)
        }
        
        logger.info("Import MongoDB terminé", extra={'extra_data': {'metrics': metrics}})
        
        # 6. Archivage du rapport dans le Data Lake
        metadata_dir = '/opt/airflow/datalake/metadata'
        os.makedirs(metadata_dir, exist_ok=True)
        report_path = os.path.join(metadata_dir, f"import_report_{datetime.now(timezone.utc).strftime('%Y%m%d')}.json")
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(metrics, f, indent=4)
            
        return True

    except Exception as e:
        logger.error("Erreur durant le BulkWrite", extra={'extra_data': {'error': str(e)}})
        return False

if __name__ == "__main__":
    date_str = datetime.now(timezone.utc).strftime("%Y_%m_%d")
    base_dir = '/opt/airflow/datalake'
    input_csv = os.path.join(base_dir, f"fichiers_traites/hebergements_atoutfrance_normalized_{date_str}.csv")
    
    # Récupération sécurisée
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017/")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "algo_db")
    
    if not MONGO_URI:
        logger.error("La variable d'environnement MONGO_URI est introuvable.")
        sys.exit(1) # <--- Arrêt d'urgence
        
    elif os.path.exists(input_csv):
        # On capture le résultat (True ou False) de la fonction
        success = load_to_mongodb(input_csv, MONGO_URI, db_name=MONGO_DB_NAME)
        if not success:
            sys.exit(1) # <--- Si l'import ou la création du rapport plante, on tue la tâche Airflow !
            
    else:
        logger.error(f"Fichier normalisé introuvable: {input_csv}")
        sys.exit(1) # <--- Arrêt d'urgence