import asyncio, time, json
from typing import Optional
import httpx, websockets
from sqlmodel import Session
from backend.core.db import engine
from backend.core.keys import get_keys
from backend.core.models import FillRow
from backend.core.events import publish_fill
from backend.core.pnl import apply_fill

BINANCE_FUT = "https://fapi.binance.com"
WS_BASE = "wss://fstream.binance.com/ws"

async def _sleep_backoff(n: int):
    await asyncio.sleep(min(60, (2 ** min(n, 6)) + (0.1 * n)))

class BinanceUserDataWorker:
    def __init__(self, category: str = "usdt"):
        self.category = category
        self._task: Optional[asyncio.Task] = None
        self._listen_key: Optional[str] = None
        self._running = False

    async def _get_headers(self, session: Session):
        creds = get_keys(session, "binance", "usdt")
        if not creds:
            return None
        api_key, _ = creds
        return {"X-MBX-APIKEY": api_key}

    async def _get_listen_key(self, session: Session) -> Optional[str]:
        headers = await self._get_headers(session)
        if not headers:
            return None
        async with httpx.AsyncClient(base_url=BINANCE_FUT, timeout=20.0, headers=headers) as client:
            r = await client.post("/fapi/v1/listenKey")
            r.raise_for_status()
            return r.json()["listenKey"]

    async def _keepalive(self, session: Session):
        # Valid 60 minutes -> refresh every ~30m
        while self._running and self._listen_key:
            try:
                headers = await self._get_headers(session)
                async with httpx.AsyncClient(base_url=BINANCE_FUT, timeout=20.0, headers=headers) as client:
                    await client.put("/fapi/v1/listenKey", params={"listenKey": self._listen_key})
            except Exception:
                pass
            await asyncio.sleep(30*60)

    async def _ws_loop(self):
        with Session(engine) as db:
            self._listen_key = await self._get_listen_key(db)
            if not self._listen_key:
                return
        url = f"{WS_BASE}/{self._listen_key}"
        async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
            while self._running:
                raw = await ws.recv()
                msg = json.loads(raw)
                if msg.get("e") == "ORDER_TRADE_UPDATE":
                    o = msg.get("o", {})
                    if o.get("X") in ("FILLED","PARTIALLY_FILLED") and float(o.get("l",0))>0:
                        with Session(engine) as db:
                            fr = FillRow(
                                order_id=str(o.get("i")), symbol=o.get("s"), price=float(o.get("L",0)),
                                qty=float(o.get("l",0)), side=("buy" if o.get("S")=="BUY" else "sell"),
                                exchange="binance", category="usdt", ts=int(msg.get("E", time.time()*1000)), meta=o
                            )
                            db.add(fr); db.commit()
                            apply_fill(db, fr); db.commit()
                        await publish_fill({
                            "order_id": str(o.get("i")), "symbol": o.get("s"), "price": float(o.get("L",0)),
                            "qty": float(o.get("l",0)), "side": "buy" if o.get("S")=="BUY" else "sell",
                            "exchange": "binance", "category": "usdt", "ts": int(msg.get("E", time.time()*1000))
                        })

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
