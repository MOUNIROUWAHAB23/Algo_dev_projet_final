import os
import tempfile
import pytest
import sys

# Ajout du dossier racine au PATH pour pouvoir importer ton script Airflow
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Import des fonctions que nous avons créées précédemment
from airflow.scripts.download_atoutfrance import download_file, parse_and_validate

# Variables de test basées sur ta User Story
TEST_URL = "https://data.classement.atout-france.fr/static/exportHebergementsClasses/hebergements_classes.csv"
MIN_EXPECTED_RECORDS = 10000

def test_integration_atout_france_pipeline():
    """
    Test d'intégration complet : 
    1. Télécharge le vrai fichier depuis Data.gouv / Atout France
    2. Valide sa taille et sa présence
    3. Parse le fichier et valide la règle métier (> 10 000 records)
    """
    # Utilisation d'un dossier temporaire (supprimé automatiquement à la fin du test)
    with tempfile.TemporaryDirectory() as temp_dir:
        test_filepath = os.path.join(temp_dir, "test_hebergements_atoutfrance.csv")
        
        # --- ÉTAPE 1 : TÉLÉCHARGEMENT ---
        print(f"\n[Test] Lancement du téléchargement vers {test_filepath}...")
        success_dl = download_file(
            url=TEST_URL, 
            dest_path=test_filepath, 
            retries=1, # 1 seul retry pour ne pas ralentir le test en cas de panne globale
            timeout=120
        )
        
        # Assertions pour vérifier que le téléchargement a marché
        assert success_dl is True, "Le téléchargement a échoué."
        assert os.path.exists(test_filepath), "Le fichier n'a pas été sauvegardé sur le disque."
        
        # Vérification de la taille (le CSV fait environ 3.7 MB, on vérifie qu'il fait au moins 1 MB)
        file_size_mb = os.path.getsize(test_filepath) / (1024 * 1024)
        assert file_size_mb > 1.0, f"Le fichier est anormalement petit : {file_size_mb:.2f} MB"
        
        # --- ÉTAPE 2 : PARSING ET VALIDATION ---
        print("[Test] Lancement du parsing et de la validation...")
        record_count, success_parse = parse_and_validate(
            filepath=test_filepath, 
            min_records=MIN_EXPECTED_RECORDS
        )
        
        # Assertions pour vérifier la qualité des données
        assert success_parse is True, "Le parsing a échoué (problème d'encodage ou de structure)."
        assert record_count >= MIN_EXPECTED_RECORDS, f"Règle métier non respectée : seulement {record_count} lignes trouvées."
        
        print(f"[Test] Succès ! Fichier validé avec {record_count} lignes (Taille: {file_size_mb:.2f} MB).")