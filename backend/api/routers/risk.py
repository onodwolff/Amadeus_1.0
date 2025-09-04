from fastapi import APIRouter, Depends
from backend.core.risk import RISK_ENGINE
from typing import Optional, Dict, Any

router = APIRouter(prefix="/risk", tags=["risk"])

@router.get("/policies/{sid}")
def get_policy(sid: str):
    return RISK_ENGINE.policies.get(sid) or {"max_active_orders": 50, "max_dd": 0.5}

@router.post("/policies/{sid}")
def set_policy(sid: str, body: Dict[str, Any]):
    RISK_ENGINE.set_policy(sid, max_active_orders=int(body.get("max_active_orders",50)), max_dd=float(body.get("max_dd",0.5)))
    return {"ok": True, "policy": RISK_ENGINE.policies[sid]}

@router.get("/log")
def risk_log(limit: int = 200):
    return {"items": RISK_ENGINE.log[-limit:]}
