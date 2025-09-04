import asyncio, time, json, hmac, hashlib
from typing import Optional
import websockets
from sqlmodel import Session
from backend.core.db import engine
from backend.core.keys import get_keys
from backend.core.models import FillRow
from backend.core.events import publish_fill

WS_PRIV = "wss://stream.bybit.com/v5/private"

class BybitUserDataWorker:
    def __init__(self, category: str = "linear"):
        self.category = category
        self._task: Optional[asyncio.Task] = None
        self._running = False

    def _sign1(self, key: str, secret: str) -> tuple[str,str,str]:
        expires = str(int(time.time()*1000) + 30_000)
        payload = key + expires
        sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        return key, expires, sig

    def _sign2(self, key: str, secret: str) -> tuple[str,str,str]:
        expires = str(int(time.time()*1000) + 30_000)
        payload = "GET/realtime" + expires
        sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        return key, expires, sig

    async def _ws_loop(self):
        from backend.core.models import CredentialRow
        with Session(engine) as db:
            creds = get_keys(db, "bybit", self.category) or get_keys(db, "bybit", "linear") or get_keys(db, "bybit", "spot")
            if not creds:
                return
            key, secret = creds
        async with websockets.connect(WS_PRIV, ping_interval=20, ping_timeout=20) as ws:
            # try two auth schemes
            key, exp, sig = self._sign1(key, secret)
            await ws.send(json.dumps({"op":"auth","args":[key, exp, sig]}))
            try:
                resp = json.loads(await ws.recv())
                if resp.get("success") is not True and resp.get("op")!="auth":
                    # fallback
                    key, exp, sig = self._sign2(key, secret)
                    await ws.send(json.dumps({"op":"auth","args":[key, exp, sig]}))
                    await ws.recv()
            except Exception:
                pass
            # subscribe to execution
            await ws.send(json.dumps({"op":"subscribe","args":[f"execution.{self.category}"]}))
            while self._running:
                raw = await ws.recv()
                msg = json.loads(raw)
                if msg.get("topic","").startswith("execution."):
                    for e in msg.get("data", []):
                        # persist minimal fill
                        fr = {
                            "order_id": str(e.get("orderId","")),
                            "symbol": e.get("symbol",""),
                            "price": float(e.get("price",0)),
                            "qty": float(e.get("execQty",0)),
                            "side": "buy" if e.get("side","Buy").lower().startswith("b") else "sell",
                            "exchange": "bybit", "category": self.category,
                            "ts": int(e.get("execTime", time.time()*1000))
                        }
                        await publish_fill(fr)

    async def start(self):
        if self._task and not self._task.done():
            return
        self._running = True
        async def runner():
            while self._running:
                try:
                    await self._ws_loop()
                except Exception:
                    await asyncio.sleep(5)
        self._task = asyncio.create_task(runner())

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
