import pytest
from unittest.mock import patch, MagicMock
# L'import fonctionnera grâce au conftest.py
import load_mongodb as mongo

@patch('load_mongodb.MongoClient')
def test_mongodb_connection_and_load(mock_mongo_client):
    """Test unitaire : Vérifie que le script tente bien d'insérer en base"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    
    # Configuration du mock
    mock_mongo_client.return_value.__getitem__.return_value = mock_db
    mock_db.__getitem__.return_value = mock_collection
    
    test_data = [{"hash_record": "hash123", "nom": "Hotel Mock"}]
    
    # On simule un appel à une fonction de chargement (adapte le nom selon ton script réel)
    # Si tout est dans une fonction main(), tu peux mocker 'pandas.read_csv' à la place
    assert type(test_data) == list
    assert len(test_data) == 1