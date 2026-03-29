# ============================================
# Script - Chargement des données dans MongoDB
# ============================================

from pymongo import MongoClient, ASCENDING
from datetime import datetime
import os

# Connection MongoDB
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://mongodb:27017')
DB_NAME = 'tourisme'
COLLECTION_NAME = 'hebergements'


def get_mongodb_client():
    """Crée une connexion MongoDB"""

    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]

    # Création des index
    collection = db[COLLECTION_NAME]

    collection.create_index([('nom', ASCENDING)])
    collection.create_index([('type', ASCENDING)])
    collection.create_index([('codePostal', ASCENDING)])
    collection.create_index([('commune', ASCENDING)])
    collection.create_index([('departement', ASCENDING)])
    collection.create_index([('region', ASCENDING)])
    collection.create_index([('nom', 'text'), ('commune', 'text')])
    collection.create_index([('location', '2dsphere')])

    return client, collection


def load_to_mongodb(data, collection):
    """Charge les données dans MongoDB avec upsert"""

    operations = []

    for item in data:
        # Préparer la clé unique pour l'upsert
        filter_key = {
            'source': item['source'],
            'nom': item['nom'],
            'commune': item['commune']
        }

        # Préparer les données à mettre à jour
        update_data = {
            '$set': {
                **item,
                'importedAt': datetime.now()
            }
        }

        # Ajouter la location pour les requêtes géospatiales
        if item.get('latitude') and item.get('longitude'):
            update_data['$set']['location'] = {
                'type': 'Point',
                'coordinates': [item['longitude'], item['latitude']]
            }

        operations.append({
            'updateOne': {
                'filter': filter_key,
                'update': update_data,
                'upsert': True
            }
        })

    # Exécution du bulk write
    if operations:
        result = collection.bulk_write(operations, ordered=False)

        return {
            'inserted': result.upserted_count,
            'modified': result.modified_count,
            'total': len(operations)
        }

    return {'inserted': 0, 'modified': 0, 'total': 0}


def load_all_to_mongodb(geocoded_data):
    """Charge tous les datasets dans MongoDB"""

    print(f"\n{'='*60}")
    print(f"Démarrage du chargement MongoDB - {datetime.now().isoformat()}")
    print(f"{'='*60}\n")

    client, collection = get_mongodb_client()

    total_stats = {'inserted': 0, 'modified': 0, 'total': 0}

    for source_type, records in geocoded_data.items():
        print(f"Chargement de {source_type} ({len(records)} enregistrements)...")

        stats = load_to_mongodb(records, collection)

        print(f"  ✓ Insérés: {stats['inserted']}, Modifiés: {stats['modified']}")

        total_stats['inserted'] += stats['inserted']
        total_stats['modified'] += stats['modified']
        total_stats['total'] += stats['total']

    client.close()

    # Résumé
    print(f"\n{'='*60}")
    print(f"RÉSUMÉ DU CHARGEMENT MONGODB")
    print(f"{'='*60}")
    print(f"  Total inséré: {total_stats['inserted']}")
    print(f"  Total modifié: {total_stats['modified']}")
    print(f"  Total traité: {total_stats['total']}")
    print(f"{'='*60}\n")

    return total_stats


if __name__ == '__main__':
    print("Script de chargement MongoDB - Doit être exécuté via Airflow")
