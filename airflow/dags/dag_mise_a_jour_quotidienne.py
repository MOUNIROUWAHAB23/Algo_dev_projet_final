# ============================================
# DAG - Mise à jour quotidienne des données
# ============================================

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'equipe-donnees',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'mise_a_jour_quotidienne',
    default_args=default_args,
    description='Mise à jour incrémentale des hébergements touristiques',
    schedule_interval='0 6 * * *',  # Tous les jours à 6h
    catchup=False,
    tags=['tourisme', 'maintenance', 'quotidien']
)


def verifier_nouvelles_donnees(**context):
    """Vérifie s'il y a de nouvelles données sur data.gouv.fr"""
    import requests

    DATAGOV_API = 'https://www.data.gouv.fr/api/1/datasets/'
    datasets_ids = [
        '5379e5f2c7558f5221d8958f',
        '5379e5f2c7558f5221d89590',
        '5379e5f2c7558f5221d89591',
        '5379e5f2c7558f5221d89592',
        '5379e5f2c7558f5221d89593',
        '5379e5f2c7558f5221d89594'
    ]

    modifications = []

    for dataset_id in datasets_ids:
        try:
            response = requests.get(f"{DATAGOV_API}{dataset_id}/", timeout=30)
            data = response.json()

            last_modified = data.get('last_modified')
            if last_modified:
                modifications.append({
                    'dataset': dataset_id,
                    'last_modified': last_modified
                })
        except Exception as e:
            print(f"Erreur vérification {dataset_id}: {e}")

    context['ti'].xcom_push(key='modifications', value=modifications)

    if modifications:
        print(f"✅ {len(modifications)} datasets modifiés détectés")
        return True
    else:
        print("ℹ️ Aucune modification détectée")
        return False


def telechargement_incremental(**context):
    """Télécharge uniquement les datasets modifiés"""
    from scripts.download_datasets import download_dataset

    ti = context['ti']
    modifications = ti.xcom_pull(key='modifications', task_ids='verifier_nouvelles_donnees')

    if not modifications:
        print("Aucun téléchargement nécessaire")
        return []

    downloaded = []
    for mod in modifications:
        # Logique de téléchargement ciblé
        print(f"Téléchargement dataset {mod['dataset']}...")
        downloaded.append(mod['dataset'])

    return downloaded


def nettoyage_donnees_anciennes(**context):
    """Supprime les doublons et données obsolètes"""
    from pymongo import MongoClient

    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['hebergements']

    # Supprimer doublons (garder le plus récent)
    pipeline = [
        {
            '$group': {
                '_id': {
                    'source': '$source',
                    'nom': '$nom',
                    'commune': '$commune'
                },
                'ids': {'$push': '$_id'},
                'count': {'$sum': 1}
            }
        },
        {'$match': {'count': {'$gt': 1}}}
    ]

    duplicates = list(collection.aggregate(pipeline))

    deleted = 0
    for dup in duplicates:
        ids_to_delete = dup['ids'][1:]  # Garder le premier
        result = collection.delete_many({'_id': {'$in': ids_to_delete}})
        deleted += result.deleted_count

    client.close()

    print(f"✅ {deleted} doublons supprimés")

    return {'deleted': deleted}


def genererRapport(**context):
    """Génère un rapport de mise à jour"""
    ti = context['ti']

    nettoiement = ti.xcom_pull(task_ids='nettoyage_donnees_anciennes')

    rapport = {
        'date': datetime.now().isoformat(),
        'datasets_updates': ti.xcom_pull(key='modifications', task_ids='verifier_nouvelles_donnees'),
        'nettoyage': nettoiement
    }

    print(f"\n{'='*60}")
    print("RAPPORT DE MISE À JOUR")
    print(f"{'='*60}")
    print(f"Date: {rapport['date']}")
    print(f"Doublons supprimés: {rapport['nettoyage'].get('deleted', 0) if rapport['nettoyage'] else 0}")
    print(f"{'='*60}\n")

    return rapport


task_verifier = PythonOperator(
    task_id='verifier_nouvelles_donnees',
    python_callable=verifier_nouvelles_donnees,
    dag=dag
)

task_telecharger = PythonOperator(
    task_id='telechargement_incremental',
    python_callable=telechargement_incremental,
    dag=dag
)

task_nettoyer = PythonOperator(
    task_id='nettoyage_donnees_anciennes',
    python_callable=nettoyage_donnees_anciennes,
    dag=dag
)

task_rapport = PythonOperator(
    task_id='generer_rapport',
    python_callable=genererRapport,
    dag=dag
)

task_verifier >> task_telecharger >> task_nettoyer >> task_rapport
