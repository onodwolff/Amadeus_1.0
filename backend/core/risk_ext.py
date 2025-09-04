from dataclasses import dataclass
from typing import Dict, Any, Optional
from time import time

@dataclass
class Decision:
    allowed: bool
    reason: str = ""

class RiskEngineExt:
    def __init__(self):
        self.policies: Dict[str, Dict[str, Any]] = {}
        self.log: list[dict] = []

    def set_policy(self, sid: str, policy: Dict[str, Any]):
        # Defaults
        pol = {
            "max_active_orders": 100,
            "max_dd": 0.3,
            "max_leverage": 5.0,
            "max_notional_per_symbol": {},
            "max_pos_qty_per_symbol": {},
        }
        pol.update(policy or {})
        self.policies[sid] = pol

    def pre_trade(self, sid: str, *, open_orders: int, drawdown: float, symbol: str, notional: float, new_qty: float, current_qty: float, mark_price: float, account_equity: float, account_initial_margin: float) -> Decision:
        pol = self.policies.get(sid) or {}
        # Active orders
        if open_orders > pol.get("max_active_orders", 100):
            return self._block(sid, f"max_active_orders {open_orders}>{pol.get('max_active_orders')}")
        # Drawdown
        if drawdown > pol.get("max_dd", 0.3):
            return self._block(sid, f"max_dd {drawdown:.2%}")
        # Leverage
        lev = (account_initial_margin and account_equity) and (account_initial_margin / max(1e-9, account_equity)) or 0.0
        if lev > pol.get("max_leverage", 5.0):
            return self._block(sid, f"max_leverage {lev:.2f}>{pol.get('max_leverage')}")
        # Per-symbol notional
        limit_n = (pol.get("max_notional_per_symbol") or {}).get(symbol)
        if limit_n is not None and abs(notional) > float(limit_n):
            return self._block(sid, f"max_notional_per_symbol {abs(notional)}>{limit_n}")
        # Per-symbol pos qty
        limit_q = (pol.get("max_pos_qty_per_symbol") or {}).get(symbol)
        if limit_q is not None and abs(current_qty + new_qty) > float(limit_q):
            return self._block(sid, f"max_pos_qty_per_symbol {abs(current_qty+new_qty)}>{limit_q}")
        return self._allow(sid)

    def _block(self, sid: str, msg: str) -> Decision:
        self.log.append({"ts": int(time()*1000), "strategy_id": sid, "action":"BLOCK", "msg": msg})
        self.log = self.log[-1000:]
        return Decision(False, msg)

    def _allow(self, sid: str) -> Decision:
        self.log.append({"ts": int(time()*1000), "strategy_id": sid, "action":"ALLOW", "msg":"ok"})
        self.log = self.log[-1000:]
        return Decision(True, "")

RISKX = RiskEngineExt()
