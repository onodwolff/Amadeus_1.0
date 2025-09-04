from __future__ import annotations
from typing import List, Dict, Any

from ..strategies.base import StrategyPlugin, StrategyContext


class BacktestEngine:
    def __init__(self, strategy: StrategyPlugin, data: List[Dict[str, Any]], ctx: StrategyContext) -> None:
        self.strategy = strategy
        self.data = data
        self.ctx = ctx

    async def run(self) -> None:
        await self.strategy.init(self.ctx, {})
        await self.strategy.on_start()
        for _bar in self.data:
            await self.strategy.on_tick()
        await self.strategy.on_stop()
