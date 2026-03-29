# ============================================
# DAG - Archivage du Data Lake
# ============================================

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys
import os

# Ajouter le dossier scripts au path
sys.path.append('/opt/airflow/scripts')

from data_lake_manager import (
    init_data_lake,
    archive_old_processed_files,
    get_data_lake_stats
)

default_args = {
    'owner': 'equipe-donnees',
    'depends_on_past': False,
    'email_on_failure': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'data_lake_archivage',
    default_args=default_args,
    description='Archivage et maintenance du data lake',
    schedule_interval='0 5 * * 0',  # Tous les dimanches à 5h
    catchup=False,
    tags=['tourisme', 'data-lake', 'maintenance']
)


def initialiser_data_lake(**context):
    """Initialise la structure du data lake au premier run"""

    result = init_data_lake()

    print(f"\n{'='*60}")
    print("DATA LAKE INITIALISÉ")
    print(f"{'='*60}")
    print(f"Root: {result['root']}")
    print(f"Non traitées: {result['non_traitees']}")
    print(f"Traitées: {result['traitees']}")
    print(f"{'='*60}\n")

    return result


def archiver_anciens_fichiers(**context):
    """Archive les fichiers traités de plus de 30 jours"""

    result = archive_old_processed_files(days=30)

    print(f"\n✅ Archivage terminé: {result['archived_count']} batches archivés")

    return result


def generer_rapport_data_lake(**context):
    """Génère un rapport d'état du data lake"""

    stats = get_data_lake_stats()

    print(f"\n{'='*60}")
    print("RAPPORT DATA LAKE")
    print(f"{'='*60}")
    print(f"Timestamp: {stats['timestamp']}")
    print(f"\n📁 NON TRAITÉES:")
    print(f"   Fichiers: {stats['non_traitees']['files_count']}")
    print(f"   Taille: {stats['non_traitees']['total_size_mb']} MB")
    print(f"\n📁 TRAITÉES:")
    print(f"   Batches: {stats['traitees']['batches_count']}")
    print(f"   Fichiers: {stats['traitees']['files_count']}")
    print(f"   Taille: {stats['traitees']['total_size_mb']} MB")
    print(f"{'='*60}\n")

    return stats


task_init = PythonOperator(
    task_id='initialiser_data_lake',
    python_callable=initialiser_data_lake,
    dag=dag
)

task_archive = PythonOperator(
    task_id='archiver_anciens_fichiers',
    python_callable=archiver_anciens_fichiers,
    dag=dag
)

task_rapport = PythonOperator(
    task_id='generer_rapport_data_lake',
    python_callable=generer_rapport_data_lake,
    dag=dag
)

task_init >> task_archive >> task_rapport
