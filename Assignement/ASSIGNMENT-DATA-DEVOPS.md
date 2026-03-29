# 📋 ASSIGNMENT - Data Analyst #3 (DevOps & Infrastructure)

**Rôle:** Data Analyst - Infrastructure & DevOps
**Durée Totale:** 12 heures
**Dates:** 28 Mars - 5 Avril 2026
**Équipe:** 5 personnes (vous travaillez avec Data Lead + PM)

---

## 🎯 VOTRE MISSION

Vous êtes le **Infrastructure Guardian**. Vous configurez Docker, MongoDB, Airflow, et assurez que tout fonctionne en production.

---

## 📅 PHASE 0 - Initial Setup (28 Mars, 2h)

### Tâche 0.2: Docker & MongoDB Setup
**Durée:** 2 heures
**Importance:** CRITIQUE (bloque tout)

**Description:**
Lancer Docker avec tous les services (MongoDB, Airflow, etc.).

**Étapes:**

1. **Vérifier Docker installé** (15 min)
```bash
docker --version
# Should show Docker version

docker-compose --version
# Should show Docker Compose version

# If not installed:
# Windows: Download from https://www.docker.com/products/docker-desktop
```

2. **Lancer docker-compose** (30 min)
```bash
# Navigate to project root
cd "C:\Users\HP\OneDrive\Desktop\master_engeneering\Bmad"

# Review docker-compose.yml
cat docker-compose.yml
# (should include: MongoDB, Airflow webserver, Airflow scheduler, Airflow triggerer)

# Start all services
docker-compose up -d

# Verify services running
docker-compose ps
# Should show all services with status "Up"
```

3. **Verify MongoDB is accessible** (45 min)
```bash
# Option 1: Via mongosh (MongoDB shell)
mongosh --host localhost:27017

# Or Option 2: Via MongoDB Compass UI
# Download: https://www.mongodb.com/products/tools/compass
# Connect to: mongodb://localhost:27017

# Verify connection
use tourisme
db.createCollection("test")
db.test.insertOne({ "test": "data" })
db.test.find()
# Should show the test document

# Cleanup
db.test.deleteOne({ "test": "data" })
```

4. **Verify Airflow is accessible** (15 min)
```bash
# Open browser
# http://localhost:8080

# Default credentials:
# Username: airflow
# Password: airflow

# Should see Airflow UI with no errors
```

**Acceptance Criteria:**
- [ ] Docker running
- [ ] All services in docker-compose.ps show "Up"
- [ ] MongoDB accessible at localhost:27017
- [ ] Database "tourisme" créée
- [ ] Airflow accessible at http://localhost:8080
- [ ] No port conflicts (8080, 27017, 3001, 3000)

**Blockers:**
- ⚠️ Docker must be installed and running
- ⚠️ Ports 8080, 27017 must be available

---

## 📅 PHASE 1 - Airflow Configuration (29 Mars, 2h)

### Tâche 1.9: Airflow Environment & Connections
**Durée:** 2 heures
**Importance:** HAUTE

**Description:**
Configurer Airflow avec les bonnes variables et connexions.

**Étapes:**

1. **Configure Airflow variables** (1h)
```bash
# Access Airflow CLI
docker exec -it bmad-airflow-webserver bash

# Set variables
airflow variables set DATA_LAKE_PATH /datalake
airflow variables set MONGODB_URI mongodb://localhost:27017
airflow variables set DATA_GOUV_API_URL https://www.data.gouv.fr/api

# Verify
airflow variables list
```

2. **Create MongoDB connection** (30 min)
```bash
# Via Airflow UI
# Navigate to: Admin → Connections

# Create new connection:
# Connection ID: mongodb_default
# Connection Type: mongo
# Host: mongodb
# Port: 27017
# Database: tourisme
# Extra: { "srv": false }

# Test connection
# Click "Test" button in UI
```

3. **Create HTTP connection for data.gouv.fr** (30 min)
```bash
# Via Airflow UI
# Create new connection:
# Connection ID: datagouv_api
# Connection Type: HTTP
# Host: https://www.data.gouv.fr
# Extra: { "auth_type": "no_auth" }
```

**Acceptance Criteria:**
- [ ] Airflow variables set (3 variables)
- [ ] MongoDB connection créée et testée
- [ ] HTTP connection created
- [ ] Pas d'erreurs dans Airflow logs

---

## 📅 PHASE 1B - Monitoring & Logging (29-31 Mars, 3h)

### Tâche 1.10: Airflow Monitoring Setup
**Durée:** 2 heures
**Importance:** HAUTE

**Description:**
Mettre en place le monitoring d'Airflow en temps réel.

**Votre travail:**

1. **Créer scripts de monitoring** (1h)
```python
# airflow/scripts/airflow_monitor.py
import requests
import json
from datetime import datetime
from pathlib import Path

class AirflowMonitor:
    """Monitor Airflow health and DAG status"""
    
    def __init__(self, airflow_url='http://localhost:8080'):
        self.airflow_url = airflow_url
        self.auth = ('airflow', 'airflow')  # Default credentials
    
    def get_health(self):
        """Check Airflow health status"""
        try:
            response = requests.get(
                f'{self.airflow_url}/api/v1/health',
                auth=self.auth,
                timeout=5
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def get_dag_status(self, dag_id):
        """Get status of a specific DAG"""
        try:
            response = requests.get(
                f'{self.airflow_url}/api/v1/dags/{dag_id}',
                auth=self.auth
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def get_dag_runs(self, dag_id, limit=10):
        """Get recent DAG runs"""
        try:
            response = requests.get(
                f'{self.airflow_url}/api/v1/dags/{dag_id}/dagRuns',
                auth=self.auth,
                params={'limit': limit}
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def get_datalake_stats(self):
        """Get DataLake statistics"""
        datalake_path = Path('/datalake')
        
        stats = {
            'fichiers_non_traites': len(list((datalake_path / 'fichiers_non_traites').glob('*'))),
            'fichiers_traites': len(list((datalake_path / 'fichiers_traites').glob('*'))),
            'archives': len(list((datalake_path / 'archives').glob('*'))),
        }
        
        return stats
    
    def generate_report(self):
        """Generate monitoring report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'airflow_health': self.get_health(),
            'datalake_stats': self.get_datalake_stats(),
            'dags': {}
        }
        
        # Get status of each DAG
        for dag_id in ['import_hebergements_touristiques', 'recuperation_disponibilites', 'data_lake_archivage']:
            report['dags'][dag_id] = {
                'status': self.get_dag_status(dag_id),
                'recent_runs': self.get_dag_runs(dag_id, limit=5)
            }
        
        return report
    
    def save_report(self, report, path='/datalake/monitoring/report.json'):
        """Save report to file"""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

# Usage
if __name__ == '__main__':
    monitor = AirflowMonitor()
    report = monitor.generate_report()
    monitor.save_report(report)
    
    print(json.dumps(report, indent=2, default=str))
```

2. **Configure monitoring in Airflow DAG** (1h)
```python
# Add monitoring task to dag_import_hebergements.py
from airflow.operators.python import PythonOperator
from airflow.scripts.airflow_monitor import AirflowMonitor

def monitor_task(**context):
    """Monitor DAG execution"""
    monitor = AirflowMonitor()
    report = monitor.generate_report()
    monitor.save_report(report)
    
    # Check for errors
    health = report['airflow_health']
    if health.get('status') != 'healthy':
        raise Exception(f"Airflow health issue: {health}")
    
    return report

monitoring = PythonOperator(
    task_id='monitor',
    python_callable=monitor_task,
    dag=dag
)

# Add to DAG chain at the end
load >> monitoring
```

**Acceptance Criteria:**
- [ ] Monitoring script créé et testé
- [ ] Intégré dans Airflow DAG
- [ ] Reports générés et sauvegardés
- [ ] Health checks implémentés

---

### Tâche 1.11: Logging & Error Handling
**Durée:** 1 heure
**Importance:** MOYENNE

**Description:**
Mettre en place des logs et error handling robustes.

**Code:**

```python
# airflow/config/logging_config.py
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

def setup_logging(log_name, log_path='/datalake/logs'):
    """Setup logging for scripts"""
    
    Path(log_path).mkdir(parents=True, exist_ok=True)
    
    logger = logging.getLogger(log_name)
    logger.setLevel(logging.DEBUG)
    
    # File handler (rotating)
    fh = RotatingFileHandler(
        f'{log_path}/{log_name}.log',
        maxBytes=10*1024*1024,  # 10 MB
        backupCount=5
    )
    fh.setLevel(logging.DEBUG)
    
    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)
    
    logger.addHandler(fh)
    logger.addHandler(ch)
    
    return logger

# Usage in DAG tasks
logger = setup_logging('import_hebergements')

def download_data(**context):
    """Download with error handling"""
    try:
        logger.info('Starting data download...')
        # ... download logic ...
        logger.info(f'Successfully downloaded {record_count} records')
    except Exception as e:
        logger.error(f'Download failed: {e}', exc_info=True)
        raise
```

**Acceptance Criteria:**
- [ ] Logging configured
- [ ] Error handling robuste
- [ ] Logs sauvegardés en fichier
- [ ] Rotation de logs implémentée

---

## 📅 PHASE 2 - DataLake Management (30-31 Mars, 3h)

### Tâche 1.12: DataLake Cleanup & Archivage
**Durée:** 2 heures
**Importance:** MOYENNE

**Description:**
Gérer le DataLake en supprimant anciens fichiers et archivant.

**Code:**

```python
# airflow/scripts/datalake_maintenance.py
from pathlib import Path
from datetime import datetime, timedelta
import json
import shutil

class DataLakeManager:
    """Manage DataLake directory structure"""
    
    def __init__(self, datalake_path='/datalake'):
        self.datalake_path = Path(datalake_path)
        self.non_traites = self.datalake_path / 'fichiers_non_traites'
        self.traites = self.datalake_path / 'fichiers_traites'
        self.archives = self.datalake_path / 'archives'
    
    def get_file_age_days(self, filepath):
        """Get file age in days"""
        mtime = Path(filepath).stat().st_mtime
        age = datetime.now().timestamp() - mtime
        return age / (24 * 3600)
    
    def cleanup_non_traites(self, max_age_days=7):
        """Remove processed files from non_traites"""
        removed_count = 0
        
        for filepath in self.non_traites.glob('*'):
            age = self.get_file_age_days(filepath)
            
            if age > max_age_days:
                # Check if it's been processed
                manifest = self.traites / f'{filepath.stem}_manifest.json'
                
                if manifest.exists():
                    filepath.unlink()
                    removed_count += 1
                    print(f'Removed {filepath.name} (age: {age:.1f} days)')
        
        return removed_count
    
    def archive_old_files(self, max_age_days=30):
        """Archive processed files older than 30 days"""
        archived_count = 0
        
        for filepath in self.traites.glob('*.json'):
            # Skip manifest and status files
            if filepath.name in ['manifest.json', 'status.json']:
                continue
            
            age = self.get_file_age_days(filepath)
            
            if age > max_age_days:
                archive_file = self.archives / filepath.name
                shutil.move(str(filepath), str(archive_file))
                archived_count += 1
                print(f'Archived {filepath.name} (age: {age:.1f} days)')
        
        return archived_count
    
    def get_storage_stats(self):
        """Get DataLake storage statistics"""
        import os
        
        def get_dir_size(path):
            total = 0
            for entry in Path(path).rglob('*'):
                if entry.is_file():
                    total += entry.stat().st_size
            return total
        
        stats = {
            'non_traites': {
                'file_count': len(list(self.non_traites.glob('*'))),
                'size_mb': get_dir_size(self.non_traites) / (1024*1024)
            },
            'traites': {
                'file_count': len(list(self.traites.glob('*'))),
                'size_mb': get_dir_size(self.traites) / (1024*1024)
            },
            'archives': {
                'file_count': len(list(self.archives.glob('*'))),
                'size_mb': get_dir_size(self.archives) / (1024*1024)
            }
        }
        
        stats['total_mb'] = (
            stats['non_traites']['size_mb'] +
            stats['traites']['size_mb'] +
            stats['archives']['size_mb']
        )
        
        return stats
    
    def generate_manifest(self, import_id, record_count, fields):
        """Generate manifest for import"""
        manifest = {
            'importId': import_id,
            'timestamp': datetime.now().isoformat(),
            'recordCount': record_count,
            'fields': fields,
            'storageStats': self.get_storage_stats()
        }
        
        manifest_path = self.traites / f'{import_id}_manifest.json'
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        return manifest

# Usage
if __name__ == '__main__':
    manager = DataLakeManager()
    
    # Cleanup old files
    print('=== DataLake Cleanup ===')
    removed = manager.cleanup_non_traites(max_age_days=7)
    print(f'Removed {removed} old files\n')
    
    # Archive old files
    print('=== DataLake Archiving ===')
    archived = manager.archive_old_files(max_age_days=30)
    print(f'Archived {archived} old files\n')
    
    # Get stats
    print('=== Storage Statistics ===')
    stats = manager.get_storage_stats()
    print(json.dumps(stats, indent=2))
```

**Acceptance Criteria:**
- [ ] Cleanup script créé et testé
- [ ] Archive script créé et testé
- [ ] Storage stats générées
- [ ] Manifests générés pour chaque import

---

### Tâche 1.13: Docker Monitoring & Troubleshooting
**Durée:** 1 heure
**Importance:** MOYENNE

**Description:**
Mettre en place health checks et debugging pour Docker.

**Code:**

```bash
# scripts/docker_monitor.sh
#!/bin/bash

echo "=== Docker Services Health Check ==="

# Check Docker daemon
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon not running"
    exit 1
fi

echo "✓ Docker daemon running"

# Check running containers
echo ""
echo "=== Running Containers ==="
docker-compose ps

# Check MongoDB
echo ""
echo "=== MongoDB Health Check ==="
if docker exec bmad-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✓ MongoDB is healthy"
    
    # Get database stats
    docker exec bmad-mongodb mongosh --eval "
        use tourisme
        print('Collections:', db.getCollectionNames().length)
        print('Databases:', db.getMongo().getDBNames())
    "
else
    echo "❌ MongoDB is not responding"
fi

# Check Airflow
echo ""
echo "=== Airflow Health Check ==="
if curl -s http://localhost:8080/api/v1/health | grep -q "healthy"; then
    echo "✓ Airflow is healthy"
else
    echo "❌ Airflow health check failed"
fi

# Check disk space
echo ""
echo "=== Disk Space ==="
du -sh /datalake
df -h /

# View recent logs
echo ""
echo "=== Recent Errors ==="
docker-compose logs --tail 50 | grep -i error || echo "No errors found"

echo ""
echo "=== Check Complete ==="
```

**Acceptance Criteria:**
- [ ] Health check script créé
- [ ] Verifies all services
- [ ] Displays resource usage
- [ ] Shows recent errors

---

## 📅 PHASE 5 - Deployment (5 Avril, 3h)

### Tâche 5.4: Production Environment Setup
**Durée:** 2 heures
**Importance:** CRITIQUE

**Description:**
Préparer l'infrastructure de production.

**Étapes:**

1. **MongoDB Atlas Setup** (1h)
```bash
# 1. Create account at https://www.mongodb.com/cloud/atlas
# 2. Create M0 free cluster (no credit card required)
# 3. Get connection string:
#    mongodb+srv://user:password@cluster.mongodb.net/tourisme?retryWrites=true

# 4. Update environment variables
# In docker-compose.yml or .env.production:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tourisme

# 5. Test connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/tourisme"
```

2. **Airflow Production Config** (1h)
```bash
# docker-compose.prod.yml
# Change EXECUTOR from LocalExecutor to CeleryExecutor (if scaling)
# Add Redis service for task queue
# Update security settings:
# - Change default passwords
# - Enable authentication
# - Set proper RBAC roles

# Environment variables for production
AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION=True
AIRFLOW__CORE__LOAD_DEFAULT_CONNECTIONS=False
AIRFLOW__CORE__LOAD_EXAMPLES=False
AIRFLOW__API__AUTH_BACKENDS=airflow.api.auth.backend.basic_auth
```

**Acceptance Criteria:**
- [ ] MongoDB Atlas cluster créé
- [ ] Connection string testée
- [ ] Production docker-compose créé
- [ ] Security settings applied
- [ ] Health checks pass on prod

---

### Tâche 5.7: Database Backup & Recovery
**Durée:** 1 heure
**Importance:** CRITIQUE

**Description:**
Mettre en place les backups automatiques.

**Code:**

```bash
# scripts/backup_mongodb.sh
#!/bin/bash

BACKUP_DIR="/datalake/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/tourisme_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

echo "Starting MongoDB backup..."

# Backup using mongodump
mongodump --uri="mongodb://localhost:27017/tourisme" --archive=$BACKUP_FILE --gzip

if [ $? -eq 0 ]; then
    echo "✓ Backup successful: $BACKUP_FILE"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "tourisme_*.tar.gz" -mtime +7 -delete
    
    echo "✓ Cleaned up old backups"
else
    echo "❌ Backup failed"
    exit 1
fi
```

**Setup cron job (Linux/Mac):**
```bash
# Add to crontab -e
# Daily backup at 2 AM
0 2 * * * /path/to/backup_mongodb.sh >> /var/log/mongodb_backup.log 2>&1
```

**For Windows (Task Scheduler):**
```batch
# Create scheduled task running:
# C:\path\to\backup_mongodb.bat

# Content of batch file:
@echo off
mongodump --uri="mongodb://localhost:27017/tourisme" --archive=C:\datalake\backups\tourisme_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.tar.gz --gzip
```

**Acceptance Criteria:**
- [ ] Backup script créé et testé
- [ ] Manual backup fonctionne
- [ ] Cron job configuré (ou Task Scheduler)
- [ ] Restore procedure documentée

---

## 📊 RÉSUMÉ VOTRE TÂCHES

| Phase | Tâches | Durée | Status |
|-------|--------|-------|--------|
| 0 | Docker & MongoDB Setup | 2h | ⏳ |
| 1 | Airflow Config | 2h | ⏳ |
| 1B | Monitoring & Logging | 3h | ⏳ |
| 2 | DataLake Management | 3h | ⏳ |
| 5 | Production Setup | 3h | ⏳ |
| **TOTAL** | **Infrastructure & DevOps** | **13h** | |

---

## 🎯 SUCCESS CRITERIA

- [ ] Docker running avec tous les services
- [ ] MongoDB accessible et opérationnel
- [ ] Airflow accessible et DAGs visibles
- [ ] Monitoring en place et fonctionnel
- [ ] Logging configuré et ingérant des logs
- [ ] DataLake management scripts créés
- [ ] Cleanup/Archive working
- [ ] Production environment préparé
- [ ] MongoDB Atlas connecté
- [ ] Backups automatiques en place
- [ ] Health checks passing

---

## 📋 CHECKLIST OPÉRATIONNEL

**Avant chaque DAG run:**
```bash
# 1. Verify all services running
docker-compose ps

# 2. Check MongoDB connection
mongosh "mongodb://localhost:27017/tourisme" --eval "db.adminCommand('ping')"

# 3. Check Airflow health
curl http://localhost:8080/api/v1/health

# 4. Check disk space
du -sh /datalake
df -h

# 5. Review recent logs
docker-compose logs --tail 20
```

**After each DAG run:**
```bash
# 1. Check import success
mongosh "mongodb://localhost:27017/tourisme" --eval "db.hebergements.countDocuments()"

# 2. View DataLake stats
ls -lah /datalake/fichiers_traites/
ls -lah /datalake/fichiers_non_traites/

# 3. Check for errors
docker-compose logs | grep -i error

# 4. Review quality report
cat /datalake/monitoring/report.json
```

---

**Assigné à:** Data Analyst #3 (DevOps)
**Créé:** 28 Mars 2026, 22:45 UTC
**Status:** 🟢 Ready to launch immediately

**Next:** Lancez Docker setup immédiatement! 🚀

---

## 📞 SUPPORT & TROUBLESHOOTING

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Docker daemon not running | Start Docker Desktop or `service docker start` |
| MongoDB connection refused | Check `docker-compose ps`, verify mongo container running |
| Airflow not accessible | Check port 8080 not used, verify Airflow containers running |
| Disk space full | Archive old files in DataLake, clean Docker volumes |
| DAG won't trigger | Check Airflow scheduler running, review DAG syntax |

**Get help:**
- Check logs: `docker-compose logs <service>`
- Exec into container: `docker exec -it <container> bash`
- Slack: #projet-hebergements-infra

