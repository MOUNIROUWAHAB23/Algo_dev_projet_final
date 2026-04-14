import os
import sys
import time
import json
import logging
import threading
import requests
import psycopg2
import concurrent.futures
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from pymongo import MongoClient, UpdateOne
from pymongo.collection import Collection
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

logger = get_logger("Geocoding_Sync")

# ============================================
# 2. INFRASTRUCTURE : Client API Externe
# ============================================
class BANGeocodingClient:
    """Responsabilité : Interagir avec l'API Adresse (BAN) de manière Thread-Safe."""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self._thread_local = threading.local()

    def _get_session(self) -> requests.Session:
        if not hasattr(self._thread_local, "session"):
            self._thread_local.session = requests.Session()
        return self._thread_local.session

    def fetch_coordinates(self, adresse: str, code_postal: str, commune: str) -> Optional[Dict[str, Any]]:
        addr = "" if adresse in ["None", None] else str(adresse)
        cp = "" if code_postal in ["None", None] else str(code_postal)
        com = "" if commune in ["None", None] else str(commune)
        
        query = f"{addr} {cp} {com}".strip()
        if not query: 
            return None

        try:
            session = self._get_session()
            response = session.get(self.base_url, params={'q': query, 'limit': 1}, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('features'):
                    feat = data['features'][0]
                    return {
                        "lon": feat['geometry']['coordinates'][0],
                        "lat": feat['geometry']['coordinates'][1],
                        "region": feat['properties'].get('context', '').split(',')[-1].strip()
                    }
        except Exception as e:
            logger.debug(f"Erreur API BAN: {e}")
            
        return None

# ============================================
# 3. INFRASTRUCTURE : Repositories Bases de Données
# ============================================
class PostgresRepository:
    """Responsabilité : Exécuter les requêtes SQL de manière Thread-Safe."""
    
    def __init__(self, uri: str):
        self.uri = uri
        self._thread_local = threading.local()

    def _get_connection(self):
        if not hasattr(self._thread_local, "conn") or self._thread_local.conn.closed:
            self._thread_local.conn = psycopg2.connect(self.uri)
            self._thread_local.conn.autocommit = True
        return self._thread_local.conn

    def update_localisation(self, cp: str, commune: str, lat: float, lon: float, region: str) -> None:
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE dim_localisation 
                    SET latitude = %s, longitude = %s, region = %s
                    WHERE code_postal = %s AND commune = %s
                """, (lat, lon, region, cp, commune))
        except Exception as e:
            logger.error("Erreur Update Postgres", extra={'extra_data': {'error': str(e)}})


class MongoRepository:
    """Responsabilité : Interagir avec la base NoSQL."""
    
    def __init__(self, uri: str, db_name: str, collection_name: str):
        self.client = MongoClient(uri)
        self.collection: Collection = self.client[db_name][collection_name]

    def get_documents_without_coordinates(self, limit: int = 1000) -> List[Dict[str, Any]]:
        query = {"localisation.coordinates": None}
        return list(self.collection.find(query).limit(limit))

    def bulk_update(self, operations: List[UpdateOne]) -> None:
        if operations:
            self.collection.bulk_write(operations, ordered=False)

# ============================================
# 4. APPLICATION : Service d'Orchestration
# ============================================
class GeocodingSyncService:
    """Responsabilité : Orchestrer l'API, Postgres et MongoDB via Multithreading."""
    
    def __init__(self, mongo_repo: MongoRepository, pg_repo: PostgresRepository, geo_client: BANGeocodingClient, max_workers: int = 10):
        self.mongo_repo = mongo_repo
        self.pg_repo = pg_repo
        self.geo_client = geo_client
        self.max_workers = max_workers

    def _process_single_document(self, doc: Dict[str, Any]) -> Tuple[Any, Optional[Dict[str, Any]]]:
        """Fonction exécutée par chaque thread ouvrier."""
        doc_id = doc["_id"]
        loc = doc.get("localisation", {})
        cp = loc.get("code_postal")
        com = loc.get("commune")
        
        # 1. Appel API
        geo_data = self.geo_client.fetch_coordinates(loc.get("adresse"), cp, com)
        
        if geo_data:
            # 2. Mise à jour PostgreSQL (Double Écriture)
            self.pg_repo.update_localisation(
                cp=cp, commune=com, 
                lat=geo_data['lat'], lon=geo_data['lon'], region=geo_data['region']
            )
            return doc_id, geo_data
            
        return doc_id, None

    def execute(self, batch_limit: int = 1000) -> bool:
        logger.info("Démarrage de la Synchronisation Mongo <-> Postgres")
        start_time = time.time()
        
        documents = self.mongo_repo.get_documents_without_coordinates(limit=batch_limit)
        total = len(documents)
        
        if total == 0:
            logger.info("Tout est déjà synchronisé. Fin du script.")
            return True

        logger.info(f"{total} hébergements à synchroniser.")
        
        mongo_ops = []
        processed = 0

        # 3. Multithreading
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_doc = {executor.submit(self._process_single_document, d): d for d in documents}
            
            for future in concurrent.futures.as_completed(future_to_doc):
                doc_id, geo_data = future.result()
                processed += 1
                
                if geo_data:
                    # Préparation de l'opération Mongo
                    geojson = {"type": "Point", "coordinates": [geo_data['lon'], geo_data['lat']]}
                    mongo_ops.append(UpdateOne(
                        {"_id": doc_id}, 
                        {"$set": {
                            "localisation.coordinates": geojson,
                            "localisation.region": geo_data['region']
                        }}
                    ))

                # 4. Écriture par lots (Batch processing)
                if len(mongo_ops) >= 100:
                    self.mongo_repo.bulk_update(mongo_ops)
                    mongo_ops = []
                    logger.info(f"Progression : {processed}/{total} synchronisés...")

        # Écrire le reste
        self.mongo_repo.bulk_update(mongo_ops)
            
        logger.info(f"Terminé en {round(time.time()-start_time, 2)}s.")
        return True

# ============================================
# POINT D'ENTRÉE
# ============================================
if __name__ == "__main__":
    load_dotenv()
    
    # Configuration URI
    M_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017/")
    P_URI = os.getenv("POSTGRES_DWH_URI", os.getenv("POSTGRES_URI", "postgresql://dwh_user:dwh_password@postgres-dwh:5432/algo_db"))
    
    if not M_URI or not P_URI:
        logger.error("Erreur: Les variables d'environnement MONGO_URI ou POSTGRES_URI sont manquantes.")
        sys.exit(1)
        
    # Injection des dépendances (Dependency Injection)
    mongo_repository = MongoRepository(uri=M_URI, db_name="algo_db", collection_name="hebergements")
    postgres_repository = PostgresRepository(uri=P_URI)
    geocoding_client = BANGeocodingClient(base_url="https://api-adresse.data.gouv.fr/search/")
    
    service = GeocodingSyncService(
        mongo_repo=mongo_repository,
        pg_repo=postgres_repository,
        geo_client=geocoding_client,
        max_workers=10 # Limite pour ne pas surcharger l'API du Gouv
    )
    
    try:
        success = service.execute(batch_limit=5000) # Limite mode Démo pour éviter le bannissement
        if not success:
            sys.exit(1)
    except Exception as e:
        logger.error("Erreur Fatale", extra={'extra_data': {'error': str(e)}})
        sys.exit(1)