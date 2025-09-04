import asyncio
import json
import time
from typing import Callable, Awaitable, List, Optional, Dict
import httpx
import websockets
from backend.core.contracts import (
    ExchangeAdapter, OrderBookMsg, TradeMsg, Candle, PlaceOrder, OrderAck,
    CancelAck, Order, Position, Balance, SymbolInfo, Unsub
)

# Bybit v5 endpoints
WS_BASE = {
    "spot": "wss://stream.bybit.com/v5/public/spot",
    "linear": "wss://stream.bybit.com/v5/public/linear",
}
REST_BASE = "https://api.bybit.com"

class BybitAdapter(ExchangeAdapter):
    id = "bybit"
    capabilities = {"spot": True, "futures": True, "margin": False, "l2": True, "l3": False, "userDataWS": False}

    def __init__(self, category: str = "spot"):
        assert category in ("spot","linear"), "category must be 'spot' or 'linear'"
        self.category = category
        self._orders: Dict[str, Order] = {}

    def normalize_symbol(self, user_input: str) -> str:
        return user_input.replace("-", "").upper()

    async def get_symbol_info(self, symbol: str) -> SymbolInfo:
        # Minimal spec; for real use, fetch /v5/market/instruments-info
        return SymbolInfo(symbol=symbol, tick_size=0.01, step_size=0.0001, base=symbol[:-4] or "BTC")

    async def subscribe_book(self, symbol: str, depth, cb: Callable[[OrderBookMsg], Awaitable[None]]) -> Unsub:
        url = WS_BASE[self.category]
        topic = f"orderbook.50.{symbol}"
        running = True

        async def _run():
            nonlocal running
            async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
                sub = {"op":"subscribe","args":[topic]}
                await ws.send(json.dumps(sub))
                while running:
                    msg = json.loads(await ws.recv())
                    # Expect data like { "topic":"orderbook.50.BTCUSDT", "type":"snapshot"/"delta", "data":{ "b":[[price, size],...], "a":[[price,size],...], "ts": ... } }
                    data = msg.get("data") or {}
                    bids = [{"price": float(p), "size": float(s)} for p,s in data.get("b", [])]
                    asks = [{"price": float(p), "size": float(s)} for p,s in data.get("a", [])]
                    ob = OrderBookMsg(
                        ts = int(data.get("ts") or time.time()*1000),
                        symbol=symbol, bids=bids, asks=asks,
                        snapshot = (msg.get("type") == "snapshot")
                    )
                    await cb(ob)

        task = asyncio.create_task(_run())

        def _unsub():
            nonlocal running
            running = False
            task.cancel()

        return _unsub

    async def subscribe_trades(self, symbol: str, cb: Callable[[TradeMsg], Awaitable[None]]) -> Unsub:
        url = WS_BASE[self.category]
        topic = f"publicTrade.{symbol}"
        running = True

        async def _run():
            nonlocal running
            async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
                sub = {"op":"subscribe","args":[topic]}
                await ws.send(json.dumps(sub))
                while running:
                    msg = json.loads(await ws.recv())
                    data = msg.get("data") or []
                    for t in data:
                        trade = TradeMsg(
                            ts = int(t.get("T") or time.time()*1000),
                            symbol = symbol,
                            price = float(t["p"]),
                            size = float(t["v"]),
                            side = "buy" if t.get("S","Buy").lower().startswith("b") else "sell"
                        )
                        await cb(trade)

        task = asyncio.create_task(_run())

        def _unsub():
            nonlocal running
            running = False
            task.cancel()

        return _unsub

    async def get_ohlcv(self, symbol: str, tf: str, since: Optional[int]=None, limit: Optional[int]=None) -> List[Candle]:
        # Map tf to Bybit interval
        tf_map = {"1m":"1", "3m":"3", "5m":"5", "15m":"15", "30m":"30", "1h":"60", "4h":"240", "1d":"D"}
        interval = tf_map.get(tf, "1")
        params = {"category": self.category, "symbol": symbol, "interval": interval, "limit": str(limit or 200)}
        async with httpx.AsyncClient(base_url=REST_BASE, timeout=20.0) as client:
            r = await client.get("/v5/market/kline", params=params)
            r.raise_for_status()
            payload = r.json()
            rows = payload.get("result", {}).get("list", []) or payload.get("result", {}).get("klineList", []) or []
            out: List[Candle] = []
            for row in rows:
                # Bybit returns [startTs, open, high, low, close, volume, ...]
                ts = int(row[0])
                o,h,l,c,v = map(float, row[1:6])
                out.append(Candle(ts=ts, o=o,h=h,l=l,c=c,v=v, tf=tf, symbol=symbol))
            out.sort(key=lambda x: x.ts)
            return out

    # Trading (Dry-Run for now)
    async def place_order(self, req: PlaceOrder) -> OrderAck:
        oid = req.client_order_id or f"bybit-{int(time.time()*1000)}"
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
