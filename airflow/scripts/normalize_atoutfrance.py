import os
import sys
import re
import json
import logging
import hashlib
import unicodedata
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

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

logger = get_logger("NormalizeAtoutFrance")

# ============================================
# 2. DOMAINE : Règles de Nettoyage (Pure Functions)
# ============================================
class DataCleaner:
    """Responsabilité : Opérations de nettoyage de données."""
    
    @staticmethod
    def remove_accents(input_str: Any) -> str:
        if pd.isna(input_str): return ""
        nfkd_form = unicodedata.normalize('NFKD', str(input_str))
        return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

    @staticmethod
    def normalize_address(address: Any) -> str:
        if pd.isna(address): return ""
        addr = DataCleaner.remove_accents(address).upper()
        return re.sub(r'\s+', ' ', addr).strip()

    @staticmethod
    def map_type(typologie: Any) -> str:
        if pd.isna(typologie): return "AUTRE"
        typ = str(typologie).upper()
        if any(x in typ for x in ["HÔTEL", "HOTEL"]): return "HOTEL"
        if "CAMPING" in typ: return "CAMPING"
        if any(x in typ for x in ["RÉSIDENCE", "RESIDENCE"]): return "RESIDENCE"
        if "AUBERGE" in typ: return "AUBERGE"
        if "VILLAGE" in typ: return "VILLAGE"
        return "AUTRE"

    @staticmethod
    def extract_stars(classement: Any) -> Optional[int]:
        if pd.isna(classement): return None
        match = re.search(r'(\d)', str(classement))
        return int(match.group(1)) if match else None

    @staticmethod
    def parse_equipments(equip_str: Any) -> str:
        if pd.isna(equip_str): return "[]"
        equips = [e.strip().lower() for e in str(equip_str).split(',') if e.strip()]
        return json.dumps(equips)

    @staticmethod
    def generate_hash(row: pd.Series) -> str:
        unique_string = f"{row.get('identifiant_etablissement','')}_{row.get('nom_hebergement','')}_{row.get('code_postal','')}"
        return hashlib.md5(unique_string.encode('utf-8')).hexdigest()

# ============================================
# 3. DOMAINE : Gestion du Schéma (Mapping)
# ============================================
class SchemaEnforcer:
    """Responsabilité : Garantir l'intégrité de la structure du DataFrame."""
    
    COL_MAPPING = {
        "NOM COMMERCIAL": "nom_hebergement",
        "TYPOLOGIE ÉTABLISSEMENT": "type_brut",
        "CLASSEMENT": "classement_brut",
        "ADRESSE": "adresse_rue",
        "CODE POSTAL": "code_postal",
        "COMMUNE": "commune",
        "SITE INTERNET": "site_web",
        "CAPACITÉ D'ACCUEIL (PERSONNES)": "nombre_lits",
        "NOMBRE DE CHAMBRES": "nombre_chambres",
        "DATE DE CLASSEMENT": "date_classement_brute"
    }

    FINAL_COLUMNS = [
        "identifiant_etablissement", "nom_hebergement", "type_hebergement", "classification_etoiles",
        "adresse_rue", "code_postal", "commune", "departement", "region", "latitude", "longitude",
        "telephone_contact", "email_contact", "site_web", "equipements", "nombre_chambres",
        "nombre_lits", "date_classement", "source_donnees", "hash_record"
    ]

    @classmethod
    def apply_mapping(cls, df: pd.DataFrame) -> pd.DataFrame:
        df = df.rename(columns={k: v for k, v in cls.COL_MAPPING.items() if k in df.columns})
        # Sécurité : Créer les colonnes manquantes
        for col in ["identifiant_etablissement", "latitude", "longitude", "equipements_bruts", "telephone_contact", "email_contact"]:
            if col not in df.columns:
                df[col] = ""
        return df

    @classmethod
    def enforce_final_schema(cls, df: pd.DataFrame) -> pd.DataFrame:
        for col in cls.FINAL_COLUMNS:
            if col not in df.columns:
                df[col] = None
        return df[cls.FINAL_COLUMNS]

# ============================================
# 4. INFRASTRUCTURE : Gestion des Fichiers (I/O)
# ============================================
class FileRepository:
    """Responsabilité : Abstraire la lecture et l'écriture des fichiers."""
    
    @staticmethod
    def read_csv(filepath: str) -> pd.DataFrame:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Le fichier {filepath} est introuvable.")
        return pd.read_csv(filepath, dtype=str)

    @staticmethod
    def write_csv(df: pd.DataFrame, filepath: str) -> None:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        df.to_csv(filepath, index=False, encoding='utf-8')

# ============================================
# 5. DOMAINE : Calcul des Métriques Qualité
# ============================================
class QualityMetrics:
    """Responsabilité : Calculer et journaliser la qualité des données."""
    
    @staticmethod
    def evaluate_and_log(initial_count: int, final_df: pd.DataFrame) -> None:
        final_count = len(final_df)
        pct_cp = round((final_df['code_postal'].str.len() == 5).mean() * 100, 2)
        pct_coords = round(final_df['latitude'].notna().mean() * 100, 2)
        
        metrics = {
            "total_initial": initial_count,
            "total_parsed": final_count,
            "doublons_supprimes": initial_count - final_count,
            "pct_cp_valides": pct_cp,
            "pct_coords_valides": pct_coords,
        }
        
        logger.info("Rapport de Qualité", extra={'extra_data': {'metrics': metrics}})
        if pct_cp < 100.0:
            logger.warning(f"Attention: {100 - pct_cp}% des codes postaux sont invalides.")

# ============================================
# 6. APPLICATION : Service d'Orchestration
# ============================================
class NormalizationService:
    """Responsabilité : Orchestrer les étapes de transformation des données."""
    
    def __init__(self, repository: FileRepository, schema_enforcer: SchemaEnforcer, metrics: QualityMetrics, cleaner: DataCleaner):
        self.repo = repository
        self.schema = schema_enforcer
        self.metrics = metrics
        self.cleaner = cleaner

    def process(self, input_file: str, output_file: str) -> bool:
        logger.info(f"Démarrage de la normalisation pour {input_file}")
        
        try:
            # 1. Extraction
            df = self.repo.read_csv(input_file)
            initial_count = len(df)

            # 2. Schema Mapping
            df = self.schema.apply_mapping(df)

            # 3. Transformations Métier
            df['nom_hebergement'] = df['nom_hebergement'].apply(self.cleaner.normalize_address)
            df['adresse_rue'] = df['adresse_rue'].apply(self.cleaner.normalize_address)
            df['type_hebergement'] = df.get('type_brut', pd.Series([""] * len(df))).apply(self.cleaner.map_type)
            df['classification_etoiles'] = df.get('classement_brut', pd.Series([""] * len(df))).apply(self.cleaner.extract_stars)
            
            # Codes postaux et départements
            df['code_postal'] = df['code_postal'].fillna('').astype(str).str.extract(r'(\d{4,5})')[0].str.zfill(5)
            df['departement'] = df['code_postal'].str[:2]
            df['region'] = None 
            
            # Équipements
            df['equipements'] = df.get('equipements_bruts', pd.Series([""] * len(df))).apply(self.cleaner.parse_equipments)
            
            # Validation des Coordonnées
            df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
            df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
            valid_coords = (df['latitude'].between(-90, 90)) & (df['longitude'].between(-180, 180))
            df.loc[~valid_coords, ['latitude', 'longitude']] = None
            
            # Métadonnées & Hash
            df['date_classement'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
            df['source_donnees'] = "ATOUT_FRANCE"
            df['hash_record'] = df.apply(self.cleaner.generate_hash, axis=1)

            # 4. Déduplication
            df = df.drop_duplicates(subset=['hash_record'])

            # 5. Métriques de Qualité
            self.metrics.evaluate_and_log(initial_count, df)

            # 6. Finalisation du Schéma et Sauvegarde
            df_final = self.schema.enforce_final_schema(df)
            self.repo.write_csv(df_final, output_file)
            
            logger.info(f"Fichier normalisé sauvegardé: {output_file}")
            return True

        except Exception as e:
            logger.error("Erreur fatale durant la normalisation", extra={'extra_data': {'error': str(e)}})
            return False

# ============================================
# POINT D'ENTRÉE
# ============================================
if __name__ == "__main__":
    date_str = datetime.now(timezone.utc).strftime("%Y_%m_%d")
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '/opt/airflow/datalake'))
    in_csv = os.path.join(base_dir, f"fichiers_non_traites/hebergements_atoutfrance_{date_str}.csv")
    out_csv = os.path.join(base_dir, f"fichiers_traites/hebergements_atoutfrance_normalized_{date_str}.csv")
    
    # Injection des dépendances
    service = NormalizationService(
        repository=FileRepository(),
        schema_enforcer=SchemaEnforcer(),
        metrics=QualityMetrics(),
        cleaner=DataCleaner()
    )
    
    success = service.process(in_csv, out_csv)
    if not success:
        sys.exit(1)