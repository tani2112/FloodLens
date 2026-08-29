# FLOODLENS — Data Sources & GIS Pipeline Specification (DATA_SOURCES.md)

**Project:** FloodLens (SIH26161)  
**Document Status:** Approved Master Specification  
**Version:** 1.0.0  
**Date:** August 29, 2026  

---

## 1. Spatial & Scientific Data Strategy

FloodLens relies exclusively on freely accessible, open-access geospatial datasets for terrain, surface hydrology, administrative boundaries, and infrastructure features. Synthetic data is used ONLY for parameterized scenario inputs (e.g., dam breach width/time) and fallback demo presentations.

---

## 2. Dataset Sourcing & Inventory

| Data Layer | Primary Source | Format | Spatial Resolution / Scale | Required for MVP? | Synthetic Allowed? |
|---|---|---|---|---|---|
| **Terrain (DEM)** | SRTM 30m / Copernicus DEM | GeoTIFF | 30-meter grid resolution | **Yes** | **No** (Real DEM required) |
| **River Hydrography** | OpenStreetMap / HydroSHEDS | Vector (GeoJSON) | 1:50,000 scale lines | **Yes** | **No** |
| **Settlements / Villages** | OpenStreetMap (`place=village`) | Vector (GeoJSON) | Point nodes with names | **Yes** | Locations real; population labeled |
| **Roads & Bridges** | OpenStreetMap (`highway=*`) | Vector (GeoJSON) | Line strings & point nodes | **Yes** | **No** |
| **Dam / Reservoirs** | Public CWC / State WRD Data | Vector (GeoJSON) | Point / Polygon geometry | **Yes** | Location real; hydraulics parameterized |
| **Satellite Imagery** | Sentinel-1 SAR / Sentinel-2 | GeoTIFF / PNG | 10-meter resolution | No (Validation phase) | **Yes** (Labeled DEMO DATA) |

---

## 3. Coordinate Reference System (CRS) & Projection Rules

To eliminate spatial misalignment between raster physics solvers and web map clients, FloodLens enforces strict CRS projection standards:

1. **Simulation & GIS Metric CRS (Backend Native):** Universal Transverse Mercator (UTM) Zone metric projection (e.g., **EPSG:32644 — WGS 84 / UTM Zone 44N** for North/Central India).
   - *Rationale:* Raster cellular physics solvers require equal-area, metric grid cell dimensions ($\Delta x = 30\,\text{m}, \Delta y = 30\,\text{m}$), which spherical degrees (EPSG:4326) do not provide.
2. **Web Map Serving CRS (Frontend Boundary):** **EPSG:4326 (WGS 84 Latitude/Longitude)**.
   - *Rationale:* MapLibre GL JS and GeoJSON web client standards operate natively in EPSG:4326.
3. **Reproduction Rule:** Backend API transformation pipelines (`gis/raster_to_vector.py`) MUST reproject all metric UTM vector polygons to EPSG:4326 prior to serving JSON API payloads to the frontend.

---

## 4. Repository Data Tree & File Specifications

```
data/
├── README.md               # Sourcing documentation & raw download instructions
├── dem.tif                 # Clipped DEM GeoTIFF (UTM projection, EPSG:32644)
├── villages.geojson        # Village point nodes (WGS84, EPSG:4326)
├── rivers.geojson          # Main river centerlines (WGS84, EPSG:4326)
├── roads.geojson           # Transportation network lines (WGS84, EPSG:4326)
└── dam.geojson             # Dam structure point/line geometry (WGS84, EPSG:4326)
```

> [!CAUTION]
> Large raw GeoTIFF files (>10MB) must NEVER be committed to Git. The `.gitignore` file enforces exclusion of `data/*.tif`. The dataset is generated reproducibly via `scripts/prepare_data.py`.

---

## 5. Automated Data Preparation Pipeline (`scripts/prepare_data.py`)

A single Python CLI script automates downloading, clipping, reprojecting, and building spatial indices for the chosen AOI:

```bash
python scripts/prepare_data.py --aoi-bbox 76.8,10.2,77.2,10.5 --output-dir data/
```

### Script Execution Workflow:
1. Ingest raw SRTM/Copernicus DEM tile covering the specified AOI bounding box.
2. Reproject DEM raster from EPSG:4326 to target UTM Zone (e.g., EPSG:32644) using bilinear resampling.
3. Clip DEM raster to the exact AOI rectangle and write `data/dem.tif`.
4. Query Overpass API (OpenStreetMap) for village nodes, river lines, and road networks inside the AOI bbox.
5. Save extracted vector features to `data/villages.geojson`, `data/rivers.geojson`, and `data/roads.geojson`.
6. Compute spatial bounding box metadata for insertion into the PostGIS `study_areas` table.
