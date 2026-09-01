"""
FloodLens System Backup & Maintenance Utility
Creates a timestamped local snapshot of SQLite database records, canonical configs, and simulation result artifacts.

Usage:
    python scripts/backup_data.py [--output-dir data/backups]
    python scripts/backup_data.py --restore data/backups/floodlens_backup_YYYYMMDD_HHMMSS.tar.gz
"""

import sys
import os
import json
import datetime
import shutil
import tarfile
import argparse

def create_backup(output_dir: str = "data/backups") -> str:
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"floodlens_backup_{timestamp}"
    staging_dir = os.path.join(output_dir, backup_name)
    os.makedirs(staging_dir, exist_ok=True)

    manifest = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "backup_name": backup_name,
        "items": []
    }

    # 1. Backup SQLite Database
    db_file = os.path.join("data", "floodlens.db")
    if os.path.exists(db_file):
        shutil.copy2(db_file, os.path.join(staging_dir, "floodlens.db"))
        manifest["items"].append("floodlens.db")
        print(f"[Backup] Copied SQLite database ({os.path.getsize(db_file)} bytes).")

    # 2. Backup Simulation Results Directory
    results_dir = os.path.join("data", "results")
    if os.path.exists(results_dir):
        dest_results = os.path.join(staging_dir, "results")
        shutil.copytree(results_dir, dest_results, dirs_exist_ok=True)
        manifest["items"].append("results/")
        print(f"[Backup] Copied simulation results directory.")

    # 3. Backup Config Directory
    config_dir = os.path.join("data", "config")
    if os.path.exists(config_dir):
        dest_config = os.path.join(staging_dir, "config")
        shutil.copytree(config_dir, dest_config, dirs_exist_ok=True)
        manifest["items"].append("config/")
        print(f"[Backup] Copied canonical config directory.")

    # Write Manifest
    manifest_path = os.path.join(staging_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    # Archive to tar.gz
    archive_path = os.path.join(output_dir, f"{backup_name}.tar.gz")
    with tarfile.open(archive_path, "w:gz") as tar:
        tar.add(staging_dir, arcname=backup_name)

    shutil.rmtree(staging_dir)
    print(f"[Backup Success] Snapshot created at: {archive_path}")
    return archive_path

def restore_backup(archive_path: str, target_data_dir: str = "data") -> bool:
    if not os.path.exists(archive_path):
        print(f"[Restore Error] Archive file '{archive_path}' not found.")
        return False

    temp_extract = os.path.join(target_data_dir, "_temp_restore")
    if os.path.exists(temp_extract):
        shutil.rmtree(temp_extract)

    os.makedirs(temp_extract, exist_ok=True)
    with tarfile.open(archive_path, "r:gz") as tar:
        tar.extractall(path=temp_extract)

    # Locate extracted backup folder
    extracted_subdirs = [os.path.join(temp_extract, d) for d in os.listdir(temp_extract) if os.path.isdir(os.path.join(temp_extract, d))]
    if not extracted_subdirs:
        print("[Restore Error] Invalid archive structure.")
        return False
    backup_root = extracted_subdirs[0]

    # Restore DB
    restored_db = os.path.join(backup_root, "floodlens.db")
    if os.path.exists(restored_db):
        shutil.copy2(restored_db, os.path.join(target_data_dir, "floodlens.db"))
        print("[Restore] Restored floodlens.db.")

    # Restore Results
    restored_results = os.path.join(backup_root, "results")
    if os.path.exists(restored_results):
        dest_results = os.path.join(target_data_dir, "results")
        shutil.copytree(restored_results, dest_results, dirs_exist_ok=True)
        print("[Restore] Restored results/ directory.")

    shutil.rmtree(temp_extract)
    print(f"[Restore Success] Successfully restored backup from '{archive_path}'.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FloodLens Data Backup & Restore Utility")
    parser.add_argument("--output-dir", default="data/backups", help="Directory to store backup tar.gz archives")
    parser.add_argument("--restore", default=None, help="Path to backup tar.gz archive to restore")
    args = parser.parse_args()

    if args.restore:
        restore_backup(args.restore)
    else:
        create_backup(args.output_dir)
