from fastapi import APIRouter, Depends, Response
from sqlmodel import Session, select
from typing import Optional
from io import StringIO
import csv, math
from backend.core.db import get_session
from backend.core.models import FillRow, RealizedPnlRow, PositionRow

router = APIRouter(prefix="/trades", tags=["trades"])

@router.get("/fills")
def fills(symbol: Optional[str]=None, exchange: Optional[str]=None, category: Optional[str]=None, strategy_id: Optional[str]=None, limit: int = 200, session: Session = Depends(get_session)):
    q = select(FillRow).order_by(FillRow.ts.desc()).limit(limit)
    if symbol: q = q.where(FillRow.symbol==symbol)
    if exchange: q = q.where(FillRow.exchange==exchange)
    if category: q = q.where(FillRow.category==category)
    if strategy_id: q = q.where(FillRow.strategy_id==strategy_id)
    rows = [{
        "ts": r.ts, "order_id": r.order_id, "symbol": r.symbol, "price": r.price, "qty": r.qty, "side": r.side,
        "exchange": r.exchange, "category": r.category, "strategy_id": r.strategy_id
    } for r in session.exec(q)]
    return {"items": rows}

@router.get("/realized.csv")
def realized_csv(symbol: Optional[str]=None, exchange: Optional[str]=None, category: Optional[str]=None, strategy_id: Optional[str]=None, session: Session = Depends(get_session)):
    q = select(RealizedPnlRow).order_by(RealizedPnlRow.ts.asc())
    if symbol: q = q.where(RealizedPnlRow.symbol==symbol)
    if exchange: q = q.where(RealizedPnlRow.exchange==exchange)
    if category: q = q.where(RealizedPnlRow.category==category)
    if strategy_id: q = q.where(RealizedPnlRow.strategy_id==strategy_id)
    rows = list(session.exec(q))
    buf = StringIO(); w = csv.writer(buf)
    w.writerow(["ts","symbol","exchange","category","qty","price","pnl","fee","funding","strategy_id"])
    for r in rows:
        w.writerow([r.ts, r.symbol, r.exchange, r.category, r.qty, r.price, r.pnl, r.fee, r.funding, r.strategy_id or ""])
    return Response(content=buf.getvalue().encode("utf-8"), media_type="text/csv", headers={"Content-Disposition":"attachment; filename=realized.csv"})

@router.get("/exposure")
def exposure(strategy_id: Optional[str]=None, session: Session = Depends(get_session)):
    q = select(PositionRow)
    if strategy_id: q = q.where(PositionRow.strategy_id==strategy_id)
    rows = [{
        "symbol": r.symbol, "qty": r.qty, "avg_price": r.avg_price, "exchange": r.exchange, "category": r.category, "strategy_id": r.strategy_id
    } for r in session.exec(q)]
    return {"items": rows}
