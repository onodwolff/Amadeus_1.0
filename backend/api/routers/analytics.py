from fastapi import APIRouter, Depends
from sqlmodel import select
from datetime import datetime, timezone
from collections import defaultdict
from backend.api.deps import require_token
from backend.core.db import get_session
from backend.core.models import FillRow
from backend.adapters.registry import get_adapter

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/pnl/daily")
async def pnl_daily(symbol: str = "BTCUSDT", exchange: str = "binance", category: str = "usdt", session=Depends(get_session), _=Depends(require_token)):
    # naive cash PnL by day based on fills (buy negative cashflow, sell positive)
    fills = list(session.exec(select(FillRow).where(FillRow.symbol==symbol)))
    daily = defaultdict(float)
    pos = 0.0
    for f in fills:
        day = datetime.fromtimestamp(f.ts/1000, tz=timezone.utc).date().isoformat()
        sgn = 1 if f.side=="sell" else -1
        daily[day] += sgn * f.qty * f.price
    out = [{"day": k, "cash": v} for k,v in sorted(daily.items())]
    # equity series: add current mark on last day
    adapter = get_adapter(exchange, category)
    candles = await adapter.get_ohlcv(symbol, "1m", limit=1)
    last = candles[-1].c if candles else 0.0
    return {"daily": out, "last_price": last}

@router.get("/equity/series")
async def equity_series(symbol: str = "BTCUSDT", exchange: str = "binance", category: str = "usdt", session=Depends(get_session), _=Depends(require_token)):
    fills = list(session.exec(select(FillRow).where(FillRow.symbol==symbol).order_by(FillRow.ts.asc())))
    equity = 0.0
    pos = 0.0
    series = []
    for f in fills:
        sgn = 1 if f.side=="sell" else -1
        equity += sgn * f.qty * f.price
        pos += (-sgn)*f.qty
        series.append({"ts": f.ts, "equity": equity, "pos": pos, "px": f.price})
    return {"series": series}
