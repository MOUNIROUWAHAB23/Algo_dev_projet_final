# ============================================
# Script - Géocodage des adresses
# ============================================

import requests
import time
from datetime import datetime

# API Nominatim (OpenStreetMap) - Gratuit, pas de clé requise
NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

# Rate limiting: 1 requête/seconde max (requis par Nominatim)
RATE_LIMIT_DELAY = 1.0


def geocode_address(adresse, code_postal, commune, departement):
    """Géocode une adresse unique via Nominatim"""

    # Construire la requête
    query = f"{adresse or ''} {code_postal} {commune}, France".strip()

    params = {
        'q': query,
        'format': 'json',
        'limit': 1,
        'addressdetails': 1,
    }

    headers = {
        'User-Agent': 'TourismePlateforme/1.0 (contact@example.com)'
    }

    try:
        response = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        results = response.json()

        if results:
            return {
                'latitude': float(results[0]['lat']),
                'longitude': float(results[0]['lon']),
                'status': 'success'
            }
        else:
            # Essayer avec commune + departement uniquement
            query_fallback = f"{commune} {departement}, France"

            params['q'] = query_fallback
            response = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10)
            results = response.json()

            if results:
                return {
                    'latitude': float(results[0]['lat']),
                    'longitude': float(results[0]['lon']),
                    'status': 'partial'
                }

            return {'latitude': None, 'longitude': None, 'status': 'failed'}

    except Exception as e:
        print(f"  Erreur géocodage: {str(e)}")
        return {'latitude': None, 'longitude': None, 'status': 'error'}


def geocode_all_addresses(normalized_data):
    """Géocode toutes les adresses"""

    print(f"\n{'='*60}")
    print(f"Démarrage du géocodage - {datetime.now().isoformat()}")
    print(f"{'='*60}\n")

    geocoded_data = {}
    total_geocoded = 0
    total_failed = 0

    for source_type, records in normalized_data.items():
        print(f"Géocodage de {source_type} ({len(records)} enregistrements)...")

        geocoded_records = []

        for i, record in enumerate(records):
            # Rate limiting
            if i % 10 == 0:
                print(f"  Progress: {i}/{len(records)}")

            result = geocode_address(
                record.get('adresse'),
                record.get('codePostal'),
                record.get('commune'),
                record.get('departement')
            )

            record['latitude'] = result['latitude']
            record['longitude'] = result['longitude']
            record['geocoding_status'] = result['status']

            geocoded_records.append(record)

            if result['status'] == 'success':
                total_geocoded += 1
            else:
                total_failed += 1

            # Respecter le rate limiting
            time.sleep(RATE_LIMIT_DELAY)

        geocoded_data[source_type] = geocoded_records

        success_rate = sum(1 for r in geocoded_records if r['geocoding_status'] == 'success')
        print(f"  ✓ Taux de succès: {success_rate}/{len(records)} ({success_rate*100/len(records):.1f}%)")

    # Résumé
    print(f"\n{'='*60}")
    print(f"RÉSUMÉ DU GÉOCODAGE")
    print(f"{'='*60}")
    print(f"  Adresses géocodées: {total_geocoded}")
    print(f"  Échecs: {total_failed}")
    print(f"  Taux de succès: {total_geocoded*100/(total_geocoded+total_failed):.1f}%")
    print(f"{'='*60}\n")

    return geocoded_data


if __name__ == '__main__':
    # Test avec une adresse
    test = geocode_address('1 Rue de la Paix', '75001', 'Paris', 'Paris')
    print(f"Résultat: {test}")
