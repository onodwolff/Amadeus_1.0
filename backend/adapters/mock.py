import asyncio, time, random
from typing import Callable, Awaitable, List, Dict, Optional
from backend.core.contracts import (
    ExchangeAdapter, OrderBookMsg, TradeMsg, Candle, PlaceOrder, OrderAck,
    CancelAck, Order, Position, Balance, SymbolInfo, Unsub
)

class MockAdapter(ExchangeAdapter):
    id = "mock"
    capabilities = {"spot": True, "futures": False, "margin": False, "l2": True, "l3": False, "userDataWS": False}

    def __init__(self):
        self._orders: Dict[str, Order] = {}
        self._running: Dict[str, bool] = {}

    def normalize_symbol(self, user_input: str) -> str:
        return user_input.replace("-", "").upper()

    async def get_symbol_info(self, symbol: str) -> SymbolInfo:
        return SymbolInfo(symbol=symbol, tick_size=0.01, step_size=0.00001, base=symbol[:-4] or "BTC")

    async def subscribe_book(self, symbol: str, depth, cb: Callable[[OrderBookMsg], Awaitable[None]]) -> Unsub:
        key = f"book:{symbol}"
        self._running[key] = True

        async def loop():
            mid = 60000.0
            while self._running.get(key):
                spread = random.uniform(0.5, 2.0)
                best_bid = mid - spread/2
                best_ask = mid + spread/2
                def ladder(start, inc, n=10):
                    return [{"price": round(start + i*inc, 2), "size": round(random.uniform(0.01, 0.5), 5)} for i in range(n)]
                msg = OrderBookMsg(
                    ts=int(time.time()*1000),
                    symbol=symbol,
                    bids=[*map(lambda d: d, ladder(best_bid, -0.5))],
                    asks=[*map(lambda d: d, ladder(best_ask, +0.5))],
                    snapshot=False
                )
                await cb(msg)
                await asyncio.sleep(0.1)
        task = asyncio.create_task(loop())
        def _unsub():
            self._running[key] = False
            task.cancel()
        return _unsub

    async def subscribe_trades(self, symbol: str, cb: Callable[[TradeMsg], Awaitable[None]]) -> Unsub:
        key = f"trades:{symbol}"
        self._running[key] = True
        async def loop():
            while self._running.get(key):
                t = TradeMsg(
                    ts=int(time.time()*1000),
                    symbol=symbol,
                    price=round(60000 + random.uniform(-50, 50), 2),
                    size=round(random.uniform(0.001, 0.2), 5),
                    side=random.choice(["buy","sell"])
                )
                await cb(t)
                await asyncio.sleep(0.15)
        task = asyncio.create_task(loop())
        def _unsub():
            self._running[key] = False
            task.cancel()
        return _unsub

    async def get_ohlcv(self, symbol: str, tf: str, since: Optional[int]=None, limit: Optional[int]=None) -> List[Candle]:
        now = int(time.time()//60 * 60) * 1000
        out: List[Candle] = []
        for i in range(0, (limit or 200)):
            o = 60000 + random.uniform(-100, 100)
            h = o + random.uniform(0, 50)
            l = o - random.uniform(0, 50)
            c = random.choice([h,l,o])
            v = random.uniform(1, 200)
            out.append(Candle(ts=now - i*60000, o=o, h=h, l=l, c=c, v=v, tf="1m", symbol=symbol))
        return list(reversed(out))

    async def place_order(self, req: PlaceOrder) -> OrderAck:
        oid = req.client_order_id or f"mock-{int(time.time()*1000)}"
        if oid in self._orders:
            return OrderAck(order_id=oid, client_order_id=req.client_order_id, status="accepted")
        self._orders[oid] = Order(order_id=oid, symbol=req.symbol, side=req.side, qty=req.qty, price=req.price, status="filled")
        return OrderAck(order_id=oid, client_order_id=req.client_order_id, status="accepted")

    async def cancel_order(self, id_or_client_id: str) -> CancelAck:
        if id_or_client_id in self._orders:
            self._orders[id_or_client_id].status = "canceled"
            return CancelAck(order_id=id_or_client_id, status="canceled")
        return CancelAck(order_id=id_or_client_id, status="not_found")

    async def get_open_orders(self, symbol: Optional[str]=None) -> List[Order]:
        return [o for o in self._orders.values() if o.status in ("new","partially_filled") and (symbol is None or o.symbol==symbol)]

    async def get_positions(self) -> List[Position]:
        return []

    async def get_balances(self) -> List[Balance]:
        return [Balance(asset="USDT", free=10000.0)]
