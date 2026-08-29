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
