import os
import sys
import pytest
import pandas as pd

# Ajout du dossier racine au PATH pour l'import
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# NOUVEL IMPORT : On importe la classe DataCleaner
from scripts.normalize_atoutfrance import DataCleaner

class TestNormalizationAtoutFrance:

    def test_normalize_address(self):
        # Test gestion des accents, majuscules et espaces multiples
        assert DataCleaner.normalize_address("Hôtel de l'Océan  ") == "HOTEL DE L'OCEAN"
        assert DataCleaner.normalize_address("  les   flots bleus  ") == "LES FLOTS BLEUS"
        assert DataCleaner.normalize_address("Château-Éphémère") == "CHATEAU-EPHEMERE"
        assert DataCleaner.normalize_address(None) == ""

    def test_map_type(self):
        # Test de la classification
        assert DataCleaner.map_type("Hôtel de tourisme") == "HOTEL"
        assert DataCleaner.map_type("Terrain de camping et caravanage") == "CAMPING"
        assert DataCleaner.map_type("Résidence de tourisme") == "RESIDENCE"
        assert DataCleaner.map_type("Village de vacances") == "VILLAGE"
        assert DataCleaner.map_type("Inconnu ou Bizarre") == "AUTRE"
        assert DataCleaner.map_type(None) == "AUTRE"

    def test_extract_stars(self):
        # Test de l'extraction des étoiles (1 à 5)
        assert DataCleaner.extract_stars("3 étoiles") == 3
        assert DataCleaner.extract_stars("1 étoile") == 1
        assert DataCleaner.extract_stars("Non classé") is None
        assert DataCleaner.extract_stars(None) is None

    def test_parse_equipments(self):
        # Test de la mise en tableau JSON
        assert DataCleaner.parse_equipments("Piscine, Wifi , Parking ") == '["piscine", "wifi", "parking"]'
        assert DataCleaner.parse_equipments("Spa") == '["spa"]'
        assert DataCleaner.parse_equipments(None) == '[]'

    def test_generate_hash(self):
        # Test de la reproductibilité du hash MD5 (pour la déduplication)
        # On utilise pd.Series pour respecter le contrat de type (Type Hint)
        row1 = pd.Series({"identifiant_etablissement": "ID123", "nom_hebergement": "HOTEL TEST", "code_postal": "75001"})
        row2 = pd.Series({"identifiant_etablissement": "ID123", "nom_hebergement": "HOTEL TEST", "code_postal": "75001"})
        row3 = pd.Series({"identifiant_etablissement": "ID999", "nom_hebergement": "HOTEL TEST", "code_postal": "75001"})
        
        # Deux lignes identiques doivent avoir le même hash
        assert DataCleaner.generate_hash(row1) == DataCleaner.generate_hash(row2)
        # Deux lignes différentes doivent avoir des hash différents
        assert DataCleaner.generate_hash(row1) != DataCleaner.generate_hash(row3)