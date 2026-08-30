from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.schemas import ScenarioSchema, ScenarioCreateSchema
from backend.services.scenario_service import list_scenarios, create_scenario
from backend.db import get_db

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

@router.get("", response_model=List[ScenarioSchema])
def list_scenarios_endpoint(db: Session = Depends(get_db)):
    """Lists registered simulation scenarios."""
    return list_scenarios(db=db)

@router.post("", response_model=ScenarioSchema, status_code=201)
def create_scenario_endpoint(payload: ScenarioCreateSchema, db: Session = Depends(get_db)):
    """Registers new dam failure or flood scenario."""
    return create_scenario(payload, db=db)
