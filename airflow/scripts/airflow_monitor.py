"""
Airflow Real-Time Monitoring Endpoint
Fournit l'état des DAGs, imports, et disponibilités en temps réel
À intégrer au Backend Express (route: /api/airflow/status)
"""

from datetime import datetime, timedelta
from typing import Dict, Any
import json
import os

class AirflowStatusMonitor:
    """Monitor l'état en temps réel d'Airflow"""
    
    def __init__(self):
        self.data_lake_root = os.getenv('DATA_LAKE_ROOT', '/opt/airflow/data_lake')
    
    def get_datalake_stats(self) -> Dict[str, Any]:
        """Statistiques du DataLake"""
        try:
            non_traites_dir = os.path.join(self.data_lake_root, 'fichiers_non_traites')
            traites_dir = os.path.join(self.data_lake_root, 'fichiers_traites')
            archives_dir = os.path.join(self.data_lake_root, 'archives')
            
            # Compter fichiers
            non_traites_count = len([f for f in os.listdir(non_traites_dir) 
                                     if os.path.isfile(os.path.join(non_traites_dir, f))])
            traites_count = len(os.listdir(traites_dir))
            archives_count = len(os.listdir(archives_dir))
            
            # Calculer tailles
            def get_dir_size(path):
                total = 0
                for dirpath, dirnames, filenames in os.walk(path):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        if os.path.exists(fp):
                            total += os.path.getsize(fp)
                return total
            
            return {
                'status': 'operational',
                'timestamp': datetime.now().isoformat(),
                'datalake': {
                    'root': self.data_lake_root,
                    'fichiers_non_traites': {
                        'count': non_traites_count,
                        'size_mb': round(get_dir_size(non_traites_dir) / (1024 * 1024), 2)
                    },
                    'fichiers_traites': {
                        'batches': traites_count,
                        'size_mb': round(get_dir_size(traites_dir) / (1024 * 1024), 2)
                    },
                    'archives': {
                        'count': archives_count,
                        'size_mb': round(get_dir_size(archives_dir) / (1024 * 1024), 2)
                    }
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def get_dag_status(self, dag_id: str) -> Dict[str, Any]:
        """Récupère l'état d'un DAG spécifique"""
        from airflow.models import DagRun, TaskInstance
        from sqlalchemy import desc
        
        try:
            # Récupérer le dernier run
            last_run = DagRun.objects.filter(
                dag_id=dag_id
            ).order_by(desc(DagRun.execution_date)).first()
            
            if not last_run:
                return {'dag_id': dag_id, 'status': 'no_run'}
            
            # Récupérer les tâches du run
            tasks = TaskInstance.objects.filter(
                dag_id=dag_id,
                execution_date=last_run.execution_date
            ).all()
            
            task_stats = {
                'total': len(tasks),
                'success': sum(1 for t in tasks if t.state == 'success'),
                'running': sum(1 for t in tasks if t.state == 'running'),
                'failed': sum(1 for t in tasks if t.state == 'failed'),
                'queued': sum(1 for t in tasks if t.state == 'queued')
            }
            
            return {
                'dag_id': dag_id,
                'status': last_run.state,
                'execution_date': last_run.execution_date.isoformat(),
                'start_date': last_run.start_date.isoformat() if last_run.start_date else None,
                'end_date': last_run.end_date.isoformat() if last_run.end_date else None,
                'tasks': task_stats
            }
        except Exception as e:
            return {
                'dag_id': dag_id,
                'status': 'error',
                'error': str(e)
            }
    
    def get_all_dags_status(self) -> Dict[str, Any]:
        """État de tous les DAGs importants"""
        dags = [
            'import_hebergements_touristiques',
            'recuperation_disponibilites',
            'data_lake_archivage'
        ]
        
        return {
            'timestamp': datetime.now().isoformat(),
            'dags': [self.get_dag_status(dag) for dag in dags]
        }
    
    def get_availability_stats(self, db_connection) -> Dict[str, Any]:
        """Statistiques de disponibilité en temps réel"""
        try:
            db = db_connection
            
            # Stats disponibilités
            disponibilites = db['disponibilites']
            total = disponibilites.count_documents({})
            disponibles = disponibilites.count_documents({'disponible': True})
            
            # Prix moyen
            pipeline = [
                {'$match': {'prixParNuit': {'$ne': None}}},
                {'$group': {'_id': None, 'moyenne': {'$avg': '$prixParNuit'}}}
            ]
            prix_moyen = list(disponibilites.aggregate(pipeline))
            
            # Dernière mise à jour
            last_update = disponibilites.find_one(
                sort=[('dernieresMiseAJour', -1)]
            )
            
            return {
                'status': 'operational',
                'timestamp': datetime.now().isoformat(),
                'statistics': {
                    'total': total,
                    'disponibles': disponibles,
                    'taux_disponibilite': round(disponibles * 100 / total, 2) if total > 0 else 0,
                    'prix_moyen': prix_moyen[0]['moyenne'] if prix_moyen else None,
                    'last_update': last_update['dernieresMiseAJour'].isoformat() if last_update else None
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def get_health_check(self) -> Dict[str, Any]:
        """Health check complet du système"""
        return {
            'service': 'Airflow Monitor',
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'checks': {
                'datalake': self.get_datalake_stats(),
                'dags': self.get_all_dags_status()
            }
        }


# ============================================================
# FLASK/EXPRESS INTEGRATION - API ENDPOINT
# ============================================================

def setup_airflow_monitoring_api(app):
    """Setup route pour l'API de monitoring (Express.js)"""
    
    monitor = AirflowStatusMonitor()
    
    # Route: GET /api/airflow/status
    @app.get('/api/airflow/status')
    def get_airflow_status():
        """Retourne l'état complet d'Airflow"""
        return {
            'datalake': monitor.get_datalake_stats(),
            'dags': monitor.get_all_dags_status(),
            'timestamp': datetime.now().isoformat()
        }
    
    # Route: GET /api/airflow/health
    @app.get('/api/airflow/health')
    def get_health():
        """Simple health check"""
        return {
            'status': 'ok',
            'timestamp': datetime.now().isoformat()
        }
    
    # Route: GET /api/airflow/datalake
    @app.get('/api/airflow/datalake')
    def get_datalake():
        """Statistiques DataLake uniquement"""
        return monitor.get_datalake_stats()
    
    # Route: GET /api/airflow/dags/:dag_id
    @app.get('/api/airflow/dags/<dag_id>')
    def get_dag(dag_id):
        """État d'un DAG spécifique"""
        return monitor.get_dag_status(dag_id)
    
    # Route: GET /api/airflow/availabilities
    @app.get('/api/airflow/availabilities')
    def get_availabilities():
        """Stats de disponibilité en temps réel"""
        from pymongo import MongoClient
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        client = MongoClient(mongo_uri)
        db = client['tourisme']
        try:
            return monitor.get_availability_stats(db)
        finally:
            client.close()


# ============================================================
# STANDALONE TESTING
# ============================================================

if __name__ == '__main__':
    monitor = AirflowStatusMonitor()
    
    print("\n" + "="*60)
    print("AIRFLOW REAL-TIME MONITORING")
    print("="*60 + "\n")
    
    # Test DataLake stats
    print("📊 DataLake Statistics:")
    print(json.dumps(monitor.get_datalake_stats(), indent=2))
    
    print("\n" + "="*60)
    print("\n✅ Monitoring service ready!")
    print("Integrate with backend at: /api/airflow/status")
