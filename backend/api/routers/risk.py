"""HTTP endpoints exposing basic risk controls for the UI."""

from fastapi import APIRouter
from typing import Dict, Any

from backend.core.risk import RISK_ENGINE

router = APIRouter(prefix="/risk", tags=["risk"])

# Seed a default risk policy to avoid empty responses for the UI
if not RISK_ENGINE.policies:
    RISK_ENGINE.set_policy("default", max_active_orders=50, max_dd=0.5)

# ---------------------------------------------------------------------------
# Simple policy management used by tests
# ---------------------------------------------------------------------------

@router.get("/policies")
def list_policies():
    return list(RISK_ENGINE.policies.keys())

@router.get("/policies/{sid}")
def get_policy(sid: str):
    return RISK_ENGINE.policies.get(sid) or {"max_active_orders": 50, "max_dd": 0.5}

@router.post("/policies/{sid}")
def set_policy(sid: str, body: Dict[str, Any]):
    RISK_ENGINE.set_policy(
        sid,
        max_active_orders=int(body.get("max_active_orders", 50)),
        max_dd=float(body.get("max_dd", 0.5)),
    )
    return {"ok": True, "policy": RISK_ENGINE.policies[sid]}

@router.get("/log")
def risk_log(limit: int = 200):
    return {"items": RISK_ENGINE.log[-limit:]}


# ---------------------------------------------------------------------------
# Demo risk management endpoints for the UI
# ---------------------------------------------------------------------------

# In-memory limits and lock state.  These are intentionally simple and are
# sufficient for the current UI which expects best-effort responses only.
_RISK_LIMITS: Dict[str, float] = {
    "max_drawdown_pct": 10.0,
    "dd_window_sec": 24 * 3600,
    "stop_duration_sec": 12 * 3600,
    "cooldown_sec": 30 * 60,
    "min_trades_for_dd": 0.0,
    "max_base_ratio": 0.0,
    "max_loss_pct": 0.0,
    "max_loss_usd": 0.0,
}

_RISK_STATE: Dict[str, Any] = {"blocked": False, "reason": ""}


@router.get("/status")
def risk_status() -> Dict[str, Any]:
    """Return basic risk status information."""
    return {
        "enabled": True,
        "allowed": not _RISK_STATE["blocked"],
        "reason": _RISK_STATE["reason"],
        "dd_current_pct": 0.0,
        "dd_max_window_pct": 0.0,
        "threshold_pct": _RISK_LIMITS["max_drawdown_pct"],
        "window_points": 0,
        "window_sec": _RISK_LIMITS["dd_window_sec"],
        "stop_until": None,
        "cooldown_until": None,
    }


@router.post("/unlock")
def risk_unlock() -> Dict[str, bool]:
    """Clear all temporary risk locks."""
    _RISK_STATE["blocked"] = False
    _RISK_STATE["reason"] = ""
    return {"ok": True}


@router.get("/limits")
def get_limits() -> Dict[str, float]:
    """Return current risk limit configuration."""
    return _RISK_LIMITS


@router.post("/limits")
def set_limits(body: Dict[str, Any]) -> Dict[str, Any]:
    """Update risk limits with provided values."""
    for key in _RISK_LIMITS:
        if key in body:
            val = body[key]
            _RISK_LIMITS[key] = float(val)
    return {"ok": True, **_RISK_LIMITS}
