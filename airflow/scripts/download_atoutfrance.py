import os
import json
import logging
import hashlib
import requests
import pandas as pd
from datetime import datetime, timezone
import yaml
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configuration du log JSON
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

logger = logging.getLogger("AtoutFranceDownloader")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(JSONFormatter())
logger.addHandler(ch)

import os 

def load_config(config_path="atout_france_config.yaml"):
    # Calcule le chemin absolu du dossier où se trouve ACTUELLEMENT ce script Python
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Colle le nom du fichier YAML à ce chemin
    absolute_config_path = os.path.join(base_dir, config_path)
    
    with open(absolute_config_path, "r", encoding="utf-8") as file:
       return yaml.safe_load(file)

def get_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def download_file(url, dest_path, retries=3, timeout=300):
    session = requests.Session()
    retry_strategy = Retry(
        total=retries,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    try:
        logger.info(f"Début du téléchargement depuis {url}")
        response = session.get(url, timeout=timeout)
        response.raise_for_status()
        
        with open(dest_path, 'wb') as f:
            f.write(response.content)
            
        file_size = os.path.getsize(dest_path) / (1024 * 1024) # en MB
        logger.info("Téléchargement réussi", extra={'extra_data': {'file_size_mb': round(file_size, 2)}})
        return True
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement: {str(e)}")
        return False

def parse_and_validate(filepath, min_records):
    try:
        # Pandas engine='python' et sep=None permet la détection automatique du délimiteur
        df = pd.read_csv(filepath, sep=None, engine='python', encoding_errors='replace')
        record_count = len(df)
        
        if record_count < min_records:
            raise ValueError(f"Nombre de records insuffisant: {record_count} < {min_records}")
            
        # On force la sauvegarde en UTF-8 propre et avec un séparateur standard (virgule)
        df.to_csv(filepath, index=False, encoding='utf-8')
        
        return record_count, True
    except Exception as e:
        logger.error("Erreur de parsing/validation", extra={'extra_data': {'error': str(e)}})
        return 0, False

def main():
    config = load_config()
    date_str = datetime.now(timezone.utc).strftime("%Y_%m_%d")
    
    # Préparation du chemin de destination
    raw_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), config['storage']['raw_zone']))
    os.makedirs(raw_dir, exist_ok=True)
    
    filename = config['storage']['filename_pattern'].format(date=date_str)
    dest_path = os.path.join(raw_dir, filename)
    
    # 1. Téléchargement
    success_dl = download_file(
        url=config['source']['url'], 
        dest_path=dest_path, 
        retries=config['execution']['retries'], 
        timeout=config['execution']['timeout_seconds']
    )
    
    if not success_dl:
        return
        
    # 2. Parsing et Validation
    record_count, success_parse = parse_and_validate(dest_path, config['validation']['min_records'])
    
    if success_parse:
        file_hash = get_file_hash(dest_path)
        logger.info("Traitement ATOUT FRANCE terminé avec succès", extra={'extra_data': {
            'source': 'ATOUT_FRANCE',
            'record_count': record_count,
            'file_hash': file_hash,
            'file_path': dest_path,
            'status': 'SUCCESS'
        }})
    else:
        logger.error("Échec de la validation du fichier ATOUT FRANCE", extra={'extra_data': {'status': 'FAILED'}})

if __name__ == "__main__":
    main()