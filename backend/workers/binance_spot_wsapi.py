import asyncio, json, time, hmac, hashlib
from typing import Optional
import websockets
from sqlmodel import Session
from backend.core.db import engine
from backend.core.keys import get_keys
from backend.core.events import publish_fill
from backend.core.models import FillRow
from backend.core.pnl import apply_fill
from backend.workers._util_strategy_map import find_strategy_by_order_id

WS_API = "wss://ws-api.binance.com/ws-api/v3"

def _sign(secret: str, payload: str) -> str:
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

class BinanceSpotWsApiUserData:
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._running = False

    async def _ws_loop(self):
        with Session(engine) as db:
            creds = get_keys(db, "binance", "spot")
            if not creds:
                return
            key, secret = creds
        async with websockets.connect(WS_API, ping_interval=20, ping_timeout=20) as ws:
            rid = 1
            ts = int(time.time()*1000)
            payload = f"timestamp={ts}"
            sig = _sign(secret, payload)
            req = {"id": rid, "method":"userDataStream.subscribe.signature", "params":{"apiKey": key, "timestamp": ts, "signature": sig}}
            await ws.send(json.dumps(req))
            ack = json.loads(await ws.recv())
            if not ack or (ack.get("status") not in (200, "200", "OK") and not ack.get("result")):
                raise RuntimeError("wsapi subscribe failed")
            while self._running:
                msg = json.loads(await ws.recv())
                e = msg.get("e") or msg.get("eventType") or ""
                if e in ("executionReport","ORDER_TRADE_UPDATE"):
                    data = msg.get("o", msg)
                    side = "buy" if (data.get("S")=="BUY" or data.get("side")=="BUY") else "sell"
                    symbol = data.get("s") or data.get("symbol")
                    price = float(data.get("L") or data.get("lastExecutedPrice") or 0)
                    qty = float(data.get("l") or data.get("lastExecutedQuantity") or 0)
                    ts = int(msg.get("E", msg.get("eventTime", time.time()*1000)))
                    oid = str(data.get("i") or data.get("orderId") or "")
                    if qty>0 and price>0 and symbol:
                        with Session(engine) as db:
                            sid = find_strategy_by_order_id(db, oid)
                            fr = FillRow(order_id=oid, symbol=symbol, price=price, qty=qty, side=side, exchange="binance", category="spot", ts=ts, meta=msg, strategy_id=sid)
                            db.add(fr); db.commit(); apply_fill(db, fr); db.commit()
                        await publish_fill({"order_id": oid, "symbol": symbol, "price": price, "qty": qty, "side": side, "exchange": "binance", "category": "spot", "ts": ts, "strategy_id": sid})

    async def start(self):
        if self._task and not self._task.done():
            return
        self._running = True
        async def runner():
            n=0
            while self._running:
                try:
                    await self._ws_loop()
                    n=0
                except Exception:
                    n+=1
                    await asyncio.sleep(min(60, 2**min(n,6)))
        self._task = asyncio.create_task(runner())

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
