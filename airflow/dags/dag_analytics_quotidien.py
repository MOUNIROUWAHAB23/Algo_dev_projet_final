# ============================================
# DAG - Analytics et statistiques quotidiennes
# ============================================

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
from pymongo import MongoClient

default_args = {
    'owner': 'equipe-analytics',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'analytics_quotidien',
    default_args=default_args,
    description='Génération des statistiques et analytics',
    schedule_interval='0 23 * * *',  # Tous les jours à 23h
    catchup=False,
    tags=['tourisme', 'analytics', 'statistiques']
)


def calculer_statistiques_par_region(**context):
    """Calcule les statistiques par région"""
    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['hebergements']

    stats_region = collection.aggregate([
        {'$group': {
            '_id': '$region',
            'total': {'$sum': 1},
            'hotels': {'$sum': {'$cond': [{'$eq': ['$type', 'HOTEL']}, 1, 0]}},
            'campings': {'$sum': {'$cond': [{'$eq': ['$type', 'CAMPING']}, 1, 0]}},
            'capacite_totale': {'$sum': '$capacite'}
        }},
        {'$sort': {'total': -1}}
    ])

    client.close()

    print(f"\n📊 STATISTIQUES PAR RÉGION")
    for stat in stats_region:
        print(f"  {stat['_id']}: {stat['total']} hébergements")

    return list(stats_region)


def calculer_repartition_types(**context):
    """Calcule la répartition par type d'hébergement"""
    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['hebergements']

    stats_type = collection.aggregate([
        {'$group': {
            '_id': '$type',
            'count': {'$sum': 1},
            'etoiles_moyennes': {'$avg': {'$ifNull': [
                {'$arrayElemAt': [
                    {'$regexFind': {'input': '$classement', 'regex': '\\d+'}}['match'] if {'$regexFind': {'input': '$classement', 'regex': '\\d+'}} else None,
                    None
                ]},
                None
            ]}}
        }},
        {'$sort': {'count': -1}}
    ])

    client.close()

    print(f"\n📊 RÉPARTITION PAR TYPE")
    for stat in stats_type:
        print(f"  {stat['_id']}: {stat['count']} établissements")

    return list(stats_type)


def calculer_top_communes(**context):
    """Calcule le top 20 des communes"""
    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['hebergements']

    top_communes = collection.aggregate([
        {'$group': {
            '_id': '$commune',
            'count': {'$sum': 1},
            'region': {'$first': '$region'}
        }},
        {'$sort': {'count': -1}},
        {'$limit': 20}
    ])

    client.close()

    print(f"\n📊 TOP 20 COMMUNES")
    for i, stat in enumerate(top_communes, 1):
        print(f"  {i}. {stat['_id']} ({stat['count']} hébergements)")

    return list(top_communes)


def sauvegarder_analytics(**context):
    """Sauvegarde les analytics dans une collection dédiée"""
    ti = context['ti']

    stats_region = ti.xcom_pull(task_ids='calculer_statistiques_par_region')
    stats_type = ti.xcom_pull(task_ids='calculer_repartition_types')
    top_communes = ti.xcom_pull(task_ids='calculer_top_communes')

    MONGODB_URI = 'mongodb://mongodb:27017'
    client = MongoClient(MONGODB_URI)
    db = client['tourisme']
    collection = db['analytics_quotidien']

    document = {
        'date': datetime.now(),
        'stats_region': stats_region or [],
        'stats_type': stats_type or [],
        'top_communes': top_communes or [],
        'total_hebergements': sum(s['count'] for s in (stats_type or []))
    }

    collection.insert_one(document)
    client.close()

    print(f"\n✅ Analytics sauvegardés pour {datetime.now().strftime('%Y-%m-%d')}")


task_stats_region = PythonOperator(
    task_id='calculer_statistiques_par_region',
    python_callable=calculer_statistiques_par_region,
    dag=dag
)

task_stats_type = PythonOperator(
    task_id='calculer_repartition_types',
    python_callable=calculer_repartition_types,
    dag=dag
)

task_top_communes = PythonOperator(
    task_id='calculer_top_communes',
    python_callable=calculer_top_communes,
    dag=dag
)

task_sauvegarder = PythonOperator(
    task_id='sauvegarder_analytics',
    python_callable=sauvegarder_analytics,
    dag=dag
)

[task_stats_region, task_stats_type, task_top_communes] >> task_sauvegarder
