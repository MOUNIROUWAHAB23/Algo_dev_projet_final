import os
import sys
import pytest
import pandas as pd
from unittest.mock import MagicMock

# Ajout du dossier racine au PATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Imports de l'architecture SOLID
from scripts.load_postgres import (
    DataTransformer, 
    DataWarehouseETLService, 
    FileRepository, 
    PostgresRepository
)

class TestPostgresDWH:

    def test_generate_date_dim(self):
        """Test unitaire : Vérifie la logique pure du Transformer (sans BDD)"""
        dates_test = pd.Series(['2026-04-01', '2026-04-02', '2026-12-31'])
        
        # Appel direct de la méthode statique
        dim_date = DataTransformer.generate_date_dim(dates_test)
        
        assert len(dim_date) == 3
        assert 'date_id' in dim_date.columns
        assert 'annee' in dim_date.columns
        assert dim_date['date_id'].iloc[0] == 20260401
        assert dim_date['mois'].iloc[0] == 4
        assert dim_date['annee'].iloc[2] == 2026

    def test_load_datawarehouse_service(self, sample_normalized_dataframe):
        """Test d'intégration : Vérifie l'orchestration du Service (ETL)"""
        
        # 1. Création des Mocks (Fausses dépendances)
        mock_file_repo = MagicMock(spec=FileRepository)
        mock_file_repo.read_csv.return_value = sample_normalized_dataframe
        
        mock_db_repo = MagicMock(spec=PostgresRepository)
        
        # 2. Injection des dépendances dans le Service
        service = DataWarehouseETLService(
            file_repo=mock_file_repo,
            db_repo=mock_db_repo,
            transformer=DataTransformer()
        )
        
        # 3. Exécution
        result = service.execute("fake_path.csv")
        
        # 4. Assertions (Vérification de l'orchestration)
        assert result is True
        mock_file_repo.read_csv.assert_called_once_with("fake_path.csv")
        
        # Vérifie que le staging a été appelé deux fois (df_staged + df_dates)
        assert mock_db_repo.load_dataframe_to_staging.call_count == 2
        
        # Vérifie que la transaction finale (les requêtes) a bien été envoyée
        assert mock_db_repo.execute_transaction.called