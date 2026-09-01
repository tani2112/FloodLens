import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from backend.db import Base

class StudyAreaModel(Base):
    __tablename__ = "study_areas"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    bbox = Column(JSON, nullable=False)  # [min_lon, min_lat, max_lon, max_lat]
    river = Column(String, nullable=False)
    dam_or_blockage = Column(String, nullable=False)
    dem_dataset = Column(String, nullable=False)
    satellite_dataset = Column(String, nullable=True)
    created_at = Column(String, default=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())

    scenarios = relationship("ScenarioModel", back_populates="study_area", cascade="all, delete-orphan")

class ScenarioModel(Base):
    __tablename__ = "scenarios"

    id = Column(String, primary_key=True, index=True)
    study_area_id = Column(String, ForeignKey("study_areas.id"), nullable=False)
    type = Column(String, nullable=False)  # dam_break, natural_blockage, glof, water_release
    parameters = Column(JSON, nullable=False)
    created_at = Column(String, default=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())

    study_area = relationship("StudyAreaModel", back_populates="scenarios")
    simulations = relationship("SimulationModel", back_populates="scenario", cascade="all, delete-orphan")

class SimulationModel(Base):
    __tablename__ = "simulations"

    id = Column(String, primary_key=True, index=True)
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=False)
    model_level = Column(String, nullable=False)  # level1, level2, sph_adapter, delft3d_adapter
    status = Column(String, nullable=False, default="pending")  # pending, running, completed, failed, cancelled
    stage = Column(String, nullable=False, default="Initializing")
    stage_percent = Column(Float, nullable=False, default=0.0)
    data_source = Column(String, nullable=False, default="live")
    error_message = Column(Text, nullable=True)
    created_at = Column(String, default=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    completed_at = Column(String, nullable=True)

    scenario = relationship("ScenarioModel", back_populates="simulations")
    result = relationship("SimulationResultModel", back_populates="simulation", uselist=False, cascade="all, delete-orphan")
    artifacts = relationship("ResultArtifactModel", back_populates="simulation", cascade="all, delete-orphan")

class SimulationResultModel(Base):
    __tablename__ = "simulation_results"

    id = Column(String, primary_key=True, index=True)
    simulation_id = Column(String, ForeignKey("simulations.id"), nullable=False, unique=True)
    flood_area_km2 = Column(Float, nullable=False)
    max_depth_m = Column(Float, nullable=False)
    max_velocity_ms = Column(Float, nullable=False)
    arrival_time_min = Column(Float, nullable=False)
    duration_hr = Column(Float, nullable=False)
    population_exposed = Column(Integer, nullable=True)
    buildings_affected = Column(Integer, nullable=True)
    roads_affected_km = Column(Float, nullable=False)
    mass_balance_error_percent = Column(Float, nullable=True)
    execution_time_seconds = Column(Float, nullable=True)
    data_source = Column(String, nullable=False, default="live")
    created_at = Column(String, default=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())

    simulation = relationship("SimulationModel", back_populates="result")

class ResultArtifactModel(Base):
    __tablename__ = "result_artifacts"

    id = Column(String, primary_key=True, index=True)
    simulation_id = Column(String, ForeignKey("simulations.id"), nullable=False)
    artifact_type = Column(String, nullable=False)  # extent_geojson, layers_json, exposure_json, metadata_json
    relative_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    content_type = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())

    simulation = relationship("SimulationModel", back_populates="artifacts")
