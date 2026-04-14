import os
import sys
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from scripts.load_mongodb import DataLoaderService, MongoRepository, MetricsReporter

class TestMongoLoader:

    @patch('scripts.load_mongodb.pd.read_csv')
    def test_mongodb_service_orchestration(self, mock_read_csv, sample_normalized_dataframe):
        """Test unitaire : Vérifie l'orchestration du chargement NoSQL"""
        
        # On simule la lecture du CSV
        mock_read_csv.return_value = sample_normalized_dataframe
        
        # 1. Création des Faux Repositories (Mocks)
        mock_repo = MagicMock(spec=MongoRepository)
        mock_repo.bulk_upsert.return_value = {"inserted_count": 1, "updated_count": 0, "matched_count": 0}
        
        mock_reporter = MagicMock(spec=MetricsReporter)
        
        # 2. Injection dans le Service
        service = DataLoaderService(repository=mock_repo, reporter=mock_reporter)
        
        # 3. Exécution
        result = service.execute("fake_path.csv")
        
        # 4. Assertions
        assert result is True
        mock_repo.setup_indexes.assert_called_once()
        mock_repo.bulk_upsert.assert_called_once()
        mock_reporter.save_report.assert_called_once()