from fastapi import APIRouter
from typing import Dict, Any
from backend.core.risk_ext import RISKX

router = APIRouter(prefix="/riskx", tags=["risk"])

@router.get("/policies/{sid}")
def get_pol(sid: str):
    return RISKX.policies.get(sid) or {}

@router.post("/policies/{sid}")
def set_pol(sid: str, body: Dict[str, Any]):
    RISKX.set_policy(sid, body or {})
    return {"ok": True, "policy": RISKX.policies[sid]}

@router.get("/log")
def log(limit: int = 200):
    return {"items": RISKX.log[-limit:]}
