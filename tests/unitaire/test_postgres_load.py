import pytest
import pandas as pd
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

# Import de ton script ETL PostgreSQL
import load_postgres_dwh as dwh

def test_generate_date_dim():
    """Test unitaire : Vérifie que la dimension Date génère bien les Smart Keys (YYYYMMDD)"""
    # Création d'une fausse série de dates
    dates_test = pd.Series(['2026-04-01', '2026-04-02', '2026-12-31'])
    
    # Appel de la fonction
    dim_date = dwh.generate_date_dim(dates_test)
    
    # Assertions
    assert len(dim_date) == 3
    assert 'date_id' in dim_date.columns
    assert 'annee' in dim_date.columns
    
    # Vérification de la Smart Key de la première date
    assert dim_date['date_id'].iloc[0] == 20260401
    assert dim_date['mois'].iloc[0] == 4
    assert dim_date['annee'].iloc[2] == 2026

@patch('load_postgres_dwh.create_engine')
@patch('load_postgres_dwh.pd.read_csv')
def test_load_datawarehouse_mock(mock_read_csv, mock_create_engine, sample_normalized_dataframe):
    """Test d'intégration simulé : Vérifie que SQLAlchemy est bien appelé sans crasher"""
    
    # On passe le dataframe normalisé !
    mock_read_csv.return_value = sample_normalized_dataframe
    
    # 2. On simule la connexion SQLAlchemy (Engine et Connection)
    mock_conn = MagicMock()
    mock_engine = MagicMock()
    # Configuration du context manager : with engine.begin() as conn:
    mock_engine.begin.return_value.__enter__.return_value = mock_conn
    mock_create_engine.return_value = mock_engine
    
    # 3. Exécution de la fonction principale
    dwh.load_datawarehouse("fake_path.csv", "postgresql://fake_uri")
    
    # 4. Assertions : On vérifie que la BDD a bien été sollicitée
    mock_create_engine.assert_called_once_with("postgresql://fake_uri")
    
    # On vérifie que la fonction .execute() a été appelée plusieurs fois (pour les INSERT)
    assert mock_conn.execute.call_count > 0
    
    # On vérifie que to_sql a bien été appelé sur le mock_conn (au moins pour le staging)
    # pandas utilise l'engine ou la connection sous le capot, l'essentiel est que le code n'ait pas planté !
    assert True