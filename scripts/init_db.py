#!/usr/bin/env python3
"""
FloodLens Database Initialization & Seeding Script (Idempotent)
Creates SQLite tables and seeds the canonical Idukki study area if missing.
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.db import init_db

if __name__ == "__main__":
    print("[FloodLens DB Init] Initializing database and verifying canonical AOI seed...")
    init_db()
    print("[FloodLens DB Init] Database initialization complete.")
