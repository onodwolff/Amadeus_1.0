from __future__ import annotations
from typing import Dict, Any, Optional
from pydantic import BaseModel

class RiskLimits(BaseModel):
    max_active_orders: int = 10
    max_position_qty: float = 1.0  # per symbol absolute qty
    forbid_market_orders: bool = False

class RiskDecision(BaseModel):
    allowed: bool
    reason: Optional[str] = None

class RiskState(BaseModel):
    active_orders: int = 0
    last_reason: Optional[str] = None

class RiskEngine:
    def __init__(self):
        self._limits = RiskLimits()
        self._state = RiskState()

    def get_limits(self) -> RiskLimits:
        return self._limits

    def set_limits(self, data: Dict[str, Any]) -> RiskLimits:
        self._limits = RiskLimits(**{**self._limits.model_dump(), **data})
        return self._limits

    def get_state(self) -> RiskState:
        return self._state

    def pre_trade_check(self, *, req, open_orders_count: int, current_pos_qty: float) -> RiskDecision:
        # forbid market orders
        if self._limits.forbid_market_orders and getattr(req, "type", "market") == "market":
            self._state.last_reason = "market orders are forbidden"
            return RiskDecision(allowed=False, reason=self._state.last_reason)
        # active orders limit
        if open_orders_count >= self._limits.max_active_orders:
            self._state.last_reason = f"active orders limit reached: {open_orders_count} >= {self._limits.max_active_orders}"
            return RiskDecision(allowed=False, reason=self._state.last_reason)
        # position size limit (post-trade)
        new_qty = abs(current_pos_qty + (getattr(req, "qty", 0.0) * (1 if getattr(req, "side","buy")=="buy" else -1)))
        if new_qty > self._limits.max_position_qty:
            self._state.last_reason = f"position limit: |{new_qty}| > {self._limits.max_position_qty}"
            return RiskDecision(allowed=False, reason=self._state.last_reason)
        # passed
        self._state.last_reason = None
        return RiskDecision(allowed=True)
RISK_ENGINE = RiskEngine()
