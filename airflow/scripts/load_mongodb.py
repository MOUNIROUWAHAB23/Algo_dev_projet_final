import os
import json
import sys
import time
import logging
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pymongo import MongoClient, UpdateOne, GEOSPHERE, TEXT, ASCENDING
from pymongo.collection import Collection
from pymongo.database import Database
from dotenv import load_dotenv

# ============================================
# 1. INFRASTRUCTURE : Configuration & Logging
# ============================================
class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage()
        }
        if hasattr(record, 'extra_data'):
            log_record.update(getattr(record, 'extra_data'))
        return json.dumps(log_record)

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        ch = logging.StreamHandler()
        ch.setFormatter(JSONFormatter())
        logger.addHandler(ch)
    return logger

logger = get_logger("MongoLoader")

# ============================================
# 2. DOMAINE : Transformation des données
# ============================================
class HebergementTransformer:
    """Responsabilité : Transformer une ligne brute en document métier."""
    
    KEYWORD_MAP = {
        'HOTEL': 'hotel', 'CAMPING': 'camping', 'RESIDENCE': 'apartment',
        'VILLAGE VACANCES': 'resort', 'MEUBLE': 'interior', 'CHAMBRE D HOTES': 'bedroom'
    }

    @staticmethod
    def safe_int(value: Any) -> Optional[int]:
        if pd.isna(value): return None
        val_str = str(value).strip()
        if not val_str or val_str in ['-', 'nan', 'NR', 'NC', 'None']: return None
        try:
            return int(float(val_str))
        except (ValueError, TypeError):
            return None

    @classmethod
    def transform(cls, row: pd.Series) -> Dict[str, Any]:
        hash_record = str(row.get('hash_record', ''))
        type_heb = str(row.get('type_hebergement', 'AUTRE'))

        # Coordonnées GeoJSON
        coordinates = None
        if pd.notna(row.get('latitude')) and pd.notna(row.get('longitude')) and row.get('latitude') != "":
            try:
                coordinates = {
                    "type": "Point",
                    "coordinates": [float(row['longitude']), float(row['latitude'])]
                }
            except ValueError:
                pass

        # Équipements
        try:
            equipements = json.loads(row.get('equipements', '[]'))
        except (json.JSONDecodeError, TypeError):
            equipements = []

        # Image générée
        img_keyword = cls.KEYWORD_MAP.get(type_heb.upper(), 'accommodation')
        sig_int = int(hash_record[:4], 16) if hash_record else 1
        image_cover_url = f"https://loremflickr.com/800/600/{img_keyword}?lock={sig_int}"

        return {
            "hash_record": hash_record,
            "identifiant_atout": str(row.get('identifiant_etablissement', '')),
            "nom": str(row.get('nom_hebergement', '')),
            "type": type_heb,
            "classification": cls.safe_int(row.get('classification_etoiles')),
            "image_cover": image_cover_url,
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
                "chambres": cls.safe_int(row.get('nombre_chambres')),
                "lits": cls.safe_int(row.get('nombre_lits'))
            },
            "metadata": {
                "source": str(row.get('source_donnees', 'ATOUT_FRANCE')),
                "date_classement": str(row.get('date_classement', '')),
                "imported_at": datetime.now(timezone.utc).isoformat()
            }
        }

# ============================================
# 3. INFRASTRUCTURE : Dépôt de données (Repository)
# ============================================
class MongoRepository:
    """Responsabilité : Interagir avec la base de données MongoDB."""
    
    def __init__(self, uri: str, db_name: str, collection_name: str):
        self.client: MongoClient = MongoClient(uri)
        self.db: Database = self.client[db_name]
        self.collection: Collection = self.db[collection_name]

    def setup_indexes(self) -> None:
        logger.info("Configuration des index MongoDB...")
        self.collection.create_index([("nom", TEXT), ("localisation.commune", TEXT), ("localisation.region", TEXT)], name="search_text_index")
        self.collection.create_index([("localisation.coordinates", GEOSPHERE)], name="geo_2dsphere_index")
        self.collection.create_index([("type", ASCENDING), ("localisation.region", ASCENDING)], name="compound_type_region_index")
        self.collection.create_index("hash_record", unique=True, name="unique_hash_index")

    def bulk_upsert(self, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        operations = [
            UpdateOne({'hash_record': doc['hash_record']}, {'$set': doc}, upsert=True)
            for doc in documents
        ]
        if not operations:
            return {}
            
        result = self.collection.bulk_write(operations, ordered=False)
        return {
            "inserted_count": result.upserted_count,
            "updated_count": result.modified_count,
            "matched_count": result.matched_count
        }

# ============================================
# 4. INFRASTRUCTURE : Rapports (Reporting)
# ============================================
class MetricsReporter:
    """Responsabilité : Écrire les rapports d'exécution dans le Data Lake."""
    
    def __init__(self, output_dir: str):
        self.output_dir = output_dir

    def save_report(self, metrics: Dict[str, Any]) -> None:
        os.makedirs(self.output_dir, exist_ok=True)
        report_path = os.path.join(self.output_dir, f"import_report_{datetime.now(timezone.utc).strftime('%Y%m%d')}.json")
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(metrics, f, indent=4)

# ============================================
# 5. APPLICATION : Cas d'usage principal (Service)
# ============================================
class DataLoaderService:
    """Responsabilité : Orchestrer le pipeline de chargement (Dependency Injection)."""
    
    def __init__(self, repository: MongoRepository, reporter: MetricsReporter):
        self.repository = repository
        self.reporter = reporter

    def execute(self, csv_path: str) -> bool:
        logger.info(f"Démarrage de l'import depuis {csv_path}")
        start_time = time.time()

        try:
            self.repository.setup_indexes()
            
            df = pd.read_csv(csv_path, dtype=str)
            df = df.where(pd.notnull(df), None)
            total_records = len(df)
            
            # Transformation via la classe dédiée
            documents = [HebergementTransformer.transform(row) for _, row in df.iterrows()]
            
            # Sauvegarde via le Repository
            logger.info(f"Exécution du BulkWrite pour {total_records} documents...")
            db_metrics = self.repository.bulk_upsert(documents)
            
            duration = round(time.time() - start_time, 2)
            metrics = {
                **db_metrics,
                "errors": 0,
                "duration_seconds": duration,
                "records_per_second": round(total_records / duration if duration > 0 else total_records, 2)
            }
            
            logger.info("Import terminé", extra={'extra_data': {'metrics': metrics}})
            
            # Rapport via la classe dédiée
            self.reporter.save_report(metrics)
            return True

        except Exception as e:
            logger.error("Erreur fatale durant le chargement", extra={'extra_data': {'error': str(e)}})
            return False

# ============================================
# POINT D'ENTRÉE DU SCRIPT
# ============================================
if __name__ == "__main__":
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
    load_dotenv(dotenv_path=env_path)

    # Variables d'environnement
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017/")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "algo_db")
    
    date_str = datetime.now(timezone.utc).strftime("%Y_%m_%d")
    input_csv = f"/opt/airflow/datalake/fichiers_traites/hebergements_atoutfrance_normalized_{date_str}.csv"
    report_dir = "/opt/airflow/datalake/metadata"

    # Validation initiale
    if not MONGO_URI:
        logger.error("MONGO_URI est introuvable.")
        sys.exit(1)
    if not os.path.exists(input_csv):
        logger.error(f"Fichier introuvable: {input_csv}")
        sys.exit(1)

    # Instanciation (Injection de dépendances)
    repo = MongoRepository(uri=MONGO_URI, db_name=MONGO_DB_NAME, collection_name="hebergements")
    reporter = MetricsReporter(output_dir=report_dir)
    service = DataLoaderService(repository=repo, reporter=reporter)

    # Exécution
    success = service.execute(csv_path=input_csv)
    if not success:
        sys.exit(1)