import os
import re
import json
import logging
import hashlib
import unicodedata
import pandas as pd
from datetime import datetime, timezone

# ============================================
# Configuration du Logging JSON
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

logger = logging.getLogger("NormalizeAtoutFrance")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(JSONFormatter())
logger.addHandler(ch)

# ============================================
# Fonctions de Normalisation (Vectorisables)
# ============================================

def remove_accents(input_str):
    if pd.isna(input_str): return ""
    nfkd_form = unicodedata.normalize('NFKD', str(input_str))
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def normalize_address(address):
    """Trim, uppercase et gestion des accents"""
    if pd.isna(address): return ""
    addr = remove_accents(address).upper()
    return re.sub(r'\s+', ' ', addr).strip()

def map_type(typologie):
    """Classification des hébergements selon la règle métier"""
    if pd.isna(typologie): return "AUTRE"
    typ = str(typologie).upper()
    if any(x in typ for x in ["HÔTEL", "HOTEL"]): return "HOTEL"
    if "CAMPING" in typ: return "CAMPING"
    if any(x in typ for x in ["RÉSIDENCE", "RESIDENCE"]): return "RESIDENCE"
    if "AUBERGE" in typ: return "AUBERGE"
    if "VILLAGE" in typ: return "VILLAGE"
    return "AUTRE"

def extract_stars(classement):
    """Extraction des étoiles 1-5"""
    if pd.isna(classement): return None
    match = re.search(r'(\d)', str(classement))
    return int(match.group(1)) if match else None

def parse_equipments(equip_str):
    """Parsing array: piscine, wifi, parking, etc."""
    if pd.isna(equip_str): return "[]"
    equips = [e.strip().lower() for e in str(equip_str).split(',') if e.strip()]
    return json.dumps(equips)

def generate_hash(row):
    """Hash MD5 pour déduplication basée sur les clés métiers"""
    unique_string = f"{row.get('identifiant_etablissement','')}_{row.get('nom_hebergement','')}_{row.get('code_postal','')}"
    return hashlib.md5(unique_string.encode('utf-8')).hexdigest()

# ============================================
# Pipeline Principal Pandas
# ============================================

def process_atout_france(input_file, output_file):
    logger.info(f"Démarrage de la normalisation pour {input_file}")
    
    try:
        # Forcer la lecture en string pour préserver les zéros des codes postaux
        df = pd.read_csv(input_file, dtype=str)
    except Exception as e:
        logger.error("Erreur de lecture", extra={'extra_data': {'error': str(e)}})
        return False

    total_records_initial = len(df)

    # 1. Renommage des colonnes basé sur la source Atout France
    col_mapping = {
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
    df = df.rename(columns={k: v for k, v in col_mapping.items() if k in df.columns})

    # 2. Sécurité : Créer les colonnes manquantes pour éviter les KeyErrors
    colonnes_essentielles = [
        "identifiant_etablissement", "nom_hebergement", "adresse_rue", 
        "code_postal", "latitude", "longitude", "equipements_bruts",
        "telephone_contact", "email_contact"
    ]
    for col in colonnes_essentielles:
        if col not in df.columns: 
            df[col] = ""

    # 2. Application des règles de gestion
    df['nom_hebergement'] = df['nom_hebergement'].apply(normalize_address)
    df['adresse_rue'] = df['adresse_rue'].apply(normalize_address)
    df['type_hebergement'] = df.get('type_brut', pd.Series([""] * len(df))).apply(map_type)
    df['classification_etoiles'] = df.get('classement_brut', pd.Series([""] * len(df))).apply(extract_stars)
    
    # Validation Code Postal (5 chars)
    df['code_postal'] = df['code_postal'].fillna('').astype(str).str.extract(r'(\d{4,5})')[0].str.zfill(5)
    
    # Départment (depuis CP) - La région sera enrichie plus tard via un merge INSEE
    df['departement'] = df['code_postal'].str[:2]
    df['region'] = None 
    
    # Parsing Equipements
    df['equipements'] = df.get('equipements_bruts', pd.Series([""] * len(df))).apply(parse_equipments)
    
    # Coordonnées (Conversion en float et validation Bounding Box France/Monde)
    df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
    df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
    valid_coords = (df['latitude'].between(-90, 90)) & (df['longitude'].between(-180, 180))
    df.loc[~valid_coords, ['latitude', 'longitude']] = None
    
    # Date ISO 8601
    df['date_classement'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    
    # Métadonnées
    df['source_donnees'] = "ATOUT_FRANCE"
    df['hash_record'] = df.apply(generate_hash, axis=1)

    # 3. Déduplication stricte
    df = df.drop_duplicates(subset=['hash_record'])
    total_records_dedup = len(df)

    # 4. Rapport de Qualité & Critères de validation
    metrics = {
        "total_initial": total_records_initial,
        "total_parsed": total_records_dedup,
        "doublons_supprimes": total_records_initial - total_records_dedup,
        "pct_cp_valides": round((df['code_postal'].str.len() == 5).mean() * 100, 2),
        "pct_coords_valides": round(df['latitude'].notna().mean() * 100, 2),
    }
    
    logger.info("Rapport de Qualité", extra={'extra_data': {'metrics': metrics}})
    
    if metrics["pct_cp_valides"] < 100.0:
        logger.warning(f"Attention: {100 - metrics['pct_cp_valides']}% des codes postaux sont invalides.")

    # 5. Export selon le schéma strict
    colonnes_finales = [
        "identifiant_etablissement", "nom_hebergement", "type_hebergement", "classification_etoiles",
        "adresse_rue", "code_postal", "commune", "departement", "region", "latitude", "longitude",
        "telephone_contact", "email_contact", "site_web", "equipements", "nombre_chambres",
        "nombre_lits", "date_classement", "source_donnees", "hash_record"
    ]
    
    # Ajouter les colonnes manquantes avec du None
    for col in colonnes_finales:
        if col not in df.columns: df[col] = None
            
    df_final = df[colonnes_finales]
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    df_final.to_csv(output_file, index=False, encoding='utf-8')
    logger.info(f"Fichier normalisé sauvegardé: {output_file}")
    
    return True

if __name__ == "__main__":
    date_str = datetime.now(timezone.utc).strftime("%Y_%m_%d")
    
    # Chemins basés sur ton Datalake
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '/opt/airflow/datalake'))
    input_csv = os.path.join(base_dir, f"fichiers_non_traites/hebergements_atoutfrance_{date_str}.csv")
    output_csv = os.path.join(base_dir, f"fichiers_traites/hebergements_atoutfrance_normalized_{date_str}.csv")
    
    if os.path.exists(input_csv):
        process_atout_france(input_csv, output_csv)
    else:
        logger.error(f"Fichier introuvable: {input_csv}. Lancez le téléchargement d'abord.")