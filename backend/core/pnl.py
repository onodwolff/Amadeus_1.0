from __future__ import annotations
from typing import Optional, Tuple
from sqlmodel import Session, select
from .models import PositionRow, RealizedPnlRow, EquitySnapshotRow, FillRow

def _extract_fee_funding(meta: dict) -> Tuple[float, float]:
    # Best-effort extraction across exchanges
    fee = 0.0; funding = 0.0
    if not isinstance(meta, dict):
        return 0.0, 0.0
    # Binance: commission 'n', funding not in executionReport (separate event) — skip
    fee = float(meta.get("n", meta.get("commission", 0.0)) or 0.0)
    # Bybit: execFee
    fee = float(meta.get("execFee", fee) or fee)
    # Generic nested
    if isinstance(meta.get("o"), dict):
        fee = float(meta["o"].get("n", meta["o"].get("commission", fee)) or fee)
    # funding: some feeds provide 'fundingFee' or execType == 'Funding' with 'execQty'
    funding = float(meta.get("fundingFee", 0.0) or 0.0)
    if str(meta.get("execType","")).lower() == "funding":
        # Positive funding -> received; negative -> paid
        amt = float(meta.get("execFee", 0.0) or 0.0)
        if amt != 0.0:
            funding += -amt  # execFee often positive as fee; treat as negative to equity
    return fee, funding

def _update_position(session: Session, *, symbol: str, exchange: str, category: str, strategy_id: Optional[str], side: str, qty: float, price: float):
    pos = session.exec(select(PositionRow).where(
        PositionRow.symbol==symbol, PositionRow.exchange==exchange, PositionRow.category==category, PositionRow.strategy_id==strategy_id
    )).first()
    if not pos:
        pos = PositionRow(symbol=symbol, exchange=exchange, category=category, strategy_id=strategy_id, qty=0.0, avg_price=0.0)
        session.add(pos); session.flush()

    signed = qty if side=="buy" else -qty
    pnl_realized = 0.0
    if pos.qty == 0 or (pos.qty>0 and signed>0) or (pos.qty<0 and signed<0):
        # same direction: average in
        total_abs = abs(pos.qty) + abs(signed)
        if total_abs > 0:
            pos.avg_price = (abs(pos.qty)*pos.avg_price + abs(signed)*price) / total_abs
        pos.qty += signed
    else:
        closing = min(abs(pos.qty), abs(signed))
        pnl_realized = closing * (price - pos.avg_price) * (1 if pos.qty>0 else -1)
        pos.qty += signed
        if pos.qty == 0:
            pos.avg_price = 0.0
    session.add(pos)
    return pnl_realized

def apply_fill(session: Session, fill: FillRow):
    fee, funding = _extract_fee_funding(fill.meta or {})
    pnl_realized = _update_position(session,
        symbol=fill.symbol, exchange=fill.exchange, category=fill.category, strategy_id=fill.strategy_id,
        side=fill.side, qty=fill.qty, price=fill.price
    )
    if pnl_realized != 0.0 or fee != 0.0 or funding != 0.0:
        session.add(RealizedPnlRow(symbol=fill.symbol, exchange=fill.exchange, category=fill.category,
                                    strategy_id=fill.strategy_id, ts=fill.ts, qty=fill.qty, price=fill.price,
                                    pnl=pnl_realized, fee=fee, funding=funding))
    # Equity as cash + mark-to-last, with fee/funding applied as cash adjustments
    fills = session.exec(select(FillRow).where(FillRow.symbol==fill.symbol, FillRow.exchange==fill.exchange, FillRow.category==fill.category).order_by(FillRow.ts.asc())).all()
    cash = 0.0; pos = 0.0; last_px = fill.price
    for f in fills:
        sgn = 1 if f.side=="sell" else -1
        cash += sgn * f.qty * f.price
        pos += (-sgn) * f.qty
        last_px = f.price
        # apply fees/funding from each fill meta
        ff, fd = _extract_fee_funding(f.meta or {})
        cash -= abs(ff)  # fee always reduces cash
        cash += fd       # funding can be +/-
    equity = cash + pos * last_px
    session.add(EquitySnapshotRow(ts=fill.ts, equity=equity, symbol=fill.symbol, exchange=fill.exchange, category=fill.category, strategy_id=fill.strategy_id))
