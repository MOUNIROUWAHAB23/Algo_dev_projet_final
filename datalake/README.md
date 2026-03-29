# DataLake - Plateforme Hébergements Touristiques

## Structure

### 📁 `fichiers_non_traites/`
Contient les fichiers bruts téléchargés depuis data.gouv.fr en attente de traitement.

**Contenu:** CSV/JSON bruts depuis les datasets suivants:
- INSEE Hôtels (~18 000)
- INSEE Campings (~8 000)
- INSEE Résidences hôtelières (~2 000)
- INSEE Meublés de tourisme (~15 000)
- UNAJ Auberges de jeunesse (~500)
- FTVAC Villages vacances (~1 000)

**Total attendu:** 45 000+ hébergements

### 📁 `fichiers_traites/`
Contient les données après traitement (normalisation, géocodage, déduplication).

### 📁 `archives/`
Contient les fichiers traités archivés après 30 jours.

## Workflow Airflow

- **DAG 1:** `import_hebergements_touristiques` (quotidien à 3h UTC)
  - Download → Parse → Normalize → Geocode → Load to MongoDB
  
- **DAG 2:** `recuperation_disponibilites` (toutes les 30 min)
  - Récupère les disponibilités en temps réel
  
- **DAG 3:** `data_lake_archivage` (tous les dimanches à 5h)
  - Archive les fichiers traités > 30 jours

## Monitoring

```bash
# Voir l'état du DataLake
python airflow/scripts/data_lake_manager.py

# Lister les fichiers
ls -la datalake/fichiers_non_traites/
ls -la datalake/fichiers_traites/

# Taille totale
du -sh datalake/
```

---
**Créé:** 2026-03-28T22:40:38.036425
**Status:** ✅ Initialisation complète
