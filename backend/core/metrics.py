from __future__ import annotations
from typing import Dict, Any, Optional, List
from math import sqrt
from statistics import mean, pstdev
from sqlmodel import Session, select
from .models import EquitySnapshotRow, RealizedPnlRow

def _equity_series(session: Session, *, symbol: str, exchange: str, category: str, strategy_id: Optional[str]) -> List[EquitySnapshotRow]:
    q = select(EquitySnapshotRow).where(
        EquitySnapshotRow.symbol==symbol, EquitySnapshotRow.exchange==exchange, EquitySnapshotRow.category==category
    )
    if strategy_id is not None:
        q = q.where(EquitySnapshotRow.strategy_id==strategy_id)
    q = q.order_by(EquitySnapshotRow.ts.asc())
    return list(session.exec(q))

def _realized_rows(session: Session, *, symbol: str, exchange: str, category: str, strategy_id: Optional[str]) -> List[RealizedPnlRow]:
    q = select(RealizedPnlRow).where(
        RealizedPnlRow.symbol==symbol, RealizedPnlRow.exchange==exchange, RealizedPnlRow.category==category
    )
    if strategy_id is not None:
        q = q.where(RealizedPnlRow.strategy_id==strategy_id)
    q = q.order_by(RealizedPnlRow.ts.asc())
    return list(session.exec(q))

def max_drawdown(eqs: List[float]) -> float:
    peak = -1e18
    mdd = 0.0
    for x in eqs:
        peak = max(peak, x)
        if peak>0:
            dd = (x - peak) / peak
            mdd = min(mdd, dd)
    return mdd

def sharpe(returns: List[float], periods_per_year: int = 252) -> float:
    if len(returns) < 2:
        return 0.0
    mu = mean(returns)
    vol = pstdev(returns) or 1e-9
    return (mu/vol) * sqrt(periods_per_year)

def sortino(returns: List[float], periods_per_year: int = 252) -> float:
    if not returns:
        return 0.0
    downside = [r for r in returns if r < 0]
    dd = (pstdev(downside) if len(downside)>1 else (abs(mean(downside)) if downside else 1e-9)) or 1e-9
    mu = mean(returns)
    return (mu/dd) * sqrt(periods_per_year)

def profit_factor(rows: List[RealizedPnlRow]) -> float:
    pos = sum(max(0.0, r.pnl - abs(r.fee) + r.funding) for r in rows)
    neg = sum(min(0.0, r.pnl - abs(r.fee) + r.funding) for r in rows)
    return (pos / abs(neg)) if abs(neg) > 0 else float('inf') if pos>0 else 0.0

def cagr(equity: List[float], times: List[int]) -> float:
    if len(equity) < 2: return 0.0
    start, end = equity[0], equity[-1]
    if start == 0: return 0.0
    years = max(1e-9, (times[-1] - times[0]) / (365.0*24*3600*1000.0))
    return (end / start) ** (1/years) - 1

def compute_strategy_report(session: Session, *, symbol: str, exchange: str, category: str, strategy_id: Optional[str]) -> Dict[str, Any]:
    ser = _equity_series(session, symbol=symbol, exchange=exchange, category=category, strategy_id=strategy_id)
    if not ser:
        return {"equity": [], "sharpe": 0.0, "calmar": 0.0, "maxdd": 0.0, "winrate": 0.0, "pnl_total": 0.0, "profit_factor": 0.0, "sortino": 0.0, "cagr": 0.0}
    eq = [s.equity for s in ser]
    ts = [s.ts for s in ser]
    rets = []
    for i in range(len(eq)-1):
        if eq[i] != 0:
            rets.append((eq[i+1]-eq[i]) / abs(eq[i]))
    mdd = max_drawdown(eq)
    mu = mean(rets) if rets else 0.0
    ann_return = mu * 252
    sh = sharpe(rets, 252)
    so = sortino(rets, 252)
    cal = (ann_return / abs(mdd)) if abs(mdd)>0 else float('inf') if ann_return>0 else 0.0
    rr = _realized_rows(session, symbol=symbol, exchange=exchange, category=category, strategy_id=strategy_id)
    wins = sum(1 for r in rr if (r.pnl - abs(r.fee) + r.funding) > 0)
    losses = sum(1 for r in rr if (r.pnl - abs(r.fee) + r.funding) <= 0)
    winrate = (wins / max(1, wins+losses)) if rr else 0.0
    pnl_total = sum(r.pnl - abs(r.fee) + r.funding for r in rr)
    pf = profit_factor(rr)
    _cagr = cagr(eq, ts)
    return {
        "equity": [{"ts": s.ts, "equity": s.equity} for s in ser],
        "sharpe": sh, "calmar": cal, "maxdd": mdd, "winrate": winrate,
        "pnl_total": pnl_total, "profit_factor": pf, "sortino": so, "cagr": _cagr
    }
