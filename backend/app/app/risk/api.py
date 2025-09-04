from __future__ import annotations
from typing import Optional, Tuple

from ...services.risk.manager import RiskManager


class RiskAPI:
    def __init__(self, manager: RiskManager) -> None:
        self.manager = manager

    def can_enter(self, pair: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        return self.manager.can_enter(pair)
