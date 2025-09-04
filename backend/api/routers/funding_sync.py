from fastapi import APIRouter, Depends
from sqlmodel import Session
from datetime import datetime, timezone
import httpx, hmac, hashlib
from backend.core.db import get_session
from backend.core.keys import get_keys
from backend.core.models import RealizedPnlRow

router = APIRouter(prefix="/funding", tags=["funding"])

BINANCE_FUT = "https://fapi.binance.com"

def _sign(secret: str, q: str) -> str:
    return hmac.new(secret.encode(), q.encode(), hashlib.sha256).hexdigest()

@router.post("/sync/binance")
async def sync_binance(symbol: str, start_ms: int, end_ms: int, category: str="usdt", session: Session = Depends(get_session)):
    creds = get_keys(session, "binance", category)
    if not creds:
        return {"ok": False, "error": "no creds"}
    key, secret = creds
    # Income history: type=FUNDING_FEE
    params = f"symbol={symbol}&incomeType=FUNDING_FEE&startTime={start_ms}&endTime={end_ms}&timestamp={int(datetime.now(timezone.utc).timestamp()*1000)}"
    sig = _sign(secret, params)
    headers = {"X-MBX-APIKEY": key}
    async with httpx.AsyncClient(base_url=BINANCE_FUT, timeout=20.0, headers=headers) as client:
        r = await client.get(f"/fapi/v1/income?{params}&signature={sig}")
        r.raise_for_status()
        data = r.json()
    # Persist as RealizedPnlRow funding adjustments (no qty/price)
    count = 0
    for it in data:
        if it.get("incomeType") != "FUNDING_FEE": continue
        amt = float(it.get("income", 0) or 0.0)
        ts = int(it.get("time"))
        session.add(RealizedPnlRow(symbol=symbol, exchange="binance", category=category, strategy_id=None, ts=ts, qty=0.0, price=0.0, pnl=0.0, fee=0.0, funding=amt))
        count += 1
    session.commit()
    return {"ok": True, "added": count}
