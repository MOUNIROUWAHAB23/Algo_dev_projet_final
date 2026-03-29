# ============================================
# Dockerfile - Airflow
# ============================================

FROM apache/airflow:2.8.0-python3.10

USER root

# Installation des dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

USER airflow

# Copier les requirements
COPY requirements.txt ./requirements.txt

# Installation des packages Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier les DAGs, plugins et scripts
COPY dags/ ./dags/
COPY plugins/ ./plugins/
COPY scripts/ ./scripts/

# Variables d'environnement
ENV AIRFLOW__CORE__DAGS_FOLDER=/opt/airflow/dags
ENV AIRFLOW__CORE__PLUGINS_FOLDER=/opt/airflow/plugins
