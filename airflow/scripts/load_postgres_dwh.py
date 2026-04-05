import os
import json
import logging
import pandas as pd
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# --- CONFIGURATION LOGGING ---
class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage()
        })

logger = logging.getLogger("PostgresDWH")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(JSONFormatter())
logger.addHandler(ch)

def generate_date_dim(df_dates):
    """Génère la dimension date avec la Smart Key YYYYMMDD"""
    dates = pd.to_datetime(df_dates, utc=True).dropna().dt.date.unique()
    dim = pd.DataFrame({'date_complete': dates})
    dim['date_complete'] = pd.to_datetime(dim['date_complete'], utc=True)
    dim['date_id'] = dim['date_complete'].dt.strftime('%Y%m%d').astype(int)
    dim['jour_semaine'] = dim['date_complete'].dt.dayofweek + 1
    dim['mois'] = dim['date_complete'].dt.month
    dim['trimestre'] = dim['date_complete'].dt.quarter
    dim['annee'] = dim['date_complete'].dt.year
    return dim

def load_datawarehouse(csv_path, pg_uri):
    logger.info(f"Démarrage ETL PostgreSQL depuis {csv_path}")
    
    # 1. Connexion DB
    engine = create_engine(pg_uri)
    
    # 2. Lecture et préparation des données
    df = pd.read_csv(csv_path, dtype=str)
    
    # Conversion propre des nombres pour PostgreSQL
    for col in ['classification_etoiles', 'nombre_chambres', 'nombre_lits', 'latitude', 'longitude']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    df['date_classement'] = pd.to_datetime(df['date_classement'], errors='coerce', utc=True)
    now = datetime.now(timezone.utc)
    
    # 3. Chargement ETL via SQLAlchemy
    with engine.begin() as conn:
        
        # --- ETAPE A : STAGING ---
        logger.info("Chargement des données en Staging...")
        df.to_sql('staging_atout_france', conn, if_exists='replace', index=False)
        
        # --- ETAPE B : DIM DATE & TEMPS ---
        logger.info("Alimentation dim_date et dim_temps...")
        dim_date = generate_date_dim(pd.concat([df['date_classement'], pd.Series([now])]))
        dim_date.to_sql('dim_date_staging', conn, if_exists='replace', index=False)
        
        conn.execute(text("""
            INSERT INTO dim_date (date_id, date_complete, jour_semaine, mois, trimestre, annee)
            SELECT date_id, date_complete, jour_semaine, mois, trimestre, annee FROM dim_date_staging
            ON CONFLICT (date_id) DO NOTHING;
            
            INSERT INTO dim_temps (temps_id, heure, minute)
            VALUES (:t_id, :h, :m)
            ON CONFLICT (temps_id) DO NOTHING;
        """), {"t_id": int(now.strftime('%H%M')), "h": now.hour, "m": now.minute})

        # --- ETAPE C : DIM LOCALISATION ---
        logger.info("Alimentation dim_localisation...")
        conn.execute(text("""
            INSERT INTO dim_localisation (code_postal, commune, departement_code, region, latitude, longitude)
            SELECT DISTINCT code_postal, commune, departement, region, latitude, longitude
            FROM staging_atout_france
            WHERE code_postal IS NOT NULL AND commune IS NOT NULL
            ON CONFLICT (code_postal, commune) DO NOTHING;
        """))
        
        # --- ETAPE D : DIM HEBERGEMENT ---
        logger.info("Alimentation dim_hebergement...")
        conn.execute(text("""
            INSERT INTO dim_hebergement (hash_record, nom, type_hebergement, classification, nb_chambres, nb_lits, contact_email, contact_telephone, site_web)
            SELECT DISTINCT hash_record, nom_hebergement, type_hebergement, classification_etoiles, nombre_chambres, nombre_lits, email_contact, telephone_contact, site_web
            FROM staging_atout_france
            WHERE hash_record IS NOT NULL
            ON CONFLICT (hash_record) DO UPDATE 
            SET classification = EXCLUDED.classification, nb_chambres = EXCLUDED.nb_chambres, nb_lits = EXCLUDED.nb_lits;
        """))
        
        # --- ETAPE E : FACT HEBERGEMENT ---
        logger.info("Alimentation fact_hebergement (Jointures)...")
        conn.execute(text(f"""
            INSERT INTO fact_hebergement (hebergement_id, localisation_id, date_classement_id, date_import_id, temps_import_id, classification_actuelle, source_donnees)
            SELECT 
                dh.hebergement_id,
                dl.localisation_id,
                CAST(TO_CHAR(CAST(s.date_classement AS DATE), 'YYYYMMDD') AS INTEGER),
                {int(now.strftime('%Y%m%d'))},
                {int(now.strftime('%H%M'))},
                s.classification_etoiles,
                s.source_donnees
            FROM staging_atout_france s
            JOIN dim_hebergement dh ON s.hash_record = dh.hash_record
            JOIN dim_localisation dl ON s.code_postal = dl.code_postal AND s.commune = dl.commune;
            
            -- Nettoyage de la table de staging
            DROP TABLE staging_atout_france;
        """))

    logger.info("ETL PostgreSQL terminé avec succès !")

if __name__ == "__main__":
    # env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
    # load_dotenv(dotenv_path=env_path)
    
    
    POSTGRES_URI = os.getenv("POSTGRES_URI") 
    
    date_str = datetime.now(timezone.utc).strftime("%Y_%m_%d")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '/opt/airflow/datalake/'))
    input_csv = os.path.join(base_dir, f"fichiers_traites/hebergements_atoutfrance_normalized_{date_str}.csv")
    
    if POSTGRES_URI and os.path.exists(input_csv):
        load_datawarehouse(input_csv, POSTGRES_URI)
    else:
        logger.error(f"Erreur : POSTGRES_URI introuvable ou Fichier CSV manquant ({input_csv}).")