from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from backend.core.db import get_session
from backend.core.models import EquitySnapshotRow, RealizedPnlRow
from .strategies import _running

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
def total_summary(session: Session = Depends(get_session)):
    # aggregate total equity across latest snapshots and realized pnl
    stmt = select(EquitySnapshotRow).order_by(
        EquitySnapshotRow.symbol,
        EquitySnapshotRow.strategy_id,
        EquitySnapshotRow.ts.desc(),
    )
    rows = list(session.exec(stmt))
    latest = {}
    for r in rows:
        key = (r.strategy_id or "n/a", r.symbol, r.exchange, r.category)
        if key not in latest:
            latest[key] = r
    total_equity = sum(r.equity for r in latest.values())
    total_pnl = sum(r.pnl for r in session.exec(select(RealizedPnlRow)))
    running = len(_running)
    return {"equity": total_equity, "pnl": total_pnl, "running_strategies": running}

@router.get("/summary/strategies")
def per_strategy_summary(session: Session = Depends(get_session)):
    # last equity per (strategy_id, symbol, exchange, category)
    stmt = select(EquitySnapshotRow).order_by(EquitySnapshotRow.symbol, EquitySnapshotRow.strategy_id, EquitySnapshotRow.ts.desc())
    rows = list(session.exec(stmt))
    latest = {}
    for r in rows:
        key = (r.strategy_id or "n/a", r.symbol, r.exchange, r.category)
        if key not in latest:
            latest[key] = r
    out = [{
        "strategy_id": k[0], "symbol": k[1], "exchange": k[2], "category": k[3],
        "equity": v.equity, "ts": v.ts
    } for k,v in latest.items()]
    return {"items": out}
