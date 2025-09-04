from __future__ import annotations
from typing import Any

from .base import StrategyContext, StrategyPlugin


class SampleEMAStrategy:
    id = "sample_ema"
    schema: dict = {}

    def __init__(self) -> None:
        self.ctx: StrategyContext | None = None
        self.config: dict = {}
        self.window = 10
        self.prices: list[float] = []

    async def init(self, ctx: StrategyContext, config: dict) -> None:
        self.ctx = ctx
        self.config = config
        self.window = int(config.get("window", self.window))

    async def on_start(self) -> None:
        pass

    async def on_stop(self) -> None:
        pass

    async def on_tick(self) -> None:
        pass

    async def on_book(self, msg: dict) -> None:
        pass

    async def on_trade(self, msg: dict) -> None:
        price = float(msg.get("price", 0))
        self.prices.append(price)
        if len(self.prices) >= self.window and self.ctx:
            ema = sum(self.prices[-self.window:]) / self.window
            self.ctx.logger.info("EMA %s", ema)
