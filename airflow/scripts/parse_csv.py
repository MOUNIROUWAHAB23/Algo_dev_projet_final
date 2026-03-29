# ============================================
# Script - Parsing des fichiers CSV
# ============================================

import csv
import os
from datetime import datetime

INPUT_DIR = '/tmp/data'


def parse_csv_file(file_path):
    """Parse un fichier CSV spécifique"""

    if not os.path.exists(file_path):
        print(f"  ✗ Fichier non trouvé: {file_path}")
        return []

    records = []

    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            # Détection automatique du delimiter
            sample = f.read(1024)
            f.seek(0)

            try:
                delimiter = csv.Sniffer().sniff(sample).delimiter
            except:
                delimiter = ';'

            reader = csv.DictReader(f, delimiter=delimiter)

            for row in reader:
                records.append(dict(row))

        print(f"  ✓ {os.path.basename(file_path)}: {len(records)} enregistrements")

    except Exception as e:
        print(f"  ✗ Erreur parsing {file_path}: {str(e)}")

    return records


def parse_all_datasets(downloaded_datasets):
    """Parse tous les datasets téléchargés"""

    print(f"\n{'='*60}")
    print(f"Démarrage du parsing CSV - {datetime.now().isoformat()}")
    print(f"{'='*60}\n")

    all_data = {}

    for dataset in downloaded_datasets['datasets']:
        if dataset['status'] == 'success':
            name = dataset['name']
            path = dataset['path']

            records = parse_csv_file(path)
            all_data[name] = records

    # Résumé
    total_records = sum(len(v) for v in all_data.values())

    print(f"\n{'='*60}")
    print(f"RÉSUMÉ DU PARSING")
    print(f"{'='*60}")
    print(f"  Datasets parsés: {len(all_data)}")
    print(f"  Total enregistrements: {total_records}")
    print(f"{'='*60}\n")

    return all_data


if __name__ == '__main__':
    # Test standalone
    test_datasets = {
        'datasets': [
            {'name': 'hotels', 'path': '/tmp/data/hotels.csv', 'status': 'success'}
        ]
    }
    parse_all_datasets(test_datasets)
