import asyncio, time, json, hmac, hashlib
from typing import Optional
import websockets
from sqlmodel import Session
from backend.core.db import engine
from backend.core.keys import get_keys
from backend.core.models import FillRow
from backend.core.events import publish_fill
from backend.core.pnl import apply_fill

WS_PRIV = "wss://stream.bybit.com/v5/private"

async def _sleep_backoff(n: int):
    await asyncio.sleep(min(60, (2 ** min(n, 6)) + (0.1 * n)))

def _sign(api_secret: str, expires_ms: int) -> str:
    payload = f"GET/realtime{expires_ms}"
    return hmac.new(api_secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

class BybitUserDataWorker:
    def __init__(self, category: str = "linear"):
        self.category = category
        self._task: Optional[asyncio.Task] = None
        self._running = False

    async def _ws_loop(self):
        with Session(engine) as db:
            creds = get_keys(db, "bybit", self.category) or get_keys(db, "bybit", "linear") or get_keys(db, "bybit", "spot")
            if not creds:
                return
            key, secret = creds
        async with websockets.connect(WS_PRIV, ping_interval=20, ping_timeout=20) as ws:
            # auth per bybit v5
            expires = int((time.time() + 60) * 1000)
            sig = _sign(secret, expires)
            await ws.send(json.dumps({"op":"auth","args":[key, expires, sig]}))
            await ws.recv()  # auth resp
            await ws.send(json.dumps({"op":"subscribe","args":[f"execution.{self.category}"]}))
            while self._running:
                raw = await ws.recv()
                msg = json.loads(raw)
                if (msg.get("topic","") or "").startswith("execution."):
                    for e in msg.get("data", []):
                        side = "buy" if str(e.get("side","Buy")).lower().startswith("b") else "sell"
                        fr = FillRow(
                            order_id=str(e.get("orderId","")), symbol=e.get("symbol",""), price=float(e.get("execPrice",0)),
                            qty=float(e.get("execQty",0)), side=side, exchange="bybit", category=self.category, ts=int(e.get("execTime", time.time()*1000)), meta=e
                        )
                        with Session(engine) as db:
                            db.add(fr); db.commit()
                            apply_fill(db, fr); db.commit()
                        await publish_fill({"order_id": fr.order_id, "symbol": fr.symbol, "price": fr.price, "qty": fr.qty, "side": fr.side, "exchange": fr.exchange, "category": fr.category, "ts": fr.ts})

    async def start(self):
        if self._task and not self._task.done():
            return
        self._running = True
        async def runner():
            n = 0
            while self._running:
                try:
                    await self._ws_loop()
                    n = 0
                except Exception:
                    n += 1
                    await _sleep_backoff(n)
        self._task = asyncio.create_task(runner())

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
