import asyncio, random, time
from typing import Dict, Any, Callable, Awaitable
from .base import ExchangeAdapter, Unsub

class MockAdapter(ExchangeAdapter):
    id = "mock"
    capabilities = {"spot": True, "futures": False, "l2": True, "userDataWS": False}

    def __init__(self) -> None:
        self._tasks = []
        self._subs = {}

    def normalize_symbol(self, s: str) -> str:
        return s.replace("/", "").upper()

    async def subscribe_book(self, symbol: str, depth: str, cb: Callable[[Dict[str, Any]], Any]) -> Unsub:
        stopped = False
        async def loop():
            mid = 50000.0
            while not stopped:
                mid += random.uniform(-5, 5)
                bids = [[round(mid - i*1.0, 2), round(random.uniform(0.1, 1.0), 4)] for i in range(1, 11)]
                asks = [[round(mid + i*1.0, 2), round(random.uniform(0.1, 1.0), 4)] for i in range(1, 11)]
                await asyncio.sleep(0.2)
                await cb({"type": "book", "symbol": symbol, "bids": bids, "asks": asks, "ts": time.time()})
        t = asyncio.create_task(loop())
        self._tasks.append(t)
        async def unsub():
            nonlocal stopped
            stopped = True
            t.cancel()
        return unsub

    async def subscribe_trades(self, symbol: str, cb: Callable[[Dict[str, Any]], Any]) -> Unsub:
        stopped = False
        async def loop():
            while not stopped:
                price = round(50000 + random.uniform(-10, 10), 2)
                qty = round(random.uniform(0.01, 0.3), 4)
                side = random.choice(["buy", "sell"])
                await cb({"type": "trade", "symbol": symbol, "price": price, "qty": qty, "side": side, "ts": time.time()})
                await asyncio.sleep(0.3)
        t = asyncio.create_task(loop())
        self._tasks.append(t)
        async def unsub():
            nonlocal stopped
            stopped = True
            t.cancel()
        return unsub

    async def get_ohlcv(self, symbol: str, tf: str, since=None, limit: int=200):
        # generate synthetic candles
        now = int(time.time() // 60 * 60)
        ohlcv = []
        price = 50000.0
        for i in range(limit):
            ts = now - (limit-i)*60
            o = price
            h = o + random.uniform(0, 10)
            l = o - random.uniform(0, 10)
            c = l + (h-l) * random.random()
            v = random.uniform(1, 20)
            ohlcv.append({"t": ts, "o": round(o,2), "h": round(h,2), "l": round(l,2), "c": round(c,2), "v": round(v,4)})
            price = c
        return ohlcv

    async def place_order(self, req: dict) -> dict:
        # Paper/live handled by OMS; here return simple ack for mock
        return {"id": f"mock-{int(time.time()*1000)}", "status": "ACK"}

    async def cancel_order(self, id_or_client_id: str) -> dict:
        return {"id": id_or_client_id, "status": "CANCELED"}

    async def get_open_orders(self, symbol=None): return []
    async def get_positions(self): return []
    async def get_balances(self): return [{"asset":"USDT","free":10000,"locked":0}]
    async def get_symbol_info(self, symbol: str): return {"symbol": symbol, "step": 0.01, "lot": 0.001}
