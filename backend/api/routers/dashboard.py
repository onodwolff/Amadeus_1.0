from fastapi import APIRouter, Depends
from sqlmodel import select
from backend.api.deps import require_token
from backend.core.db import get_session
from backend.core.models import FillRow, BalanceRow
from backend.adapters.registry import get_adapter

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
async def summary(exchange: str = "binance", category: str = "usdt", symbol: str = "BTCUSDT", session=Depends(get_session), _=Depends(require_token)):
    # realized pnl as sum(side * qty * price delta naive); for demo, simply count buys/sells total
    fills = list(session.exec(select(FillRow).order_by(FillRow.id.asc())))
    pos = 0.0
    cash = 0.0
    for f in fills:
        sgn = 1 if f.side == "sell" else -1
        cash += sgn * f.qty * f.price
        pos += (-sgn) * f.qty  # buy increases pos, sell decreases
    # unrealized using last price
    adapter = get_adapter(exchange, category)
    candles = await adapter.get_ohlcv(symbol, "1m", limit=1)
    last = candles[-1].c if candles else 0.0
    equity = cash + pos * last
    return {"realized_cash": cash, "position_qty": pos, "last_price": last, "equity": equity}
