# FloodLens — End-to-End User & Operational Guide

**Document Version:** 1.0.0  
**Status:** User Acceptance Demonstration Guide  

---

## Welcome to FloodLens

FloodLens is an interactive geospatial flood modeling and decision-support workspace. This guide provides a step-by-step walkthrough for operational users, emergency planners, and decision-makers.

---

## Step 1: System Readiness & Dashboard Overview

1. Open FloodLens in your web browser (`http://localhost:5173`).
2. Verify the Top Navigation system status badge displays:  
   `● SYSTEM READY • DATABASE CONNECTED`.
3. Review the Operational Dashboard:
   - **System Operational Summary:** Total simulations run, active study area, peak inundation extent, and warning state.
   - **Latest Simulation Snapshot:** Summary card for the most recent run with direct access to Analytical Overview and Map Explorer.
   - **Recent Simulations Registry:** Quick table view of previous scenario runs.

---

## Step 2: Running a New Flood Simulation

1. Click **"+ Run Simulation"** in the top navigation bar.
2. **Step 1: Select Study Area:** Choose the canonical **Idukki Dam & Periyar River Catchment, Kerala, India**.
3. **Step 2: Define Scenario:** Select scenario type (**Dam Break**, **Natural River Blockage**, **GLOF**, or **Water Release**) and set parameters:
   - Initial Reservoir Water Level ($m$)
   - Breach Width ($m$)
   - Breach Formation Duration ($min$)
   - Manning's Surface Roughness ($n$)
4. **Step 3: Select Solver Level:** Select **Level 1 — 2D Cellular Diffusive Wave** (Level 2 SWE is labeled as planned/adapter-only).
5. **Step 4: Review Parameters:** Confirm hydraulic settings and click **"Launch Simulation"**.
6. **Launch Confirmation:** A confirmation window will appear summarizing the parameters. Click **"Confirm & Run"**.

---

## Step 3: Monitoring Simulation Execution

1. The app automatically navigates to the **Simulation Progress Workspace**.
2. View real-time stage progress:
   - `Initializing Mesh & Spatial Rasters`
   - `Executing Hydrodynamic Diffusive Wave Engine`
   - `Vectorizing Inundation Extent & Contours`
   - `Computing Settlement & Road Exposure`
   - `Finalizing Database & GIS Exports`
3. Upon completion ($100\%$), click **"Open Analytical Overview"** or **"Explore Interactive Map"**.

---

## Step 4: Analytical Overview Workspace

1. **Hydrodynamic Key Performance Indicators (KPIs):**
   - Peak Flood Area ($km^2$)
   - Maximum Water Depth ($m$)
   - Maximum Flow Velocity ($m/s$)
   - Earliest Wave Arrival Time ($min$)
2. **Scientific Data Transparency Panel:** Review model solver specification, DEM resolution ($30\text{m}$ Copernicus), CRS projections (EPSG:32643 UTM), and dataset availability statuses.

---

## Step 5: Interactive Flood Map Explorer

1. Navigate to the **Map** tab.
2. **Geospatial Layer Switching:** Toggle between:
   - **Inundation Extent:** Vector polygon showing flooded zones ($h \ge 0.1\text{m}$).
   - **Water Depth Head:** Color ramp from shallow ($< 0.5\text{m}$, light blue) to deep ($> 3.0\text{m}$, dark indigo).
   - **Flow Velocity:** Color ramp representing surface water speed ($m/s$).
   - **Arrival Time:** Spatial distribution of wave front arrival times ($min$).
3. **Timeline Scrubber & Playback:**
   - Click **Play** ($\triangleright$) to animate flood propagation across 5-minute timesteps.
   - Adjust playback speed (**0.5x**, **1x**, **2x**).
   - Drag the time scrubber to view any exact timestep (e.g., $15\text{ min}$, $30\text{ min}$).
4. **Camera Controls:**
   - **Fullscreen** ($\mathbf{\text{⛶}}$): Expand map to full browser width.
   - **Zoom to Extent** ($\mathbf{\text{🔍}}$): Re-center viewport on the inundation zone.
   - **Fit to Settlements** ($\mathbf{\text{📍}}$): Focus on impacted downstream communities.

---

## Step 6: Results Analytics & Interpretation

1. Navigate to the **Results** tab.
2. Review the **"💡 How to Read Hydrodynamic Results"** guide explaining mass balance conservation error and peak velocity thresholds.
3. Inspect temporal volume evolution charts and execution summary metrics.

---

## Step 7: Impact Analytics & Early Warning Center

1. **Settlement Risk Explorer:** View risk status (**SAFE**, **MODERATE**, **HIGH**, **CRITICAL**) for downstream communities (e.g., Cheruthoni Town, Periyar River Banks, Karimban Village).
2. **Road Corridor Exposure:** Examine flooded road segments ($km$) and impassability status.
3. **Warning Center:** Review actionable decision-support advisories organized by warning level.

---

## Step 8: Scenario Comparison

1. Navigate to **Compare** from the top menu or workspace navigation.
2. Select **Run A (Baseline)** and **Run B (Comparison Scenario)**.
3. Compare parameter differences, flood extent deltas ($\Delta km^2$), maximum depth deltas ($\Delta m$), and exposure differences.

---

## Step 9: Exporting GIS Datasets

1. Click **"Export"** in the simulation workspace navigation bar.
2. **Export Modal Window:** Select available datasets:
   - **GeoJSON Flood Extent** (`.geojson`)
   - **Timeline Trajectory JSON** (`.json`)
   - **Impact Summary JSON** (`.json`)
3. Note that unsupported formats (**SHP**, **GeoTIFF**, **KML**, **PDF**) are labeled `"Unavailable"` to ensure clarity.
