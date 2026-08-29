#!/usr/bin/env python3
"""
FloodLens Spatial Data Preparation Script (CLI Skeleton)
Automates DEM clipping, CRS re-projection, and OSM vector layer extraction.
Full execution pipeline scheduled for Phase 3.
"""

import argparse

def main():
    parser = argparse.ArgumentParser(
        description="FloodLens Data Preparation CLI — Clip DEM & Extract OSM Vector Layers for AOI"
    )
    parser.add_argument(
        "--aoi-bbox",
        type=str,
        default="76.8,10.2,77.2,10.5",
        help="Bounding box coordinates in WGS84: min_lon,min_lat,max_lon,max_lat"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/",
        help="Output directory path for raster and GeoJSON files"
    )
    
    args = parser.parse_args()
    
    print("=== FloodLens Data Preparation CLI (Phase 2 Shell) ===")
    print(f"Target Bounding Box: {args.aoi_bbox}")
    print(f"Output Directory:    {args.output_dir}")
    print("STATUS: CLI skeleton initialized. Data processing pipeline will execute in Phase 3.")

if __name__ == "__main__":
    main()
