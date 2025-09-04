from fastapi import APIRouter, Depends
from typing import Dict, Any
from backend.api.deps import require_token
from backend.adapters.registry import get_adapter
from backend.backtest.engine import run_backtest

router = APIRouter(prefix="/backtest", tags=["backtest"])

@router.post("/run")
async def run(cfg: Dict[str, Any], _=Depends(require_token)):
    exchange = cfg.get("exchange","mock")
    category = cfg.get("category","spot")
    symbol = cfg.get("symbol","BTCUSDT")
    tf = cfg.get("tf","1m")
    limit = int(cfg.get("limit", 500))
    adapter = get_adapter(exchange, category)
    candles = await adapter.get_ohlcv(symbol, tf, limit=limit)
    prices = [c.c for c in candles]
    metrics = run_backtest(prices)
    return {"ok": True, "n": len(prices), "metrics": metrics}
