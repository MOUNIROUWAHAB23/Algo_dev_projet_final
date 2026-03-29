# ============================================
# DAG - Récupération des disponibilités
# ============================================

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
from pymongo import MongoClient
import requests
import json

default_args = {
    'owner': 'equipe-disponibilites',
    'depends_on_past': False,
    'email_on_failure': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=10),
}

dag = DAG(
    'recuperation_disponibilites',
    default_args=default_args,
    description='Récupération des disponibilités en temps réel',
    schedule_interval='*/30 * * * *',  # Toutes les 30 minutes
    catchup=False,
    tags=['tourisme', 'disponibilites', 'temps-reel']
)

# URLs des APIs externes pour les disponibilités (exemples)
# À remplacer par les vraies APIs partenaires
AVAILABILITY_APIS = [
    {
        'name': 'partner_api_1',
        'url': 'https://api.partenaire1.com/availability',
        'auth_type': 'bearer'
    },
    {
        'name': 'partner_api_2',
        'url': 'https://api.partenaire2.com/v1/disponibilites',
        'auth_type': 'api_key'
    }
]


def fetch_disponibilites_api(**context):
    """Récupère les disponibilités depuis les APIs externes"""

    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    hebergements_collection = db['hebergements']
    disponibilites_collection = db['disponibilites']

    all_disponibilites = []

    for api in AVAILABILITY_APIS:
        try:
            # Configuration des headers selon le type d'auth
            headers = {'Content-Type': 'application/json'}

            if api['auth_type'] == 'bearer':
                headers['Authorization'] = f"Bearer {api.get('token', '')}"
            elif api['auth_type'] == 'api_key':
                headers['X-API-Key'] = api.get('api_key', '')

            # Période de recherche (7 prochains jours)
            date_debut = datetime.now().strftime('%Y-%m-%d')
            date_fin = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

            params = {
                'start_date': date_debut,
                'end_date': date_fin,
                'limit': 100
            }

            response = requests.get(
                api['url'],
                headers=headers,
                params=params,
                timeout=30
            )

            if response.ok:
                data = response.json()

                for item in data.get('results', []):
                    # Mapper les disponibilités avec les hébergements locaux
                    hebergement = hebergements_collection.find_one({
                        '$or': [
                            {'nom': item.get('nom')},
                            {'email': item.get('contact_email')},
                            {'telephone': item.get('contact_phone')}
                        ]
                    })

                    if hebergement:
                        disponibilite = {
                            'hebergement': hebergement['_id'],
                            'dateDebut': datetime.strptime(item.get('start_date'), '%Y-%m-%d'),
                            'dateFin': datetime.strptime(item.get('end_date'), '%Y-%m-%d'),
                            'prixParNuit': item.get('price_per_night'),
                            'disponible': item.get('available', True),
                            'typeDisponibilite': 'INSTANTANEE' if item.get('instant_book') else 'SUR_DEMANDE',
                            'source': 'API_EXTERNE',
                            'dernieresMiseAJour': datetime.now()
                        }

                        all_disponibilites.append(disponibilite)

                print(f"✅ {api['name']}: {len(data.get('results', []))} disponibilités récupérées")
            else:
                print(f"⚠️ {api['name']}: Erreur {response.status_code}")

        except Exception as e:
            print(f"❌ Erreur API {api['name']}: {str(e)}")

    client.close()

    # Sauvegarder dans MongoDB
    if all_disponibilites:
        for disp in all_disponibilites:
            disponibilites_collection.update_one(
                {
                    'hebergement': disp['hebergement'],
                    'dateDebut': disp['dateDebut'],
                    'dateFin': disp['dateFin']
                },
                {'$set': disp},
                upsert=True
            )

    print(f"\n✅ Total disponibilités: {len(all_disponibilites)}")

    return {'count': len(all_disponibilites), 'timestamp': datetime.now().isoformat()}


def nettoyer_anciennes_disponibilites(**context):
    """Supprime les disponibilités expirées"""

    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['disponibilites']

    # Supprimer les disponibilités passées de plus de 30 jours
    cutoff_date = datetime.now() - timedelta(days=30)

    result = collection.delete_many({
        'dateFin': {'$lt': cutoff_date}
    })

    client.close()

    print(f"✅ {result.deleted_count} anciennes disponibilités supprimées")

    return {'deleted': result.deleted_count}


def generer_stats_disponibilites(**context):
    """Génère des statistiques sur les disponibilités"""

    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['disponibilites']

    # Stats globales
    total = collection.count_documents({})
    disponibles = collection.count_documents({'disponible': True})

    # Stats par type
    par_type = collection.aggregate([
        {'$group': {
            '_id': '$typeDisponibilite',
            'count': {'$sum': 1}
        }}
    ])

    # Prix moyen
    prix_moyen = collection.aggregate([
        {'$match': {'prixParNuit': {'$ne': None}}},
        {'$group': {'_id': None, 'moyenne': {'$avg': '$prixParNuit'}}}
    ])

    client.close()

    stats = {
        'total': total,
        'disponibles': disponibles,
        'taux_disponibilite': round(disponibles * 100 / total, 2) if total > 0 else 0,
        'par_type': list(par_type),
        'prix_moyen': list(prix_moyen)[0]['moyenne'] if list(prix_moyen) else None
    }

    print(f"\n{'='*60}")
    print("STATISTIQUES DISPONIBILITÉS")
    print(f"{'='*60}")
    print(f"Total: {stats['total']}")
    print(f"Disponibles: {stats['disponibles']} ({stats['taux_disponibilite']}%)")
    print(f"Prix moyen: {stats['prix_moyen']:.2f}€")
    print(f"{'='*60}\n")

    return stats


task_fetch = PythonOperator(
    task_id='fetch_disponibilites_api',
    python_callable=fetch_disponibilites_api,
    dag=dag
)

task_clean = PythonOperator(
    task_id='nettoyer_anciennes_disponibilites',
    python_callable=nettoyer_anciennes_disponibilites,
    dag=dag
)

task_stats = PythonOperator(
    task_id='generer_stats_disponibilites',
    python_callable=generer_stats_disponibilites,
    dag=dag
)

task_fetch >> task_clean >> task_stats
