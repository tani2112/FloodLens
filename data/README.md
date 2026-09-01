# FloodLens Data Directory

This directory stores terrain rasters, vector hydrologic layers, settlement nodes, and output GIS products for FloodLens.

> [!CAUTION]
> **Data Policy & Git Rules:**
> - Large GeoTIFF raster files (`*.tif`, `*.tiff`), NetCDF files (`*.nc`), and raw dataset dumps are **EXCLUDED from Git** via `.gitignore`.
> - Do NOT commit DEM binary files directly to the repository.
> - All required spatial datasets for the canonical AOI are generated reproducibly using `python scripts/prepare_data.py`.

## Expected Directory Layout (After Phase 3 Execution)

```
data/
├── README.md               # Sourcing documentation (this file)
├── dem.tif                 # Clipped AOI DEM GeoTIFF (Metric UTM projection, EPSG:32644)
├── villages.geojson        # Settlement point nodes (WGS84, EPSG:4326)
├── rivers.geojson          # Main river centerlines (WGS84, EPSG:4326)
├── roads.geojson           # Transportation network lines (WGS84, EPSG:4326)
└── dam.geojson             # Dam structure point/line geometry (WGS84, EPSG:4326)
```

## Data Sourcing Reference
- **DEM:** SRTM 30m / Copernicus DEM 30m (OpenTopography / USGS EarthExplorer).
- **Vectors:** OpenStreetMap Overpass API (`place=village`, `waterway=river`, `highway=*`).
