import os
import json
import sys
import logging
import pandas as pd
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
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

logger = get_logger("PostgresDWH")

# ============================================
# 2. INFRASTRUCTURE : Fichiers (Extract)
# ============================================
class FileRepository:
    """Responsabilité : Lecture des fichiers plats."""
    @staticmethod
    def read_csv(filepath: str) -> pd.DataFrame:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Le fichier {filepath} est introuvable.")
        return pd.read_csv(filepath, dtype=str)

# ============================================
# 3. DOMAINE : Transformation (Transform)
# ============================================
class DataTransformer:
    """Responsabilité : Préparation des données pour le Staging SQL."""
    
    @staticmethod
    def prepare_staging_data(df: pd.DataFrame) -> pd.DataFrame:
        """Convertit les types pour la compatibilité PostgreSQL."""
        numeric_cols = ['classification_etoiles', 'nombre_chambres', 'nombre_lits', 'latitude', 'longitude']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                
        if 'date_classement' in df.columns:
            df['date_classement'] = pd.to_datetime(df['date_classement'], errors='coerce', utc=True)
            
        return df

    @staticmethod
    def generate_date_dim(df_dates: pd.Series) -> pd.DataFrame:
        """Génère la dimension date avec la Smart Key YYYYMMDD."""
        dates = pd.to_datetime(df_dates, utc=True).dropna().dt.date.unique()
        dim = pd.DataFrame({'date_complete': dates})
        dim['date_complete'] = pd.to_datetime(dim['date_complete'], utc=True)
        dim['date_id'] = dim['date_complete'].dt.strftime('%Y%m%d').astype(int)
        dim['jour_semaine'] = dim['date_complete'].dt.dayofweek + 1
        dim['mois'] = dim['date_complete'].dt.month
        dim['trimestre'] = dim['date_complete'].dt.quarter
        dim['annee'] = dim['date_complete'].dt.year
        return dim

# ============================================
# 4. INFRASTRUCTURE : Base de Données (Load)
# ============================================
class SQLQueries:
    """Responsabilité : Stockage centralisé des requêtes SQL (Open/Closed Principle)."""
    
    INSERT_DIMS_DATE_TIME = """
        INSERT INTO dim_date (date_id, date_complete, jour_semaine, mois, trimestre, annee)
        SELECT date_id, date_complete, jour_semaine, mois, trimestre, annee FROM dim_date_staging
        ON CONFLICT (date_id) DO NOTHING;
        
        INSERT INTO dim_temps (temps_id, heure, minute)
        VALUES (:t_id, :h, :m)
        ON CONFLICT (temps_id) DO NOTHING;
    """

    INSERT_DIM_LOCALISATION = """
        INSERT INTO dim_localisation (adresse_rue, code_postal, commune, departement_code, region, latitude, longitude)
        SELECT DISTINCT adresse_rue, code_postal, commune, departement, region, latitude, longitude
        FROM staging_atout_france
        WHERE code_postal IS NOT NULL AND commune IS NOT NULL
        ON CONFLICT (adresse_rue, code_postal, commune) DO NOTHING;
    """

    INSERT_DIM_HEBERGEMENT = """
        INSERT INTO dim_hebergement (hash_record, nom, type_hebergement, classification, nb_chambres, nb_lits, contact_email, contact_telephone, site_web)
        SELECT DISTINCT hash_record, nom_hebergement, type_hebergement, classification_etoiles, nombre_chambres, nombre_lits, email_contact, telephone_contact, site_web
        FROM staging_atout_france
        WHERE hash_record IS NOT NULL
        ON CONFLICT (hash_record) DO UPDATE 
        SET classification = EXCLUDED.classification, nb_chambres = EXCLUDED.nb_chambres, nb_lits = EXCLUDED.nb_lits;
    """

    INSERT_FACT_HEBERGEMENT = """
        INSERT INTO fact_hebergement (hebergement_id, localisation_id, date_classement_id, date_import_id, temps_import_id, classification_actuelle, source_donnees)
        SELECT 
            dh.hebergement_id,
            dl.localisation_id,
            CAST(TO_CHAR(CAST(s.date_classement AS DATE), 'YYYYMMDD') AS INTEGER),
            :import_date_id,
            :import_time_id,
            s.classification_etoiles,
            s.source_donnees
        FROM staging_atout_france s
        JOIN dim_hebergement dh ON s.hash_record = dh.hash_record
        JOIN dim_localisation dl ON s.code_postal = dl.code_postal AND s.commune = dl.commune;
    """

    CLEANUP_STAGING = "DROP TABLE IF EXISTS staging_atout_france;"
    CLEANUP_STAGING_DATES = "DROP TABLE IF EXISTS dim_date_staging;"


class PostgresRepository:
    """Responsabilité : Exécution des transactions sur PostgreSQL."""
    
    def __init__(self, uri: str):
        self.engine: Engine = create_engine(uri)

    def load_dataframe_to_staging(self, df: pd.DataFrame, table_name: str) -> None:
        """Charge un DataFrame Pandas dans une table temporaire SQL."""
        with self.engine.begin() as conn:
            df.to_sql(table_name, conn, if_exists='replace', index=False)

    def execute_transaction(self, queries_with_params: List[Dict[str, Any]]) -> None:
        """Exécute une série de requêtes dans une seule transaction sécurisée."""
        with self.engine.begin() as conn:
            for item in queries_with_params:
                conn.execute(text(item["query"]), item.get("params", {}))


# ============================================
# 5. APPLICATION : Service d'Orchestration (ETL)
# ============================================
class DataWarehouseETLService:
    """Responsabilité : Orchestrer les étapes Extract, Transform et Load."""
    
    def __init__(self, file_repo: FileRepository, db_repo: PostgresRepository, transformer: DataTransformer):
        self.file_repo = file_repo
        self.db_repo = db_repo
        self.transformer = transformer

    def execute(self, csv_path: str) -> bool:
        logger.info(f"Démarrage ETL PostgreSQL depuis {csv_path}")
        try:
            # --- EXTRACT ---
            df_raw = self.file_repo.read_csv(csv_path)
            
            # --- TRANSFORM ---
            df_staged = self.transformer.prepare_staging_data(df_raw)
            now = datetime.now(timezone.utc)
            df_dates = self.transformer.generate_date_dim(pd.concat([df_staged['date_classement'], pd.Series([now])]))

            # --- LOAD (Staging) ---
            logger.info("Chargement des données en Staging...")
            self.db_repo.load_dataframe_to_staging(df_staged, 'staging_atout_france')
            self.db_repo.load_dataframe_to_staging(df_dates, 'dim_date_staging')

            # --- LOAD (DWH Transactions) ---
            logger.info("Alimentation du modèle en étoile (Dimensions & Faits)...")
            
            transaction_plan = [
                {
                    "query": SQLQueries.INSERT_DIMS_DATE_TIME, 
                    "params": {"t_id": int(now.strftime('%H%M')), "h": now.hour, "m": now.minute}
                },
                {"query": SQLQueries.INSERT_DIM_LOCALISATION},
                {"query": SQLQueries.INSERT_DIM_HEBERGEMENT},
                {
                    "query": SQLQueries.INSERT_FACT_HEBERGEMENT,
                    "params": {"import_date_id": int(now.strftime('%Y%m%d')), "import_time_id": int(now.strftime('%H%M'))}
                },
                {"query": SQLQueries.CLEANUP_STAGING},
                {"query": SQLQueries.CLEANUP_STAGING_DATES}
            ]
            
            self.db_repo.execute_transaction(transaction_plan)
            logger.info("ETL PostgreSQL terminé avec succès !")
            return True

        except Exception as e:
            logger.error("Erreur fatale durant l'ETL PostgreSQL", extra={'extra_data': {'error': str(e)}})
            return False

# ============================================
# POINT D'ENTRÉE
# ============================================
if __name__ == "__main__":
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
    load_dotenv(dotenv_path=env_path)
    
    POSTGRES_URI = os.getenv("POSTGRES_DWH_URI", os.getenv("POSTGRES_URI")) 
    
    date_str = datetime.now(timezone.utc).strftime("%Y_%m_%d")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '/opt/airflow/datalake/'))
    input_csv = os.path.join(base_dir, f"fichiers_traites/hebergements_atoutfrance_normalized_{date_str}.csv")
    
    if not POSTGRES_URI:
        logger.error("Erreur : POSTGRES_URI introuvable dans les variables d'environnement.")
        sys.exit(1)
        
    if not os.path.exists(input_csv):
        logger.error(f"Erreur : Fichier CSV manquant ({input_csv}).")
        sys.exit(1)
        
    # Injection des dépendances
    service = DataWarehouseETLService(
        file_repo=FileRepository(),
        db_repo=PostgresRepository(uri=POSTGRES_URI),
        transformer=DataTransformer()
    )
    
    success = service.execute(csv_path=input_csv)
    if not success:
        sys.exit(1)