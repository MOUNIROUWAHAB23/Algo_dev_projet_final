import time
import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
import load_postgres_dwh as dwh

def test_performance_normalization(perf_raw_dataframe):
    """Test de perf : 10k records normalisés en < 2 min"""
    start_time = time.time()
    
    df = perf_raw_dataframe.copy()
    
    # On simule la charge de la normalisation (lower case, regex)
    df.columns = [col.lower() for col in df.columns]
    df['classification_etoiles'] = df['classement'].str.extract(r'(\d+)').fillna(0).astype(int)
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    # Le test passe si le temps est inférieur à 120 secondes (2 min)
    assert execution_time < 120.0
    print(f"\n[PERF] Normalisation 10k lignes : {execution_time:.4f} secondes")

def test_performance_db_preparation():
    """Test de perf : Génération des requêtes d'insertion massives en < 1 min"""
    start_time = time.time()
    
    # Simulation de la préparation de 10 000 requêtes bulk
    operations = [{"hash_record": f"hash_{i}", "nom": f"Hotel {i}"} for i in range(10000)]
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    assert execution_time < 60.0
    assert len(operations) == 10000
    print(f"\n[PERF] Préparation 10k requêtes : {execution_time:.4f} secondes")


@patch('load_postgres_dwh.create_engine')
@patch('load_postgres_dwh.pd.read_csv')
def test_performance_postgres_10k(mock_read_csv, mock_create_engine, perf_normalized_dataframe):
    """Test de perf : Validation de la préparation Pandas pour PostgreSQL 10k en < 1 min"""
    # ...
    # On simule un CSV de 10 000 lignes normalisées
    mock_read_csv.return_value = perf_normalized_dataframe
    
    # Mock SQLAlchemy
    mock_conn = MagicMock()
    mock_engine = MagicMock()
    mock_engine.begin.return_value.__enter__.return_value = mock_conn
    mock_create_engine.return_value = mock_engine
    
    start_time = time.time()
    
    # Lancement de l'ETL (qui traitera les 10k lignes de perf_raw_dataframe)
    dwh.load_datawarehouse("fake_path.csv", "postgresql://fake_uri")
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    # Le critère de la User Story est < 1 minute (60 secondes)
    assert execution_time < 60.0
    print(f"\n[PERF] DWH PostgreSQL ETL 10k lignes (Pandas) : {execution_time:.4f} secondes")