# FLOODLENS — Scientific & Hydrodynamic Model Formulation (SCIENTIFIC_MODEL.md)

**Project:** FloodLens (SIH26161)  
**Document Status:** Approved Master Specification  
**Version:** 1.0.0  
**Date:** August 29, 2026  

---

## 1. Scientific Overview & Model Hierarchy

FloodLens employs a multi-tiered hydrodynamic modeling architecture. To maintain scientific integrity, all models are explicitly labeled by their mathematical formulation and scope:

1. **Level 1 (Implemented — Native Python):** 2D cellular flow-routing / diffusive wave model reading DEM elevation grids and Manning's roughness. Designed for rapid, sub-minute scenario screening.
2. **Level 2 (Planned — Native Python):** Full 2D Shallow Water Equations (SWE) mass and momentum conservation solver.
3. **Level 3 SPH Adapter (Adapter — Small Domain Demo):** Lagrangian particle hydrodynamics solver for near-field, highly turbulent breach jet mechanics (dam-break-in-a-box).
4. **Level 3 Delft3D Adapter (Adapter — NetCDF Parser):** Output ingestion adapter for industry-standard Delft3D structured grid map files (`trim-*.nc`).

---

## 2. Level 1 Model Formulation (Diffusive Wave / Cellular Routing)

> [!WARNING]
> **DISCLAIMER LABEL:** "Simplified inundation model (Level 1) — for demonstration and scenario screening, not for detailed engineering design."

### 2.1 Governing Equations
Level 1 models flood propagation as a 2D raster mass conservation problem where momentum convective terms are neglected, and flow velocity between adjacent grid cells is governed by elevation gradients and Manning's friction law.

#### Mass Continuity:
$$\frac{\partial h}{\partial t} + \nabla \cdot (h \mathbf{u}) = Q_{\text{breach}}(t)$$

Where:
- $h(x,y,t)$ is the water depth ($\text{m}$).
- $\mathbf{u}(x,y,t) = (u, v)$ is the depth-averaged flow velocity vector ($\text{m/s}$).
- $Q_{\text{breach}}(t)$ is the breach inflow hydrograph boundary condition ($\text{m}^3/\text{s}$).

#### Inter-Cell Flow Discharge (Manning's Formulation):
For flow from cell $i$ to neighboring cell $j$ separated by grid resolution $\Delta x$:

$$q_{ij} = \frac{1}{n} \cdot h_{\text{flow}}^{5/3} \cdot S_{ij}^{1/2} \cdot w_{ij}$$

Where:
- $n$ is Manning's roughness coefficient ($\text{s/m}^{1/3}$).
- $h_{\text{flow}} = \max(0, \eta_i - \max(z_i, z_j))$ is the effective flow depth ($\eta = z + h$ is total water surface elevation).
- $S_{ij} = \frac{\eta_i - \eta_j}{\Delta x}$ is the water surface slope.
- $w_{ij}$ is the cell interface width ($\text{m}$).

#### Derived Velocity & Arrival Time:
- **Velocity Proxy:** $u_{\text{cell}} = \frac{\sum |q_{ij}|}{h_{\text{cell}} \cdot \Delta x}$.
- **Arrival Time ($T_{\text{arr}}$):** The first simulation time $t$ (in minutes) where cell depth $h(x,y,t) \ge 0.05\,\text{m}$. Uninundated cells remain `NaN`.

---

### 2.2 Phase 4 Implementation Details (`simulation/level1_diffusive.py`)

The native Python Level 1 engine executes the 2D diffusive wave formulation using NumPy vectorization and active subgrid bounding-box tracking:

- **Source Injection Hydrograph:** Water volume is released from the dam source cell using a parameterized hydrograph peaking at $t = t_b$:
  $$Q_{\text{breach}}(t) = Q_{\text{peak}} \cdot \min\left(1.0, \frac{t}{t_b}\right) \cdot \exp\left(-\frac{\max(0, t - t_b)}{t_b}\right)$$
- **Flux Capping & Non-Negativity:** Inter-cell volume transfer per timestep $\Delta t$ is strictly capped to $\le 20\%$ of current source cell storage, guaranteeing non-negative depth ($h \ge 0$) and preventing numerical oscillations.
- **Mass Balance Audit:** Every run tracks initial volume, cumulative injected source volume, domain storage volume, and mass balance error percentage.
- **Contract Fulfillment:** Returns `StandardGridResult` containing 3D depth and velocity arrays `[timesteps, height, width]`, 2D arrival time array `[height, width]`, grid metadata, mass balance statistics, and summary execution metrics.

---

## 3. Level 2 Model Formulation (2D Shallow Water Equations — Planned)

Level 2 solves the full non-linear 2D Shallow Water Equations (Depth-Averaged Navier-Stokes equations under hydrostatic pressure assumption):

$$\frac{\partial \mathbf{U}}{\partial t} + \frac{\partial \mathbf{F}(\mathbf{U})}{\partial x} + \frac{\partial \mathbf{G}(\mathbf{U})}{\partial y} = \mathbf{S}(\mathbf{U})$$

### Vectors:
$$\mathbf{U} = \begin{bmatrix} h \\ q_x \\ q_y \end{bmatrix}, \quad
\mathbf{F} = \begin{bmatrix} q_x \\ \frac{q_x^2}{h} + \frac{1}{2}g h^2 \\ \frac{q_x q_y}{h} \end{bmatrix}, \quad
\mathbf{G} = \begin{bmatrix} q_y \\ \frac{q_x q_y}{h} \\ \frac{q_y^2}{h} + \frac{1}{2}g h^2 \end{bmatrix}, \quad
\mathbf{S} = \begin{bmatrix} 0 \\ -g h \frac{\partial z}{\partial x} - \tau_{bx}/\rho \\ -g h \frac{\partial z}{\partial y} - \tau_{by}/\rho \end{bmatrix}$$

Where $q_x = h u$, $q_y = h v$, $g = 9.81\,\text{m/s}^2$, and $\tau_{b}$ represents bed shear stress evaluated via Manning's formula.

#### CFL Stability Constraint:
$$\Delta t \le C \cdot \frac{\Delta x}{\sqrt{g h} + \sqrt{u^2 + v^2}}, \quad C \le 0.5$$

---

## 4. Level 3 Adapter Formulations

### 4.1 SPH Near-Field Breach Adapter
- **Domain:** Small near-breach domain ($100\,\text{m} \times 100\,\text{m}$), $N \approx 10^3\text{--}10^4$ Lagrangian particles.
- **Density & Pressure Evaluation:**
  $$\rho_i = \sum_j m_j W(\mathbf{r}_i - \mathbf{r}_j, h_{\text{kernel}})$$
  $$P_i = B \left[ \left( \frac{\rho_i}{\rho_0} \right)^\gamma - 1 \right] \quad (\text{Tait Equation of State}, \gamma = 7)$$
- **Role:** Visualizes near-field turbulent splashing and momentum jetting at the dam breach axis; feeds near-field velocity boundary estimates to Level 1/2 far-field solvers.

### 4.2 Delft3D NetCDF Adapter
- **Parser Interface:** Reads Delft3D structured grid map files (`trim-*.nc`).
- **Mapping Transformation:** Extracts 2D array variables `mesh2d_s1` (water level), `mesh2d_waterdepth` (depth), and `mesh2d_ucx`/`mesh2d_ucy` (velocities), interpolating them onto the standardized `StandardGridResult` grid mesh.

---

## 5. Breach Hydraulics & Input Parameters

| Parameter | Symbol | Units | Typical Empirical Range / Source |
|---|---|---|---|
| Initial Reservoir Water Level | $H_0$ | $\text{m}$ | Measured relative to dam base |
| Reservoir Storage Volume | $V_0$ | $\text{Mm}^3$ | Reservoir capacity curve |
| Final Breach Width | $B$ | $\text{m}$ | $B = k \cdot (V_0 \cdot H_0)^{0.25}$ (Froehlich empirical) |
| Breach Formation Time | $t_b$ | $\text{hr}$ | $0.1\text{--}1.0\,\text{hr}$ |
| Manning's Roughness | $n$ | $\text{s/m}^{1/3}$ | $0.030$ (Main channel) to $0.060$ (Floodplain/Vegetation) |

---

## 6. Verification & Quantitative Validation Plan

To satisfy SIH technical scrutiny, solver accuracy is validated quantitatively in `docs/VALIDATION.md`:

1. **Analytical Benchmark (Ritter Flat-Bed Dam-Break):** Compare Level 1/2 water depth profile against the closed-form analytical solution on a frictionless flat bed:
   $$h(x,t) = \frac{4}{9g} \left( \sqrt{g H_0} - \frac{x}{2t} \right)^2, \quad -t\sqrt{g H_0} \le x \le 2t\sqrt{g H_0}$$
2. **Global Mass Conservation Check:** Compute total water volume balance at each timestep:
   $$\text{Mass Error (\%)} = \frac{\left| V_{\text{initial}} + \int Q_{\text{in}} dt - \int Q_{\text{out}} dt - \sum h_{\text{cell}} \Delta x^2 \right|}{V_{\text{initial}} + \int Q_{\text{in}} dt} \times 100\%$$
   *Acceptance Criteria:* Mass error $<5\%$ for Level 1, $<1\%$ for Level 2.
3. **Arrival Time Monotonicity:** Verify arrival time increases monotonically downstream along the primary flow path.
