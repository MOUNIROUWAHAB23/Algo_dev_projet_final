import os
import sys
import time
import json
import logging
import threading
import requests
import psycopg2 # Pense à vérifier que psycopg2-binary est installé
import concurrent.futures
from datetime import datetime, timezone
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

# ============================================
# Configuration Logging
# ============================================
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

logger = logging.getLogger("Geocoding_Sync")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(JSONFormatter())
logger.addHandler(ch)

BAN_API_URL = "https://api-adresse.data.gouv.fr/search/"
thread_local = threading.local()

# ============================================
# Utilitaires de Connexion
# ============================================
def get_http_session():
    if not hasattr(thread_local, "session"):
        thread_local.session = requests.Session()
    return thread_local.session

def get_pg_connection(pg_uri):
    """Gère une connexion Postgres par thread pour la performance"""
    if not hasattr(thread_local, "pg_conn") or thread_local.pg_conn.closed:
        thread_local.pg_conn = psycopg2.connect(pg_uri)
        thread_local.pg_conn.autocommit = True
    return thread_local.pg_conn

# ============================================
# Logique Métier
# ============================================
def geocode_ban(adresse, code_postal, commune):
    addr = "" if adresse in ["None", None] else str(adresse)
    cp = "" if code_postal in ["None", None] else str(code_postal)
    com = "" if commune in ["None", None] else str(commune)
    
    session = get_http_session()
    query = f"{addr} {cp} {com}".strip()
    if not query: return None

    try:
        response = session.get(BAN_API_URL, params={'q': query, 'limit': 1}, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data['features']:
                feat = data['features'][0]
                return {
                    "lon": feat['geometry']['coordinates'][0],
                    "lat": feat['geometry']['coordinates'][1],
                    "region": feat['properties'].get('context', '').split(',')[-1].strip()
                }
    except Exception as e:
        logger.debug(f"Erreur API BAN: {e}")
    return None

def process_single_doc(doc, pg_uri):
    """Géocode et prépare les infos pour Mongo et Postgres"""
    loc = doc.get("localisation", {})
    cp = loc.get("code_postal")
    com = loc.get("commune")
    
    res = geocode_ban(loc.get("adresse"), cp, com)
    
    if res:
        # 1. Update PostgreSQL (Double écriture)
        try:
            conn = get_pg_connection(pg_uri)
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE dim_localisation 
                    SET latitude = %s, longitude = %s, region = %s
                    WHERE code_postal = %s AND commune = %s
                """, (res['lat'], res['lon'], res['region'], cp, com))
        except Exception as e:
            logger.error(f"Erreur Update Postgres: {e}")

        return doc["_id"], res
    return doc["_id"], None


# Pipeline Principal

def process_geocoding(mongo_uri, pg_uri, db_name="algo_db"):
    logger.info("Démarrage de la Synchronisation Mongo <-> Postgres")
    start_time = time.time()
    
    m_client = MongoClient(mongo_uri)
    m_db = m_client[db_name]
    collection = m_db["hebergements"]
    
    query = {"localisation.coordinates": None}
    cursor = list(collection.find(query).limit(2000)) # On en prend 2000 pour  démo
    total = len(cursor)
    
    if total == 0:
        logger.info("Tout est déjà synchronisé. Fin du script.")
        return True

    logger.info(f"{total} hôtels à synchroniser.")
    
    mongo_ops = []
    processed = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_doc = {executor.submit(process_single_doc, d, pg_uri): d for d in cursor}
        
        for future in concurrent.futures.as_completed(future_to_doc):
            doc_id, res = future.result()
            processed += 1
            
            if res:
                # Préparation du lot pour MongoDB
                geojson = {"type": "Point", "coordinates": [res['lon'], res['lat']]}
                mongo_ops.append(UpdateOne(
                    {"_id": doc_id}, 
                    {"$set": {
                        "localisation.coordinates": geojson,
                        "localisation.region": res['region']
                    }}
                ))

            if len(mongo_ops) >= 100:
                collection.bulk_write(mongo_ops, ordered=False)
                mongo_ops = []
                logger.info(f"Progression : {processed}/{total} synchronisés...")

    if mongo_ops:
        collection.bulk_write(mongo_ops, ordered=False)
        
    logger.info(f"Terminé en {round(time.time()-start_time, 2)}s.")
    return True

if __name__ == "__main__":
    load_dotenv()
    M_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017/")
    
    P_URI = os.getenv("POSTGRES_URI", "postgresql://dwh_user:dwh_password@postgres-dwh:5432/algo_db")
    
    try:
        process_geocoding(M_URI, P_URI)
    except Exception as e:
        logger.error(f"Erreur Fatale: {e}")
        sys.exit(1)