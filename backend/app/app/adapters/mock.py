from __future__ import annotations
import asyncio
from typing import Callable, Optional, Dict, Any


class MockAdapter:
    id = "mock"
    capabilities: Dict[str, bool] = {}

    def __init__(self) -> None:
        self.orders: Dict[str, dict] = {}
        self._oid = 0

    async def subscribe_book(self, symbol: str, depth: str, cb: Callable[[dict], None]) -> Callable[[], None]:
        async def _noop():
            while True:
                await asyncio.sleep(3600)
        task = asyncio.create_task(_noop())
        return task.cancel

    async def subscribe_trades(self, symbol: str, cb: Callable[[dict], None]) -> Callable[[], None]:
        async def _noop():
            while True:
                await asyncio.sleep(3600)
        task = asyncio.create_task(_noop())
        return task.cancel

    async def get_ohlcv(self, symbol: str, tf: str, since: Optional[int] = None, limit: int = 500) -> list[dict]:
        return []

    async def place_order(self, req: dict) -> dict:
        self._oid += 1
        oid = str(self._oid)
        order = {"id": oid, **req, "status": "filled"}
        self.orders[oid] = order
        return order

    async def cancel_order(self, id_or_client_id: str) -> dict:
        order = self.orders.pop(id_or_client_id, None)
        return {"id": id_or_client_id, "status": "canceled" if order else "not_found"}

    async def get_open_orders(self, symbol: Optional[str] = None) -> list[dict]:
        return list(self.orders.values())

    async def get_positions(self) -> list[dict]:
        return []

    async def get_balances(self) -> list[dict]:
        return []

    async def get_symbol_info(self, symbol: str) -> dict:
        return {"symbol": symbol}

    def normalize_symbol(self, user_input: str) -> str:
        return user_input.replace("/", "").upper()
