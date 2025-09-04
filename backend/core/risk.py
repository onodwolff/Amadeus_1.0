from typing import Optional, Dict, Any
from dataclasses import dataclass
from time import time

@dataclass
class Decision:
    allowed: bool
    reason: str = ""

class RiskEngine:
    def __init__(self):
        self.policies: Dict[str, Dict[str, Any]] = {}  # strategy_id -> policy
        self.log: list[dict] = []

    def set_policy(self, strategy_id: str, *, max_active_orders: int = 50, max_dd: float = 0.2):
        self.policies[strategy_id] = {"max_active_orders": max_active_orders, "max_dd": max_dd}

    def pre_trade_check(self, *, strategy_id: str, open_orders_count: int, current_drawdown: float) -> Decision:
        pol = self.policies.get(strategy_id, {"max_active_orders": 50, "max_dd": 0.5})
        if open_orders_count > pol["max_active_orders"]:
            self._log(strategy_id, "BLOCK", f"Too many open orders: {open_orders_count}>{pol['max_active_orders']}")
            return Decision(False, "max_active_orders")
        if current_drawdown > pol["max_dd"]:
            self._log(strategy_id, "BLOCK", f"Drawdown {current_drawdown:.2%}>{pol['max_dd']:.2%}")
            return Decision(False, "max_dd")
        self._log(strategy_id, "ALLOW", "ok")
        return Decision(True, "")

    def _log(self, sid: str, action: str, msg: str):
        self.log.append({"ts": int(time()*1000), "strategy_id": sid, "action": action, "msg": msg})
        self.log = self.log[-1000:]

RISK_ENGINE = RiskEngine()
