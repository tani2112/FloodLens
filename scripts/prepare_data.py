#!/usr/bin/env python3
"""
FloodLens Spatial Data Preparation Pipeline
Authoritative CLI Script matching docs/DATA_SOURCES.md and Phase 3 specifications.
Prepares DEM rasters, reprojects CRS to UTM EPSG:32643, clips to AOI, extracts GeoJSON vector layers,
validates spatial datasets, and generates data_summary.json metadata.
"""

import argparse
import datetime
import json
import os
import sys

# Ensure repository root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from gis.dem_processor import validate_aoi_bbox, generate_canonical_dem_raster, validate_dem_raster
from gis.vector_processor import generate_canonical_vectors, validate_vector_layer


def main():
    parser = argparse.ArgumentParser(
        description="FloodLens Data Preparation CLI — Clip DEM & Prepare Vector Layers for Canonical AOI"
    )
    parser.add_argument(
        "--aoi-bbox",
        type=str,
        default="76.80,9.85,77.10,10.20",
        help="Bounding box coordinates in WGS84: min_lon,min_lat,max_lon,max_lat (Default: Idukki Dam Catchment)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/",
        help="Output base directory path for raster, vector, and metadata files"
    )
    parser.add_argument(
        "--crs-metric",
        type=str,
        default="EPSG:32643",
        help="Metric UTM Coordinate Reference System for backend simulation engine (Default: EPSG:32643 for Zone 43N)"
    )
    parser.add_argument(
        "--dem-resolution",
        type=float,
        default=30.0,
        help="Grid cell resolution in meters (Default: 30.0m)"
    )

    args = parser.parse_args()

    print("===============================================================")
    print("      FLOODLENS SPATIAL DATA PREPARATION PIPELINE (PHASE 3)    ")
    print("===============================================================")

    # 1. Parse and Validate AOI Bounding Box
    try:
        bbox_coords = [float(x.strip()) for x in args.aoi_bbox.split(",")]
    except Exception as e:
        print(f"ERROR: Failed to parse --aoi-bbox '{args.aoi_bbox}': {e}")
        sys.exit(1)

    valid_bbox, msg = validate_aoi_bbox(bbox_coords)
    if not valid_bbox:
        print(f"ERROR: Invalid AOI bounding box: {msg}")
        sys.exit(1)

    print(f"✓ AOI Bounding Box Validated: {bbox_coords} (WGS84)")
    print(f"✓ Canonical Metric CRS Target: {args.crs_metric}")
    print(f"✓ DEM Resolution Target:       {args.dem_resolution} meters")

    # 2. Establish Directory Tree
    base_dir = os.path.abspath(args.output_dir)
    processed_dir = os.path.join(base_dir, "processed")
    metadata_dir = os.path.join(base_dir, "metadata")
    raw_dir = os.path.join(base_dir, "raw")
    config_dir = os.path.join(base_dir, "config")

    for d in [base_dir, processed_dir, metadata_dir, raw_dir, config_dir]:
        os.makedirs(d, exist_ok=True)

    # 3. Generate & Clip DEM Raster (EPSG:32643 Metric UTM)
    dem_path = os.path.join(processed_dir, "dem.tif")
    root_dem_path = os.path.join(base_dir, "dem.tif")

    print("\n--- Step 1: Processing DEM Terrain Raster ---")
    dem_meta = generate_canonical_dem_raster(
        output_path=dem_path,
        bbox=bbox_coords,
        crs_epsg=args.crs_metric,
        resolution_m=args.dem_resolution
    )

    # Create root symlink/copy if needed by backend default configuration
    if not os.path.exists(root_dem_path):
        generate_canonical_dem_raster(
            output_path=root_dem_path,
            bbox=bbox_coords,
            crs_epsg=args.crs_metric,
            resolution_m=args.dem_resolution
        )
    print(f"✓ Generated metric DEM raster: {dem_path} ({dem_meta['width']}x{dem_meta['height']} cells)")

    # 4. Generate & Process Vector Layers (WGS84 EPSG:4326)
    print("\n--- Step 2: Extracting & Validating Vector Layers ---")
    vector_counts = generate_canonical_vectors(output_dir=processed_dir, bbox=bbox_coords)
    # Also mirror vectors to data root for convenient dev access
    generate_canonical_vectors(output_dir=base_dir, bbox=bbox_coords)

    print(f"✓ Processed Villages GeoJSON: {vector_counts['villages']} settlements")
    print(f"✓ Processed Rivers GeoJSON:   {vector_counts['rivers']} river segments")
    print(f"✓ Processed Roads GeoJSON:    {vector_counts['roads']} transportation links")
    print(f"✓ Processed Dam GeoJSON:      {vector_counts['dams']} dam structure points")

    # 5. Execute Spatial Quality & Integrity Checks
    print("\n--- Step 3: Performing Spatial Validation Checks ---")
    valid_dem, dem_msg, dem_info = validate_dem_raster(dem_path)
    if not valid_dem:
        print(f"FAILED: DEM validation failed: {dem_msg}")
        sys.exit(1)
    print(f"✓ DEM Raster Check: {dem_msg}")

    vector_files = ["villages.geojson", "rivers.geojson", "roads.geojson", "dam.geojson"]
    for vf in vector_files:
        vpath = os.path.join(processed_dir, vf)
        valid_v, vmsg, vinfo = validate_vector_layer(vpath)
        if not valid_v:
            print(f"FAILED: Vector validation failed for {vf}: {vmsg}")
            sys.exit(1)
        print(f"✓ Vector Layer '{vf}': {vmsg}")

    # 6. Generate Master Pipeline Metadata File (data_summary.json)
    print("\n--- Step 4: Generating Master Metadata Record ---")
    summary_metadata = {
        "pipeline_version": "1.0.0",
        "processed_at": datetime.datetime.utcnow().isoformat() + "Z",
        "aoi": {
            "name": "Idukki Dam & Periyar River Catchment",
            "bbox_wgs84": bbox_coords,
            "area_approx_km2": 1280.0
        },
        "crs": {
            "geographic": "EPSG:4326",
            "metric": args.crs_metric
        },
        "raster_layers": {
            "dem": {
                "file": "processed/dem.tif",
                "width": dem_meta["width"],
                "height": dem_meta["height"],
                "resolution_m": args.dem_resolution,
                "crs": args.crs_metric,
                "min_elevation_m": dem_meta["min_elevation_m"],
                "max_elevation_m": dem_meta["max_elevation_m"],
                "nodata": dem_meta["nodata"]
            }
        },
        "vector_layers": {
            "villages": {"file": "processed/villages.geojson", "feature_count": vector_counts["villages"], "crs": "EPSG:4326"},
            "rivers": {"file": "processed/rivers.geojson", "feature_count": vector_counts["rivers"], "crs": "EPSG:4326"},
            "roads": {"file": "processed/roads.geojson", "feature_count": vector_counts["roads"], "crs": "EPSG:4326"},
            "dam": {"file": "processed/dam.geojson", "feature_count": vector_counts["dams"], "crs": "EPSG:4326"}
        },
        "simulation_readiness": {
            "status": "ready",
            "target_solvers": ["level1", "level2", "sph_adapter", "delft3d_adapter"]
        }
    }

    summary_path = os.path.join(metadata_dir, "data_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary_metadata, f, indent=2)

    print(f"✓ Spatial Metadata Written: {summary_path}")

    print("\n===============================================================")
    print("  ✓ SUCCESS: PHASE 3 SPATIAL DATA PIPELINE EXECUTED CLEANLY   ")
    print("===============================================================")


if __name__ == "__main__":
    main()
