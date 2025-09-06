from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from backend.core.db import get_session
from backend.core.models import OrderRow, FillRow

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/orders")
def order_history(limit: int = 100, offset: int = 0, session: Session = Depends(get_session)):
    stmt = select(OrderRow).order_by(OrderRow.id.desc()).offset(offset).limit(limit)
    rows = session.exec(stmt).all()
    items = [
        {
            "id": r.id,
            "ts": int(r.created_at.timestamp() * 1000) if r.created_at else None,
            "event": r.status,
            "symbol": r.symbol,
            "side": r.side,
            "type": "limit" if r.price is not None else "market",
            "price": r.price,
            "qty": r.qty,
            "status": r.status,
        }
        for r in rows
    ]
    return {"items": items}


@router.get("/trades")
def trade_history(limit: int = 100, offset: int = 0, session: Session = Depends(get_session)):
    stmt = select(FillRow).order_by(FillRow.id.desc()).offset(offset).limit(limit)
    rows = session.exec(stmt).all()
    items = [
        {
            "id": r.id,
            "ts": r.ts,
            "type": "fill",
            "symbol": r.symbol,
            "side": r.side,
            "price": r.price,
            "qty": r.qty,
            "pnl": r.meta.get("pnl") if isinstance(r.meta, dict) else None,
        }
        for r in rows
    ]
    return {"items": items}
