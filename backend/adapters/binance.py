import asyncio, json, time
from typing import Callable, Awaitable, List, Optional, Dict
import httpx, websockets
from backend.core.contracts import (
    ExchangeAdapter, OrderBookMsg, TradeMsg, Candle, PlaceOrder, OrderAck,
    CancelAck, Order, Position, Balance, SymbolInfo, Unsub
)

WS_SPOT = "wss://stream.binance.com:9443/ws"
WS_FUT = "wss://fstream.binance.com/ws"
REST_SPOT = "https://api.binance.com"
REST_FUT = "https://fapi.binance.com"

class BinanceAdapter(ExchangeAdapter):
    id = "binance"
    capabilities = {"spot": True, "futures": True, "margin": False, "l2": True, "l3": False, "userDataWS": False}

    def __init__(self, category: str = "spot"):
        assert category in ("spot","usdt"), "category must be 'spot' or 'usdt' (USDT-margined futures)"
        self.category = category
        self._orders: Dict[str, Order] = {}

    def normalize_symbol(self, user_input: str) -> str:
        return user_input.replace("-", "").upper()

    async def get_symbol_info(self, symbol: str) -> SymbolInfo:
        return SymbolInfo(symbol=symbol, tick_size=0.01, step_size=0.0001, base=symbol[:-4] or "BTC")

    def _ws_url(self):
        return WS_SPOT if self.category == "spot" else WS_FUT

    async def subscribe_book(self, symbol: str, depth, cb: Callable[[OrderBookMsg], Awaitable[None]]) -> Unsub:
        stream = f"{symbol.lower()}@depth20@100ms"
        url = f"{self._ws_url()}/{stream}"
        running = True
        async def _run():
            nonlocal running
            async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
                while running:
                    msg = json.loads(await ws.recv())
                    bids = [{"price": float(p), "size": float(q)} for p,q,_ in msg.get("b", [])] if "b" in msg else [{"price": float(p), "size": float(q)} for p,q in msg.get("bids", [])]
                    asks = [{"price": float(p), "size": float(q)} for p,q,_ in msg.get("a", [])] if "a" in msg else [{"price": float(p), "size": float(q)} for p,q in msg.get("asks", [])]
                    ob = OrderBookMsg(ts=int(msg.get("E", time.time()*1000)), symbol=symbol, bids=bids, asks=asks, snapshot=False)
                    await cb(ob)
        task = asyncio.create_task(_run())
        def _unsub():
            nonlocal running
            running = False
            task.cancel()
        return _unsub

    async def subscribe_trades(self, symbol: str, cb: Callable[[TradeMsg], Awaitable[None]]) -> Unsub:
        stream = f"{symbol.lower()}@trade"
        url = f"{self._ws_url()}/{stream}"
        running = True
        async def _run():
            nonlocal running
            async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
                while running:
                    msg = json.loads(await ws.recv())
                    trade = TradeMsg(
                        ts=int(msg.get("E", time.time()*1000)),
                        symbol=symbol, price=float(msg["p"]), size=float(msg["q"]),
                        side="buy" if msg.get("m") is False else "sell"  # market maker flag
                    )
                    await cb(trade)
        task = asyncio.create_task(_run())
        def _unsub():
            nonlocal running
            running = False
            task.cancel()
        return _unsub

    async def get_ohlcv(self, symbol: str, tf: str, since: Optional[int]=None, limit: Optional[int]=None) -> List[Candle]:
        tf_map = {"1m":"1m","3m":"3m","5m":"5m","15m":"15m","30m":"30m","1h":"1h","4h":"4h","1d":"1d"}
        interval = tf_map.get(tf, "1m")
        base = REST_SPOT if self.category == "spot" else REST_FUT
        path = "/api/v3/klines" if self.category == "spot" else "/fapi/v1/klines"
        params = {"symbol": symbol, "interval": interval, "limit": limit or 200}
        async with httpx.AsyncClient(base_url=base, timeout=20.0) as client:
            r = await client.get(path, params=params)
            r.raise_for_status()
            rows = r.json()
            out: List[Candle] = []
            for row in rows:
                ts = int(row[0])
                o,h,l,c,v = float(row[1]), float(row[2]), float(row[3]), float(row[4]), float(row[5])
                out.append(Candle(ts=ts, o=o,h=h,l=l,c=c,v=v, tf=tf, symbol=symbol))
            return out

    async def place_order(self, req: PlaceOrder) -> OrderAck:
        oid = req.client_order_id or f"binance-{int(time.time()*1000)}"
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
