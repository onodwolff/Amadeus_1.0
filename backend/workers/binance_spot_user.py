import asyncio, time, json
from typing import Optional
import httpx, websockets
from sqlmodel import Session
from backend.core.db import engine
from backend.core.keys import get_keys
from backend.core.events import publish_fill

REST = "https://api.binance.com"
WS = "wss://stream.binance.com:9443/ws"

class BinanceSpotUserDataWorker:
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._listen_key: Optional[str] = None
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
                if e in ("executionReport","ORDER_TRADE_UPDATE"):
                    side = "buy" if (msg.get("S")=="BUY" or msg.get("o",{}).get("S")=="BUY") else "sell"
                    symbol = msg.get("s") or msg.get("o",{}).get("s")
                    price = float(msg.get("L") or msg.get("o",{}).get("L") or 0)
                    qty = float(msg.get("l") or msg.get("o",{}).get("l") or 0)
                    ts = int(msg.get("E", time.time()*1000))
                    if qty>0 and price>0:
                        await publish_fill({"order_id": str(msg.get("i") or msg.get("o",{}).get("i")), "symbol": symbol, "price": price, "qty": qty, "side": side, "exchange": "binance", "category": "spot", "ts": ts})

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
