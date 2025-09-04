from .base import ExchangeAdapter
from typing import Dict, Any, Callable
import httpx, asyncio, time

class BinanceAdapter(ExchangeAdapter):
    id = "binance"
    capabilities = {"spot": True, "futures": False, "l2": True, "userDataWS": False}

    def normalize_symbol(self, s: str) -> str:
        return s.replace("/", "").upper()

    async def subscribe_book(self, symbol: str, depth: str, cb: Callable[[Dict[str, Any]], Any]):
        # Placeholder WS: Implement real Binance WS if needed
        async def unsub(): pass
        return unsub

    async def subscribe_trades(self, symbol: str, cb: Callable[[Dict[str, Any]], Any]):
        async def unsub(): pass
        return unsub

    async def get_ohlcv(self, symbol: str, tf: str, since=None, limit: int=200):
        # Simple public REST klines (placeholder)
        s = self.normalize_symbol(symbol)
        interval = tf
        url = "https://api.binance.com/api/v3/klines"
        params = {"symbol": s, "interval": interval, "limit": limit}
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            out = []
            for k in data:
                out.append({"t": int(k[0]/1000), "o": float(k[1]), "h": float(k[2]), "l": float(k[3]), "c": float(k[4]), "v": float(k[5])})
            return out

    async def place_order(self, req: dict) -> dict:
        # Live trading omitted in MVP
        return {"id": f"bn-{int(time.time()*1000)}", "status": "ACK"}
    async def cancel_order(self, id_or_client_id: str) -> dict:
        return {"id": id_or_client_id, "status": "CANCELED"}
    async def get_open_orders(self, symbol=None): return []
    async def get_positions(self): return []
    async def get_balances(self): return []
    async def get_symbol_info(self, symbol: str): return {"symbol": symbol, "step": 0.01, "lot": 0.001}
