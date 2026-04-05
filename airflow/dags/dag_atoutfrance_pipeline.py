import os
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

# Dossier où sont stockés les fichiers bruts téléchargés
RAW_DIR = "/opt/airflow/datalake/fichiers_non_traites"

default_args = {
    'owner': 'data_lead_p1',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

# Fonction de validation : vérifie que le fichier a bien été téléchargé et n'est pas vide
def validate_downloaded_file():
    files = [f for f in os.listdir(RAW_DIR) if f.endswith('.csv')]
    if not files:
        raise ValueError("ERREUR : Aucun fichier CSV trouvé après le téléchargement.")
    
    latest_file = max([os.path.join(RAW_DIR, f) for f in files], key=os.path.getctime)
    file_size = os.path.getsize(latest_file)
    
    if file_size < 1000: # Si le fichier fait moins de 1Ko, c'est sûrement une erreur 404
        raise ValueError(f"ERREUR : Le fichier {latest_file} est suspectement petit ({file_size} octets).")
    print(f"Validation réussie : {latest_file} prêt pour la normalisation.")

with DAG(
    'dag_atoutfrance_daily_pipeline', # Nouveau nom demandé dans la US
    default_args=default_args,
    description='Pipeline Quotidien Production : Extraction, Validation, Normalisation, QA, Chargement et Archivage',
    schedule_interval='30 4 * * *', # 04:30 UTC
    start_date=datetime(2026, 3, 29),
    catchup=False,
    dagrun_timeout=timedelta(minutes=15), # Timeout global de 15 min demandé
    tags=['production', 'daily', 'atout_france'],
) as dag:

    # ---------------------------------------------------------
    # 1. EXTRACTION & VALIDATION
    # ---------------------------------------------------------
    download_task = BashOperator(
        task_id='1_download_atout_france',
        bash_command='python /opt/airflow/scripts/download_atoutfrance.py',
    )

    validate_task = PythonOperator(
        task_id='2_validate_csv',
        python_callable=validate_downloaded_file,
    )

    # ---------------------------------------------------------
    # 2. TRANSFORMATION & QUALITÉ
    # ---------------------------------------------------------
    normalize_task = BashOperator(
        task_id='3_normalize_atout_france',
        bash_command='python /opt/airflow/scripts/normalize_atoutfrance.py',
    )

    quality_check_task = BashOperator(
        task_id='4_check_quality',
        # On ajoute export PYTHONPATH pour que Python trouve le dossier scripts !
        bash_command='export PYTHONPATH="/opt/airflow:/opt/airflow/scripts:$PYTHONPATH" && pip install -q pytest && python -m pytest /opt/airflow/tests/unitaire/test_normalize_atoutfrance.py -v',
    )

    # ---------------------------------------------------------
    # 3. CHARGEMENT (Opérationnel & Analytique)
    # ---------------------------------------------------------
    load_mongo_task = BashOperator(
        task_id='5a_load_mongodb',
        bash_command='python /opt/airflow/scripts/load_mongodb.py',
    )

    geocode_task = BashOperator(
        task_id='5b_geocode_atout_france',
        bash_command='python /opt/airflow/scripts/geocode_addresses.py',
        execution_timeout=timedelta(minutes=45) # Exception de timeout pour l'API externe
    )

    load_dwh_task = BashOperator(
        task_id='5c_load_postgres_dwh',
        bash_command='python /opt/airflow/scripts/load_postgres_dwh.py',
    )

    # ---------------------------------------------------------
    # 4. ARCHIVAGE & NOTIFICATION
    # ---------------------------------------------------------
    archive_task = BashOperator(
        task_id='6_archive_data',
        # Crée un dossier archive et déplace les vieux fichiers bruts
        bash_command=f'mkdir -p /opt/airflow/datalake/archives && mv {RAW_DIR}/*.csv /opt/airflow/datalake/archives/ || true',
    )

    notify_task = BashOperator(
        task_id='7_send_notifications',
        bash_command='echo "✅ Pipeline Quotidien terminé avec succès le $(date)"',
    )

    # ==========================================
    # ORCHESTRATION ET DÉPENDANCES
    # ==========================================
    
    # Étape 1 : Chaîne stricte de préparation (E -> Validate -> Transform -> Quality)
    download_task >> validate_task >> normalize_task >> quality_check_task
    
    # Étape 2 : Bifurcation après le feu vert de la qualité
    quality_check_task >> load_dwh_task
    quality_check_task >> load_mongo_task >> geocode_task
    
    # Étape 3 : Convergence (On attend que Mongo+Geocode ET Postgres aient fini pour archiver)
    [load_dwh_task, geocode_task] >> archive_task >> notify_task