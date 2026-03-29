# ============================================
# Airflow DAG - Import Hébergements Touristiques
# ============================================

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
import sys
import os

# Ajout du chemin des scripts
sys.path.append('/opt/airflow/scripts')

# Default arguments
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

# DAG definition
dag = DAG(
    'import_hebergements_touristiques',
    default_args=default_args,
    description='Import des données hébergements depuis data.gouv.fr',
    schedule_interval='0 3 * * *',  # Tous les jours à 3h
    start_date=datetime(2026, 3, 27),
    catchup=False,
    tags=['tourisme', 'data.gouv.fr', 'import'],
)

# ============================================
# TASKS
# ============================================

def download_datasets(**context):
    """Télécharge tous les datasets depuis data.gouv.fr"""
    from download_datasets import download_all_datasets

    result = download_all_datasets()
    context['ti'].xcom_push(key='downloaded_datasets', value=result)
    return result


def parse_csv_files(**context):
    """Parse les fichiers CSV téléchargés"""
    from parse_csv import parse_all_datasets

    downloaded = context['ti'].xcom_pull(task_ids='download_datasets')
    result = parse_all_datasets(downloaded)
    context['ti'].xcom_push(key='parsed_data', value=result)
    return result


def normalize_data(**context):
    """Normalise les données selon le schema commun"""
    from normalize_data import normalize_all_datasets

    parsed_data = context['ti'].xcom_pull(task_ids='parse_csv_files')
    result = normalize_all_datasets(parsed_data)
    context['ti'].xcom_push(key='normalized_data', value=result)
    return result


def geocode_addresses(**context):
    """Géocode les adresses sans coordonnées GPS"""
    from geocode_addresses import geocode_all_addresses

    normalized_data = context['ti'].xcom_pull(task_ids='normalize_data')
    result = geocode_all_addresses(normalized_data)
    context['ti'].xcom_push(key='geocoded_data', value=result)
    return result


def load_to_mongodb(**context):
    """Charge les données dans MongoDB"""
    from load_mongodb import load_all_to_mongodb

    geocoded_data = context['ti'].xcom_pull(task_ids='geocode_addresses')
    result = load_all_to_mongodb(geocoded_data)
    return result


def log_import_stats(**context):
    """Enregistre les statistiques d'import"""
    from datetime import datetime

    ti = context['ti']
    result = ti.xcom_pull(task_ids='load_to_mongodb')

    stats = {
        'executed_at': datetime.now().isoformat(),
        'status': 'success',
        'total_records': result.get('total', 0),
        'inserted': result.get('inserted', 0),
        'updated': result.get('updated', 0),
    }

    print(f"Import statistics: {stats}")
    return stats


# Définition des tâches
download_task = PythonOperator(
    task_id='download_datasets',
    python_callable=download_datasets,
    provide_context=True,
    dag=dag,
)

parse_task = PythonOperator(
    task_id='parse_csv_files',
    python_callable=parse_csv_files,
    provide_context=True,
    dag=dag,
)

normalize_task = PythonOperator(
    task_id='normalize_data',
    python_callable=normalize_data,
    provide_context=True,
    dag=dag,
)

geocode_task = PythonOperator(
    task_id='geocode_addresses',
    python_callable=geocode_addresses,
    provide_context=True,
    dag=dag,
)

load_task = PythonOperator(
    task_id='load_to_mongodb',
    python_callable=load_to_mongodb,
    provide_context=True,
    dag=dag,
)

log_task = PythonOperator(
    task_id='log_import_stats',
    python_callable=log_import_stats,
    provide_context=True,
    dag=dag,
)

# Définition du flux
download_task >> parse_task >> normalize_task >> geocode_task >> load_task >> log_task
