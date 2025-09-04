from fastapi import APIRouter, Depends
from sqlmodel import select
from datetime import datetime, timezone
from collections import defaultdict
from backend.api.deps import require_token
from backend.core.db import get_session
from backend.core.models import FillRow, RealizedPnlRow, EquitySnapshotRow
from backend.adapters.registry import get_adapter

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/pnl/daily")
async def pnl_daily(symbol: str = "BTCUSDT", exchange: str = "binance", category: str = "usdt", session=Depends(get_session), _=Depends(require_token)):
    fills = list(session.exec(select(FillRow).where(FillRow.symbol==symbol, FillRow.exchange==exchange, FillRow.category==category)))
    daily = defaultdict(float)
    for f in fills:
        day = datetime.fromtimestamp(f.ts/1000, tz=timezone.utc).date().isoformat()
        sgn = 1 if f.side=="sell" else -1
        daily[day] += sgn * f.qty * f.price
    out = [{"day": k, "cash": v} for k,v in sorted(daily.items())]
    adapter = get_adapter(exchange, category)
    candles = await adapter.get_ohlcv(symbol, "1m", limit=1)
    last = candles[-1].c if candles else 0.0
    return {"daily": out, "last_price": last}

@router.get("/equity/series")
async def equity_series(symbol: str = "BTCUSDT", exchange: str = "binance", category: str = "usdt", session=Depends(get_session), _=Depends(require_token)):
    series = list(session.exec(select(EquitySnapshotRow).where(EquitySnapshotRow.symbol==symbol, EquitySnapshotRow.exchange==exchange, EquitySnapshotRow.category==category).order_by(EquitySnapshotRow.ts.asc())))
    return {"series": [{"ts": s.ts, "equity": s.equity} for s in series]}

@router.get("/pnl/realized")
def realized(symbol: str = "BTCUSDT", exchange: str = "binance", category: str = "usdt", session=Depends(get_session), _=Depends(require_token)):
    rows = list(session.exec(select(RealizedPnlRow).where(RealizedPnlRow.symbol==symbol, RealizedPnlRow.exchange==exchange, RealizedPnlRow.category==category).order_by(RealizedPnlRow.ts.asc())))
    total = sum(r.pnl for r in rows)
    return {"total": total, "rows": [r for r in rows]}
