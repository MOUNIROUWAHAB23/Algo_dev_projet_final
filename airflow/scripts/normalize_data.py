# ============================================
# Script - Normalisation des données
# ============================================

import re
from datetime import datetime

# Mapping des types d'hébergements
TYPE_MAPPING = {
    'hotels': 'HOTEL',
    'campings': 'CAMPING',
    'residences': 'RESIDENCE',
    'meubles': 'MEUBLE',
    'auberges': 'AUBERGE',
    'villages': 'VILLAGE_VACANCES'
}

# Mapping des noms de champs (varie selon les datasets)
FIELD_MAPPING = {
    'nom': ['nom', 'nom_etablissement', 'enseigne', 'nom_commercial'],
    'adresse': ['adresse', 'adresse_complete', 'lieu_dit'],
    'codePostal': ['code_postal', 'cp', 'cp_etablissement'],
    'commune': ['commune', 'ville', 'nom_commune'],
    'departement': ['departement', 'dep', 'code_departement'],
    'region': ['region', 'nom_region'],
    'telephone': ['telephone', 'tel', 'numero_telephone'],
    'email': ['email', 'courriel', 'mail'],
    'url': ['url', 'site_web', 'site_internet'],
    'capacite': ['capacite', 'nombre_chambres', 'nb_emplacements', 'capacite_accueil'],
    'classement': ['classement', 'etoiles', 'categorie', 'niveau_classement']
}


def find_field(row, field_name):
    """Trouve la valeur d'un champ dans le row (noms variables)"""

    possible_names = FIELD_MAPPING.get(field_name, [field_name])

    for name in possible_names:
        if name in row and row[name]:
            return str(row[name]).strip()

    return None


def normalize_string(value):
    """Normalise une chaîne de caractères"""

    if not value:
        return None

    # Uppercase → Titlecase
    normalized = value.strip().title()

    # Supprimer les caractères spéciaux multiples
    normalized = re.sub(r'\s+', ' ', normalized)

    return normalized if normalized else None


def normalize_classement(value):
    """Normalise le classement en étoiles"""

    if not value:
        return None

    # Extraire le nombre d'étoiles
    match = re.search(r'(\d+)', str(value))
    if match:
        stars = int(match.group(1))
        if 1 <= stars <= 5:
            return f"{stars} étoiles"

    return None


def normalize_record(record, source_type):
    """Normalise un enregistrement individuel"""

    return {
        'source': source_type,
        'nom': normalize_string(find_field(record, 'nom')),
        'type': TYPE_MAPPING.get(source_type, 'AUTRE'),
        'adresse': normalize_string(find_field(record, 'adresse')),
        'codePostal': find_field(record, 'codePostal'),
        'commune': normalize_string(find_field(record, 'commune')),
        'departement': normalize_string(find_field(record, 'departement')),
        'region': normalize_string(find_field(record, 'region')),
        'latitude': None,  # Sera rempli par géocodage
        'longitude': None,
        'capacite': int(find_field(record, 'capacite')) if find_field(record, 'capacite') else None,
        'classement': normalize_classement(find_field(record, 'classement')),
        'equipements': [],  # À implémenter selon datasets
        'telephone': find_field(record, 'telephone'),
        'email': find_field(record, 'email'),
        'url': find_field(record, 'url'),
        'prixMoyen': None,  # À implémenter si disponible
        'updatedAt': datetime.now().isoformat()
    }


def normalize_all_datasets(parsed_data):
    """Normalise tous les datasets"""

    print(f"\n{'='*60}")
    print(f"Démarrage de la normalisation - {datetime.now().isoformat()}")
    print(f"{'='*60}\n")

    normalized_data = {}

    for source_type, records in parsed_data.items():
        print(f"Normalisation de {source_type}...")

        normalized_records = []

        for record in records:
            try:
                normalized = normalize_record(record, source_type)

                # Vérifier que les champs requis sont présents
                if normalized['nom'] and normalized['commune']:
                    normalized_records.append(normalized)

            except Exception as e:
                print(f"  ✗ Erreur normalisation: {str(e)}")

        print(f"  ✓ {len(normalized_records)}/{len(records)} enregistrements normalisés")
        normalized_data[source_type] = normalized_records

    # Résumé
    total_records = sum(len(v) for v in normalized_data.values())

    print(f"\n{'='*60}")
    print(f"RÉSUMÉ DE LA NORMALISATION")
    print(f"{'='*60}")
    print(f"  Datasets normalisés: {len(normalized_data)}")
    print(f"  Total enregistrements: {total_records}")
    print(f"{'='*60}\n")

    return normalized_data


if __name__ == '__main__':
    print("Script de normalisation - Exécution standalone non supportée")
