# FloodLens — Scientific Methodology & Model Specification

**Document Version:** 1.0.0  
**Status:** Approved Release Documentation  
**Target Platform:** FloodLens Level 1 Hydrodynamic & Decision-Support Engine  

---

## 1. Overview & Theoretical Framework

FloodLens implements a physics-informed cellular **Level 1 2D Diffusive-Wave Hydrodynamic Solver**. The model simplifies full 2D Shallow Water Equations (SWE) by assuming gravity and friction slope forces dominate inertia and momentum advection. This formulation provides stable, computationally efficient inundation routing over complex digital elevation terrain.

---

## 2. Mathematical & Computational Formulation

### 2.1 Diffusive-Wave Governing Equations
The 2D depth-averaged diffusive-wave continuity and momentum equations govern spatial water transfer:

1. **Continuity Equation:**
   $$\frac{\partial h}{\partial t} + \frac{\partial (uh)}{\partial x} + \frac{\partial (vh)}{\partial y} = q$$

   Where:
   - $h$: Water depth ($m$)
   - $u, v$: Depth-averaged flow velocities in X and Y directions ($m/s$)
   - $q$: Source term / breach inflow rate ($m/s$)

2. **Friction-Gradients (Manning-Strickler Formulation):**
   $$u = \frac{1}{n} h^{2/3} S_{fx}^{1/2} \operatorname{sgn}\left(-\frac{\partial z_w}{\partial x}\right)$$
   $$v = \frac{1}{n} h^{2/3} S_{fy}^{1/2} \operatorname{sgn}\left(-\frac{\partial z_w}{\partial y}\right)$$

   Where:
   - $z_w = z_{\text{dem}} + h$: Total water surface elevation ($m$)
   - $S_{fx}, S_{fy}$: Water surface slope gradients $\left| \frac{\partial z_w}{\partial x} \right|, \left| \frac{\partial z_w}{\partial y} \right|$
   - $n$: Manning's surface roughness coefficient ($s/m^{1/3}$)

---

## 3. Dam Breach Inflow Hydrograph Formulation

Dam-break and reservoir breach discharge hydrographs ($Q_{\text{breach}}(t)$) are computed using a modified Froehlich breach model combined with a trapezoidal breach formation growth hydrograph:

- **Peak Breach Discharge ($Q_p$):**
  $$Q_p = 0.607 \cdot V_w^{0.295} \cdot H_w^{1.24}$$

  Where:
  - $V_w$: Reservoir volume ($Mm^3$)
  - $H_w$: Initial water head above breach invert ($m$)

- **Hydrograph Time-Series ($Q(t)$):**
  - **Formation Phase ($0 \le t \le t_{\text{breach}}$):** Discharge increases linearly or polynomially to $Q_p$.
  - **Drainage Phase ($t > t_{\text{breach}}$):** Exponential reservoir volume drawdown decay.

---

## 4. Discrete Grid & Timestep Execution

- **Spatial Mesh:** Structured 2D square cell grid derived from digital elevation models (DEM) reprojected to local metric UTM projection (EPSG:32643).
- **Temporal Resolution:** Discrete timesteps ($\Delta t = 5.0\text{ min}$) simulated over user-defined total duration ($1.0\text{ hr}$ to $6.0\text{ hr}$).
- **Courant-Friedrichs-Lewy (CFL) Stability:** Explicit cellular time step stability bounds enforce flux limits:
  $$\Delta t \le \frac{\Delta x}{4 \max(\sqrt{g h}, |u|)}$$

---

## 5. GIS Processing & Vector Export Pipeline

1. **Raster-to-Vector Inundation Polygonization:**
   - Cells with depth $h \ge 0.1\text{ m}$ are classified as flooded.
   - Continuous flooded cells are polygonized into GeoJSON Feature Collections using GDAL/Rasterio polygonization.

2. **Hydrological KPI Metrics:**
   - **Peak Flood Extent ($km^2$):** Total surface area of inundated cells ($h \ge 0.1\text{ m}$).
   - **Maximum Depth ($m$):** Highest recorded water column height across all grid cells.
   - **Peak Flow Velocity ($m/s$):** Maximum surface flow magnitude ($u^2 + v^2)^{1/2}$.
   - **Earliest Wave Arrival Time ($min$):** Time elapsed before water depth exceeds $0.1\text{ m}$ at downstream receptor cells.
   - **Mass Balance Error (%):** Conservation accuracy computed between cumulative breach volume input and surface storage volume.

---

## 6. Exposure Analytics & Decision Support

### 6.1 Settlement Exposure Analysis
- Settlement boundaries are evaluated against flood polygons using spatial overlay geometry calculations.
- Risk ratings:
  - **SAFE:** Zero inundation overlap ($h < 0.1\text{ m}$).
  - **MODERATE:** $h < 0.5\text{ m}$ or arrival time $> 60\text{ min}$.
  - **HIGH:** $0.5\text{ m} \le h < 1.5\text{ m}$ and arrival time $\le 60\text{ min}$.
  - **CRITICAL:** $h \ge 1.5\text{ m}$ or arrival time $\le 15\text{ min}$.

### 6.2 Road Corridor Exposure Analysis
- Road centerline segments are clipped against inundation extent boundaries to calculate affected corridor length ($km$) and impassability status ($h \ge 0.3\text{ m}$).

---

## 7. Model Limitations & Guardrail Principles

1. **Model Scope:** Level 1 diffusive wave solver is designed for **scenario screening and emergency decision support**. It is not an official engineering design or dam safety certification model.
2. **Demographic Data:** Population exposure metrics require official census shapefile datasets. Where absent, the platform explicitly reports `"Requires Census Dataset"`.
3. **Infrastructure Layers:** Critical infrastructure vectors (power grids, hospitals) report `"Dataset Unavailable"` to preserve scientific transparency.
4. **Planned Adapters:** Level 2 Shallow Water Equations (SWE), SPH, and Delft3D NetCDF adapters are registered as future release stubs.
