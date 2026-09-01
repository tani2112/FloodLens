"""
FloodLens Simulation Engine Interface & StandardGridResult Contract
Authoritative Contract matching docs/ARCHITECTURE.md and docs/SCIENTIFIC_MODEL.md
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import numpy as np

@dataclass
class GridMetadata:
    crs: str = "EPSG:32643"
    transform: List[float] = field(default_factory=lambda: [30.0, 0.0, 697000.0, 0.0, -30.0, 1127000.0])
    width: int = 1100
    height: int = 1300
    cell_size: float = 30.0
    origin_x: float = 697000.0
    origin_y: float = 1127000.0
    timesteps: List[float] = field(default_factory=lambda: [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 45.0, 60.0])
    nodata_value: float = -9999.0

@dataclass
class StandardGridResult:
    simulation_id: str
    grid_meta: GridMetadata
    
    # 3D NumPy Arrays [timestep, height, width]
    depth_array: Optional[np.ndarray] = None
    velocity_array: Optional[np.ndarray] = None
    
    # 2D NumPy Array [height, width]
    arrival_time_array: Optional[np.ndarray] = None
    
    solver_name: str = "AbstractEngine"
    solver_level: str = "level1"
    execution_time_seconds: float = 0.0
    
    # Optional Backward-Compatible Statistics & Diagnostics Metadata
    summary_stats: Optional[Dict[str, Any]] = field(default_factory=dict)
    mass_balance_info: Optional[Dict[str, Any]] = field(default_factory=dict)

class BaseSimulationEngine(ABC):
    """Abstract Base Class for all FloodLens Solvers and Adapters."""
    
    @abstractmethod
    def run(self, scenario_config: Dict[str, Any], dem_raster_path: str) -> StandardGridResult:
        """Execute simulation scenario and return a StandardGridResult."""
        pass

@dataclass
class HydrodynamicEngineConfig:
    aoi_id: str = "idukki-canonical"
    scenario_type: str = "dam_break"
    initial_head_m: float = 50.0
    storage_volume_mm3: float = 10.0
    breach_width_m: float = 100.0
    breach_formation_time_min: float = 30.0
    simulation_duration_hr: float = 1.0
    manning_n: float = 0.035
    simulation_id: Optional[str] = None

class HydrodynamicSimulationEngine:
    def __init__(self, config: HydrodynamicEngineConfig):
        self.config = config

    def run_simulation(self) -> StandardGridResult:
        from simulation.level1_diffusive import Level1DiffusiveModel
        model = Level1DiffusiveModel()
        scenario_config = {
            "simulation_id": self.config.simulation_id or "sim-level1-default",
            "initial_water_level_m": self.config.initial_head_m,
            "reservoir_volume_m3": self.config.storage_volume_mm3 * 1e6,
            "breach_formation_time_s": self.config.breach_formation_time_min * 60.0,
            "simulation_duration_min": self.config.simulation_duration_hr * 60.0,
            "roughness_coefficient": self.config.manning_n
        }
        return model.run(scenario_config=scenario_config, dem_raster_path="data/processed/dem.tif")
