import os
import sys
import pytest
import pandas as pd

# Ajoute le dossier des scripts au PYTHONPATH pour pouvoir faire les "import"
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../airflow/scripts')))

@pytest.fixture
def sample_raw_dataframe():
    """Génère un faux DataFrame de 100 lignes imitant le fichier Atout France"""
    data = []
    for i in range(100):
        data.append({
            "NOM_COMMERCIAL": f"Hotel Test {i}",
            "CLASSEMENT": f"{i % 5 + 1} étoiles",
            "CODE_POSTAL": f"7500{i%9}",
            "COMMUNE": "Paris",
            "COURRIEL": "contact@hoteltest.fr",
            "SITE_INTERNET": "http://hoteltest.fr",
            "DATE_CLASSEMENT": "2023-01-15",
            "CAPACITE_ACCUEIL_PERSONNES": str(50 + i),
            "NOMBRE_CHAMBRES": str(10 + i)
        })
    return pd.DataFrame(data)

@pytest.fixture
def perf_raw_dataframe():
    """Génère un DataFrame de 10 000 lignes pour les tests de performance"""
    row = {
        "NOM_COMMERCIAL": "Hotel Rapide", "CLASSEMENT": "3 étoiles", 
        "CODE_POSTAL": "69001", "COMMUNE": "Lyon", "DATE_CLASSEMENT": "2023-01-15"
    }
    return pd.DataFrame([row] * 10000)


@pytest.fixture
def sample_normalized_dataframe(sample_raw_dataframe):
    """Génère un faux DataFrame normalisé (après l'étape de transformation)"""
    df = sample_raw_dataframe.copy()
    # On met les colonnes en minuscules
    df.columns = [col.lower() for col in df.columns]
    
    # On force la présence des colonnes attendues par PostgreSQL
    df['classification_etoiles'] = 3
    df['hash_record'] = [f"hash_test_{i}" for i in range(len(df))]
    df['nombre_chambres'] = 15  # <--- Correction ici
    df['nombre_lits'] = 30      # <--- Correction ici
    df['latitude']= 1.3455
    df['longitude']= 2.4555
    
    # Sécurité supplémentaire au cas où PostgreSQL les demande :
    if 'date_classement' not in df.columns:
        df['date_classement'] = '2023-01-15'
    return df

@pytest.fixture
def perf_normalized_dataframe(perf_raw_dataframe):
    """Génère 10k lignes normalisées pour les tests de perf"""
    df = perf_raw_dataframe.copy()
    df.columns = [col.lower() for col in df.columns]
    
    # On force la présence des colonnes
    df['classification_etoiles'] = 3
    df['hash_record'] = [f"hash_perf_{i}" for i in range(len(df))]
    df['nombre_chambres'] = 15  # <--- Correction ici
    df['nombre_lits'] = 30      # <--- Correction ici
    df['date_classement'] = '2023-01-15'
    df['latitude']= 1.3455
    df['longitude']= 2.4555
    return df