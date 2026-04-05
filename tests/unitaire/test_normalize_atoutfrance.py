import os
import sys
import pytest
import pandas as pd

# Ajout du dossier racine au PATH pour l'import
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from scripts.normalize_atoutfrance import (
    normalize_address, 
    map_type, 
    extract_stars, 
    parse_equipments, 
    generate_hash
)

class TestNormalizationAtoutFrance:

    def test_normalize_address(self):
        # Test gestion des accents, majuscules et espaces multiples
        assert normalize_address("Hôtel de l'Océan  ") == "HOTEL DE L'OCEAN"
        assert normalize_address("  les   flots bleus  ") == "LES FLOTS BLEUS"
        assert normalize_address("Château-Éphémère") == "CHATEAU-EPHEMERE"
        assert normalize_address(None) == ""

    def test_map_type(self):
        # Test de la classification
        assert map_type("Hôtel de tourisme") == "HOTEL"
        assert map_type("Terrain de camping et caravanage") == "CAMPING"
        assert map_type("Résidence de tourisme") == "RESIDENCE"
        assert map_type("Village de vacances") == "VILLAGE"
        assert map_type("Inconnu ou Bizarre") == "AUTRE"
        assert map_type(None) == "AUTRE"

    def test_extract_stars(self):
        # Test de l'extraction des étoiles (1 à 5)
        assert extract_stars("3 étoiles") == 3
        assert extract_stars("1 étoile") == 1
        assert extract_stars("Non classé") is None
        assert extract_stars(None) is None

    def test_parse_equipments(self):
        # Test de la mise en tableau JSON
        assert parse_equipments("Piscine, Wifi , Parking ") == '["piscine", "wifi", "parking"]'
        assert parse_equipments("Spa") == '["spa"]'
        assert parse_equipments(None) == '[]'

    def test_generate_hash(self):
        # Test de la reproductibilité du hash MD5 (pour la déduplication)
        row1 = {"identifiant_etablissement": "ID123", "nom_hebergement": "HOTEL TEST", "code_postal": "75001"}
        row2 = {"identifiant_etablissement": "ID123", "nom_hebergement": "HOTEL TEST", "code_postal": "75001"}
        row3 = {"identifiant_etablissement": "ID999", "nom_hebergement": "HOTEL TEST", "code_postal": "75001"}
        
        # Deux lignes identiques doivent avoir le même hash
        assert generate_hash(row1) == generate_hash(row2)
        # Deux lignes différentes doivent avoir des hash différents
        assert generate_hash(row1) != generate_hash(row3)