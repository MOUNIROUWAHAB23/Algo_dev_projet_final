#!/usr/bin/env python3
"""
Initialize DataLake on first Airflow run
Auto-executed by Airflow during startup
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import json

# Configuration
PROJECT_ROOT = "/opt/airflow"  # Inside Docker
DATA_LAKE_ROOT = os.path.join(PROJECT_ROOT, "data_lake")
SUBDIRS = ["fichiers_non_traites", "fichiers_traites", "archives"]

def init_datalake():
    """Initialize the DataLake directory structure"""
    
    try:
        # Create root directory
        Path(DATA_LAKE_ROOT).mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        for subdir in SUBDIRS:
            subdir_path = os.path.join(DATA_LAKE_ROOT, subdir)
            Path(subdir_path).mkdir(parents=True, exist_ok=True)
            print(f"✅ Created: {subdir_path}")
        
        # Create initial status file
        status = {
            "created_at": datetime.now().isoformat(),
            "status": "initialized",
            "version": "1.0",
            "structure": {
                "root": DATA_LAKE_ROOT,
                "non_traitees": os.path.join(DATA_LAKE_ROOT, "fichiers_non_traites"),
                "traites": os.path.join(DATA_LAKE_ROOT, "fichiers_traites"),
                "archives": os.path.join(DATA_LAKE_ROOT, "archives")
            }
        }
        
        status_file = os.path.join(DATA_LAKE_ROOT, "status.json")
        with open(status_file, "w") as f:
            json.dump(status, f, indent=2)
        
        print(f"✅ DataLake initialized at: {DATA_LAKE_ROOT}")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing DataLake: {e}")
        return False

if __name__ == "__main__":
    init_datalake()
