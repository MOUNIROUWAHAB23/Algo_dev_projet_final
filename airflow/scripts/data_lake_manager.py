# ============================================
# Script - Gestion du Data Lake
# ============================================

import os
import shutil
import json
from datetime import datetime
from pathlib import Path

DATA_LAKE_ROOT = '/opt/airflow/data_lake'
NON_TRAITEES_DIR = os.path.join(DATA_LAKE_ROOT, 'non_traitees')
TRAITEES_DIR = os.path.join(DATA_LAKE_ROOT, 'traitees')


def init_data_lake():
    """Initialise la structure du data lake"""

    os.makedirs(NON_TRAITEES_DIR, exist_ok=True)
    os.makedirs(TRAITEES_DIR, exist_ok=True)

    print(f"✅ Data Lake initialisé: {DATA_LAKE_ROOT}")
    print(f"   - Non traitées: {NON_TRAITEES_DIR}")
    print(f"   - Traitées: {TRAITEES_DIR}")

    return {
        'root': DATA_LAKE_ROOT,
        'non_traitees': NON_TRAITEES_DIR,
        'traitees': TRAITEES_DIR
    }


def save_fichier_non_traite(file_content, source_type, filename):
    """Sauvegarde un fichier brut dans non_traitees"""

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_filename = f"{source_type}_{timestamp}_{filename}"
    file_path = os.path.join(NON_TRAITEES_DIR, safe_filename)

    with open(file_path, 'wb') as f:
        f.write(file_content)

    file_size = os.path.getsize(file_path)

    print(f"📁 Fichier non traité sauvegardé: {safe_filename} ({file_size} bytes)")

    return {
        'path': file_path,
        'filename': safe_filename,
        'source': source_type,
        'size': file_size,
        'timestamp': timestamp
    }


def move_to_traitees(source_path, processing_info):
    """Déplace un fichier traité vers traitees avec métadonnées"""

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    batch_dir = os.path.join(TRAITEES_DIR, f"processed_{timestamp}")

    os.makedirs(batch_dir, exist_ok=True)

    # Copier le fichier traité
    filename = os.path.basename(source_path)
    dest_path = os.path.join(batch_dir, filename)
    shutil.copy2(source_path, dest_path)

    # Sauvegarder le manifest
    manifest = {
        'timestamp': timestamp,
        'processed_at': datetime.now().isoformat(),
        'files': [filename],
        'processing_info': processing_info
    }

    manifest_path = os.path.join(batch_dir, 'manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f"📁 Fichier traité archivé: {batch_dir}")

    return {
        'batch_dir': batch_dir,
        'manifest': manifest
    }


def list_non_traitees():
    """Liste tous les fichiers non traités"""

    files = []

    for filename in os.listdir(NON_TRAITEES_DIR):
        file_path = os.path.join(NON_TRAITEES_DIR, filename)

        stat = os.stat(file_path)

        files.append({
            'filename': filename,
            'path': file_path,
            'size': stat.st_size,
            'created_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
        })

    return sorted(files, key=lambda x: x['modified_at'], reverse=True)


def list_traitees():
    """Liste tous les batches de fichiers traités"""

    batches = []

    for batch_name in os.listdir(TRAITEES_DIR):
        batch_dir = os.path.join(TRAITEES_DIR, batch_name)

        if os.path.isdir(batch_dir):
            manifest_path = os.path.join(batch_dir, 'manifest.json')

            if os.path.exists(manifest_path):
                with open(manifest_path, 'r') as f:
                    manifest = json.load(f)

                batches.append({
                    'batch_name': batch_name,
                    'path': batch_dir,
                    'manifest': manifest
                })

    return sorted(batches, key=lambda x: x['batch_name'], reverse=True)


def archive_old_processed_files(days=30):
    """Archive les fichiers traités de plus de N jours"""

    cutoff_date = datetime.now().timestamp() - (days * 24 * 60 * 60)
    archived_count = 0

    archive_dir = os.path.join(DATA_LAKE_ROOT, 'archives')
    os.makedirs(archive_dir, exist_ok=True)

    for batch_name in os.listdir(TRAITEES_DIR):
        batch_dir = os.path.join(TRAITEES_DIR, batch_name)

        if os.path.isdir(batch_dir):
            stat = os.stat(batch_dir)

            if stat.st_mtime < cutoff_date:
                # Déplacer vers archives
                shutil.move(batch_dir, archive_dir)
                archived_count += 1
                print(f"📦 Archivé: {batch_name}")

    print(f"✅ {archived_count} batches archivés")

    return {'archived_count': archived_count}


def get_data_lake_stats():
    """Retourne des statistiques sur le data lake"""

    # Stats non_traitees
    non_traitees_count = len(os.listdir(NON_TRAITEES_DIR))
    non_traitees_size = sum(
        os.path.getsize(os.path.join(NON_TRAITEES_DIR, f))
        for f in os.listdir(NON_TRAITEES_DIR)
        if os.path.isfile(os.path.join(NON_TRAITEES_DIR, f))
    )

    # Stats traitees
    traitees_count = len(os.listdir(TRAITEES_DIR))
    traitees_size = 0
    total_files = 0

    for batch_name in os.listdir(TRAITEES_DIR):
        batch_dir = os.path.join(TRAITEES_DIR, batch_name)
        if os.path.isdir(batch_dir):
            for f in os.listdir(batch_dir):
                file_path = os.path.join(batch_dir, f)
                if os.path.isfile(file_path):
                    traitees_size += os.path.getsize(file_path)
                    total_files += 1

    return {
        'timestamp': datetime.now().isoformat(),
        'non_traitees': {
            'files_count': non_traitees_count,
            'total_size_bytes': non_traitees_size,
            'total_size_mb': round(non_traitees_size / (1024 * 1024), 2)
        },
        'traitees': {
            'batches_count': traitees_count,
            'files_count': total_files,
            'total_size_bytes': traitees_size,
            'total_size_mb': round(traitees_size / (1024 * 1024), 2)
        }
    }


if __name__ == '__main__':
    # Test standalone
    init_data_lake()

    print("\n" + "="*60)
    print("STATISTIQUES DATA LAKE")
    print("="*60)

    stats = get_data_lake_stats()
    print(json.dumps(stats, indent=2))
