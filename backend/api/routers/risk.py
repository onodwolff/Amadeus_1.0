from fastapi import APIRouter, Depends
from backend.api.deps import require_token
from backend.core.risk import RISK_ENGINE, RiskLimits

router = APIRouter(prefix="/risk", tags=["risk"])

@router.get("/limits")
async def get_limits(_=Depends(require_token)):
    return RISK_ENGINE.get_limits().model_dump()

@router.post("/limits")
async def set_limits(data: dict, _=Depends(require_token)):
    return RISK_ENGINE.set_limits(data).model_dump()

@router.get("/state")
async def get_state(_=Depends(require_token)):
    return RISK_ENGINE.get_state().model_dump()
