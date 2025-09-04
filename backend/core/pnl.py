from __future__ import annotations
from typing import Optional
from sqlmodel import Session, select
from .models import PositionRow, RealizedPnlRow, EquitySnapshotRow, FillRow

def _update_position(session: Session, *, symbol: str, exchange: str, category: str, strategy_id: Optional[str], side: str, qty: float, price: float):
    # Average price method
    pos = session.exec(select(PositionRow).where(
        PositionRow.symbol==symbol, PositionRow.exchange==exchange, PositionRow.category==category, PositionRow.strategy_id==strategy_id
    )).first()
    if not pos:
        pos = PositionRow(symbol=symbol, exchange=exchange, category=category, strategy_id=strategy_id, qty=0.0, avg_price=0.0)
        session.add(pos); session.flush()

    signed_qty = qty if side == "buy" else -qty
    # Same direction -> avg in
    if pos.qty == 0 or (pos.qty > 0 and signed_qty > 0) or (pos.qty < 0 and signed_qty < 0):
        new_qty = pos.qty + signed_qty
        if new_qty == 0:
            pos.avg_price = 0.0
        else:
            # weighted average
            pos.avg_price = (abs(pos.qty)*pos.avg_price + abs(signed_qty)*price) / (abs(pos.qty) + abs(signed_qty))
        pos.qty = new_qty
        session.add(pos)
        return 0.0  # no realized pnl
    # Opposite direction -> realize pnl on closed portion
    closing = min(abs(pos.qty), abs(signed_qty))
    pnl = closing * (price - pos.avg_price) * (1 if pos.qty > 0 else -1)
    # update remaining position
    remainder = pos.qty + signed_qty
    pos.qty = remainder
    if remainder == 0:
        pos.avg_price = 0.0
    session.add(pos)
    return pnl

def apply_fill(session: Session, fill: FillRow, *, mark_price: Optional[float]=None):
    # Update position & realized pnl
    pnl = _update_position(session,
        symbol=fill.symbol, exchange=fill.exchange, category=fill.category, strategy_id=fill.strategy_id,
        side=fill.side, qty=fill.qty, price=fill.price
    )
    if pnl != 0.0:
        session.add(RealizedPnlRow(symbol=fill.symbol, exchange=fill.exchange, category=fill.category,
                                    strategy_id=fill.strategy_id, ts=fill.ts, qty=fill.qty, price=fill.price, pnl=pnl))
    # Equity snapshot (cash-like approach)
    current_equity = _compute_equity(session, symbol=fill.symbol, exchange=fill.exchange, category=fill.category)
    session.add(EquitySnapshotRow(ts=fill.ts, equity=current_equity, symbol=fill.symbol, exchange=fill.exchange, category=fill.category, strategy_id=fill.strategy_id))

def _compute_equity(session: Session, *, symbol: str, exchange: str, category: str) -> float:
    # cash from fills + remaining position valued at last fill price for simplicity
    fills = session.exec(select(FillRow).where(FillRow.symbol==symbol, FillRow.exchange==exchange, FillRow.category==category).order_by(FillRow.ts.asc())).all()
    cash = 0.0; pos = 0.0; last_px = 0.0
    for f in fills:
        sgn = 1 if f.side=="sell" else -1
        cash += sgn * f.qty * f.price
        pos += (-sgn) * f.qty
        last_px = f.price
    return cash + pos * last_px
