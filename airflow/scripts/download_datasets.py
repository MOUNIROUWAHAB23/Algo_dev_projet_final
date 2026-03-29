# ============================================
# Script - Téléchargement datasets data.gouv.fr
# ============================================

import requests
import os
from datetime import datetime

# Datasets data.gouv.fr - Hébergements touristiques
# Remplacer les 'xxx' par les vrais IDs de datasets
DATASETS = {
    'hotels': {
        'id': '5379e5f2c7558f5221d8958f',  # Exemple - Hôtels de tourisme
        'name': 'Hôtels de tourisme'
    },
    'campings': {
        'id': '5379e5f2c7558f5221d89590',  # Exemple - Campings
        'name': 'Campings'
    },
    'residences': {
        'id': '5379e5f2c7558f5221d89591',  # Exemple - Résidences hôtelières
        'name': 'Résidences hôtelières'
    },
    'meubles': {
        'id': '5379e5f2c7558f5221d89592',  # Exemple - Meublés de tourisme
        'name': 'Meublés de tourisme'
    },
    'auberges': {
        'id': '5379e5f2c7558f5221d89593',  # Exemple - Auberges de jeunesse
        'name': 'Auberges de jeunesse'
    },
    'villages': {
        'id': '5379e5f2c7558f5221d89594',  # Exemple - Villages vacances
        'name': 'Villages vacances'
    }
}

DATAGOV_BASE_URL = 'https://www.data.gouv.fr/fr/datasets/r/'
OUTPUT_DIR = '/tmp/data'


def download_dataset(name, dataset_info):
    """Télécharge un dataset spécifique"""

    url = f"{DATAGOV_BASE_URL}{dataset_info['id']}"
    output_path = f"{OUTPUT_DIR}/{name}.csv"

    try:
        print(f"Téléchargement de {dataset_info['name']}...")

        response = requests.get(url, timeout=30)
        response.raise_for_status()

        os.makedirs(OUTPUT_DIR, exist_ok=True)

        with open(output_path, 'wb') as f:
            f.write(response.content)

        file_size = os.path.getsize(output_path)
        print(f"  ✓ {dataset_info['name']} téléchargé ({file_size / 1024:.1f} KB)")

        return {
            'name': name,
            'path': output_path,
            'size': file_size,
            'status': 'success'
        }

    except Exception as e:
        print(f"  ✗ Erreur lors du téléchargement de {dataset_info['name']}: {str(e)}")
        return {
            'name': name,
            'path': None,
            'size': 0,
            'status': 'failed',
            'error': str(e)
        }


def download_all_datasets():
    """Télécharge tous les datasets"""

    print(f"\n{'='*60}")
    print(f"Démarrage du téléchargement - {datetime.now().isoformat()}")
    print(f"{'='*60}\n")

    results = []

    for name, info in DATASETS.items():
        result = download_dataset(name, info)
        results.append(result)

    # Résumé
    success_count = sum(1 for r in results if r['status'] == 'success')
    total_size = sum(r['size'] for r in results if r['status'] == 'success')

    print(f"\n{'='*60}")
    print(f"RÉSUMÉ DU TÉLÉCHARGEMENT")
    print(f"{'='*60}")
    print(f"  Datasets téléchargés: {success_count}/{len(DATASETS)}")
    print(f"  Taille totale: {total_size / 1024:.1f} KB")
    print(f"{'='*60}\n")

    return {
        'datasets': results,
        'success_count': success_count,
        'total_size': total_size,
        'timestamp': datetime.now().isoformat()
    }


if __name__ == '__main__':
    download_all_datasets()
