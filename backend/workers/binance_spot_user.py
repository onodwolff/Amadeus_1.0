import asyncio, time, json
from typing import Optional
import httpx, websockets
from sqlmodel import Session
from backend.core.db import engine
from backend.core.keys import get_keys
from backend.core.events import publish_fill
from backend.core.models import FillRow
from backend.core.pnl import apply_fill
from backend.workers._util_strategy_map import find_strategy_by_order_id

REST = "https://api.binance.com"
WS = "wss://stream.binance.com:9443/ws"

async def _sleep_backoff(n: int):
    await asyncio.sleep(min(60, (2 ** min(n, 6)) + (0.1 * n)))

class BinanceSpotUserDataWorker:
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._running = False

    async def _headers(self, db: Session):
        creds = get_keys(db, "binance", "spot")
        if not creds:
            return None
        api_key, _ = creds
        return {"X-MBX-APIKEY": api_key}

    async def _get_listen_key(self, db: Session) -> Optional[str]:
        headers = await self._headers(db)
        if not headers:
            return None
        async with httpx.AsyncClient(base_url=REST, timeout=20.0, headers=headers) as client:
            r = await client.post("/api/v3/userDataStream")
            r.raise_for_status()
            return r.json()["listenKey"]

    async def _ws_loop(self):
        with Session(engine) as db:
            lk = await self._get_listen_key(db)
            if not lk:
                return
        url = f"{WS}/{lk}"
        async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
            while self._running:
                msg = json.loads(await ws.recv())
                e = msg.get("e","")
                if e == "executionReport":
                    side = "buy" if msg.get("S")=="BUY" else "sell"
                    symbol = msg.get("s","")
                    price = float(msg.get("L") or 0)
                    qty = float(msg.get("l") or 0)
                    ts = int(msg.get("E", time.time()*1000))
                    oid = str(msg.get("i",""))
                    if qty>0 and price>0:
                        with Session(engine) as db:
                            sid = find_strategy_by_order_id(db, oid)
                            fr = FillRow(order_id=oid, symbol=symbol, price=price, qty=qty, side=side, exchange="binance", category="spot", ts=ts, meta=msg, strategy_id=sid)
                            db.add(fr); db.commit()
                            apply_fill(db, fr); db.commit()
                        await publish_fill({"order_id": oid, "symbol": symbol, "price": price, "qty": qty, "side": side, "exchange": "binance", "category": "spot", "ts": ts, "strategy_id": sid})

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
