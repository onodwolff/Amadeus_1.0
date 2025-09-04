from fastapi import APIRouter, Depends
from typing import Optional
from sqlmodel import Session
from backend.api.deps import require_token
from backend.core.db import get_session
from backend.core.metrics import compute_strategy_report

router = APIRouter(prefix="/strategy", tags=["strategy-analytics"])

@router.get("/{sid}/report")
def strategy_report(sid: str, symbol: str = "BTCUSDT", exchange: str = "binance", category: str = "usdt", session: Session = Depends(get_session), _=Depends(require_token)):
    rep = compute_strategy_report(session, symbol=symbol, exchange=exchange, category=category, strategy_id=sid)
    return {"strategy": sid, "symbol": symbol, "exchange": exchange, "category": category, "report": rep}
