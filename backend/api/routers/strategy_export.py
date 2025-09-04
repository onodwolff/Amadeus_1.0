from fastapi import APIRouter, Depends, Response
from sqlmodel import Session, select
from io import StringIO
import csv
from backend.core.db import get_session
from backend.core.models import RealizedPnlRow, FillRow

router = APIRouter(prefix="/strategy", tags=["strategy-export"])

@router.get("/{sid}/trades.csv")
def export_trades_csv(sid: str, symbol: str = "BTCUSDT", exchange: str = "binance", category: str = "usdt", session: Session = Depends(get_session)):
    q = select(RealizedPnlRow).where(
        RealizedPnlRow.strategy_id==sid,
        RealizedPnlRow.symbol==symbol,
        RealizedPnlRow.exchange==exchange,
        RealizedPnlRow.category==category
    ).order_by(RealizedPnlRow.ts.asc())
    rows = list(session.exec(q))
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["ts","symbol","exchange","category","qty","price","pnl","fee","funding","strategy_id"])
    for r in rows:
        w.writerow([r.ts, r.symbol, r.exchange, r.category, r.qty, r.price, r.pnl, r.fee, r.funding, r.strategy_id or ""])
    data = buf.getvalue().encode("utf-8")
    return Response(content=data, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=trades_{sid}.csv"})

@router.get("/{sid}/fills")
def list_fills(sid: str, symbol: str = "BTCUSDT", exchange: str = "binance", category: str = "usdt", limit: int = 100, session: Session = Depends(get_session)):
    q = select(FillRow).where(
        FillRow.symbol==symbol, FillRow.exchange==exchange, FillRow.category==category
    ).order_by(FillRow.ts.desc()).limit(limit)
    rows = [{
        "ts": r.ts, "order_id": r.order_id, "symbol": r.symbol, "price": r.price, "qty": r.qty, "side": r.side,
        "strategy_id": r.strategy_id, "fee": (r.meta or {}).get("n") or (r.meta or {}).get("execFee") or 0.0
    } for r in session.exec(q)]
    return {"items": rows}
