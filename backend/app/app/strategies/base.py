from __future__ import annotations
from typing import Protocol, Any


class StrategyContext(Protocol):
    md: Any
    trader: Any
    risk: Any
    storage: Any
    logger: Any
    mode: str

    def now(self) -> float: ...


class StrategyPlugin(Protocol):
    id: str
    schema: dict

    async def init(self, ctx: StrategyContext, config: dict) -> None: ...
    async def on_start(self) -> None: ...
    async def on_stop(self) -> None: ...
    async def on_tick(self) -> None: ...
    async def on_book(self, msg: dict) -> None: ...
    async def on_trade(self, msg: dict) -> None: ...
