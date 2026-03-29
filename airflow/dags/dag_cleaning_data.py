# ============================================
# DAG - Nettoyage et validation des données
# ============================================

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
from pymongo import MongoClient

default_args = {
    'owner': 'equipe-donnees',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=10),
}

dag = DAG(
    'cleaning_data',
    default_args=default_args,
    description='Nettoyage et validation qualité des données',
    schedule_interval='0 4 * * 0',  # Tous les dimanches à 4h
    catchup=False,
    tags=['tourisme', 'cleaning', 'qualité']
)


def supprimer_donnees_invalides(**context):
    """Supprime les enregistrements avec données manquantes critiques"""
    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['hebergements']

    # Critères d'invalidité
    invalid_query = {
        '$or': [
            {'nom': {'$exists': False}},
            {'nom': ''},
            {'commune': {'$exists': False}},
            {'commune': ''},
            {'type': {'$exists': False}}
        ]
    }

    result = collection.delete_many(invalid_query)

    client.close()

    print(f"✅ {result.deleted_count} enregistrements invalides supprimés")

    return {'deleted': result.deleted_count}


def standardiser_champs(**context):
    """Standardise les champs textuels"""
    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['hebergements']

    # Trim des espaces
    updates = 0

    # Exemple: standardiser les codes postaux
    cursor = collection.find({'codePostal': {'$regex': '\\s'}})
    for doc in cursor:
        collection.update_one(
            {'_id': doc['_id']},
            {'$set': {'codePostal': doc['codePostal'].strip()}}
        )
        updates += 1

    client.close()

    print(f"✅ {updates} champs standardisés")

    return {'updated': updates}


def valider_coordonnees(**context):
    """Valide les coordonnées géographiques"""
    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['hebergements']

    # Coordonnées hors France métropolitaine
    invalid_coords = collection.find({
        '$or': [
            {'latitude': {'$lt': 42}},
            {'latitude': {'$gt': 51}},
            {'longitude': {'$lt': -5}},
            {'longitude': {'$gt': 10}}
        ]
    })

    invalid_count = 0
    for doc in invalid_coords:
        # Marquer comme invalide plutôt que supprimer
        collection.update_one(
            {'_id': doc['_id']},
            {'$set': {'geocoding_status': 'invalid_coordinates'}}
        )
        invalid_count += 1

    client.close()

    print(f"⚠️ {invalid_count} coordonnées hors limites marquées")

    return {'invalid': invalid_count}


def generer_rapport_qualite(**context):
    """Génère un rapport de qualité des données"""
    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['hebergements']

    total = collection.count_documents({})

    avec_coords = collection.count_documents({
        'latitude': {'$ne': None},
        'longitude': {'$ne': None}
    })

    avec_contact = collection.count_documents({
        '$or': [
            {'telephone': {'$ne': None}},
            {'email': {'$ne': None}},
            {'url': {'$ne': None}}
        ]
    })

    avec_classement = collection.count_documents({
        'classement': {'$ne': None}
    })

    client.close()

    rapport = {
        'date': datetime.now().isoformat(),
        'total': total,
        'taux_geocodage': round(avec_coords * 100 / total, 2) if total > 0 else 0,
        'taux_contact': round(avec_contact * 100 / total, 2) if total > 0 else 0,
        'taux_classement': round(avec_classement * 100 / total, 2) if total > 0 else 0
    }

    print(f"\n{'='*60}")
    print("RAPPORT QUALITÉ DES DONNÉES")
    print(f"{'='*60}")
    print(f"Total: {rapport['total']} hébergements")
    print(f"Géocodés: {rapport['taux_geocodage']}%")
    print(f"Avec contact: {rapport['taux_contact']}%")
    print(f"Avec classement: {rapport['taux_classement']}%")
    print(f"{'='*60}\n")

    return rapport


task_supprimer_invalides = PythonOperator(
    task_id='supprimer_donnees_invalides',
    python_callable=supprimer_donnees_invalides,
    dag=dag
)

task_standardiser = PythonOperator(
    task_id='standardiser_champs',
    python_callable=standardiser_champs,
    dag=dag
)

task_valider_coords = PythonOperator(
    task_id='valider_coordonnees',
    python_callable=valider_coordonnees,
    dag=dag
)

task_rapport_qualite = PythonOperator(
    task_id='generer_rapport_qualite',
    python_callable=generer_rapport_qualite,
    dag=dag
)

task_supprimer_invalides >> task_standardiser >> task_valider_coords >> task_rapport_qualite
