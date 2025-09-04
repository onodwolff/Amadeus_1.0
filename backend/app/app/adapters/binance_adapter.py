from __future__ import annotations
import asyncio
from typing import Callable, Optional, Dict, Any

from ...services.binance_client import SimpleBinanceSocketManager, BinanceRestClient


class BinanceAdapter:
    id = "binance"
    capabilities: Dict[str, bool] = {"ws": True, "rest": True}

    def __init__(self, rest: BinanceRestClient, ws: SimpleBinanceSocketManager) -> None:
        self.rest = rest
        self.ws = ws
        self._tasks: set[asyncio.Task] = set()

    async def subscribe_book(self, symbol: str, depth: str, cb: Callable[[dict], None]) -> Callable[[], None]:
        ctx = self.ws.depth_socket(symbol, int(depth) if depth else None)

        async def _runner() -> None:
            async with ctx as stream:
                while True:
                    msg = await stream.recv()
                    cb(msg)

        task = asyncio.create_task(_runner())
        self._tasks.add(task)

        def _cancel() -> None:
            task.cancel()

        return _cancel

    async def subscribe_trades(self, symbol: str, cb: Callable[[dict], None]) -> Callable[[], None]:
        ctx = self.ws.trade_socket(symbol)

        async def _runner() -> None:
            async with ctx as stream:
                while True:
                    msg = await stream.recv()
                    cb(msg)

        task = asyncio.create_task(_runner())
        self._tasks.add(task)

        def _cancel() -> None:
            task.cancel()

        return _cancel

    async def get_ohlcv(self, symbol: str, tf: str, since: Optional[int] = None, limit: int = 500) -> list[dict]:
        klines = await self.rest.get_klines(symbol, tf, limit)
        res = []
        for k in klines:
            res.append(
                {
                    "open_time": k[0],
                    "open": k[1],
                    "high": k[2],
                    "low": k[3],
                    "close": k[4],
                    "volume": k[5],
                }
            )
        return res

    async def place_order(self, req: dict) -> dict:
        raise NotImplementedError

    async def cancel_order(self, id_or_client_id: str) -> dict:
        raise NotImplementedError

    async def get_open_orders(self, symbol: Optional[str] = None) -> list[dict]:
        return []

    async def get_positions(self) -> list[dict]:
        return []

    async def get_balances(self) -> list[dict]:
        return []

    async def get_symbol_info(self, symbol: str) -> dict:
        return await self.rest.get_symbol_info(symbol)

    def normalize_symbol(self, user_input: str) -> str:
        return user_input.replace("/", "").upper()
