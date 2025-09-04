from fastapi import APIRouter
from pydantic import BaseModel
from ...strategies.sample_ema import SampleEMAStrategy
from ...adapters.mock import MockAdapter
from ...backtest.engine import run

router = APIRouter()

class BacktestReq(BaseModel):
    symbol: str = "BTCUSDT"
    tf: str = "1m"
    fast: int = 9
    slow: int = 21
    qty: float = 0.001
    limit: int = 200

@router.post("/backtest/run")
async def run_backtest(req: BacktestReq):
    strat = SampleEMAStrategy()
    adapter = MockAdapter()
    await strat.init(type("Ctx", (), {"md": adapter, "trader": None, "risk": None, "storage": {}, "logger": None, "emitMetric": None, "mode":"backtest", "now": lambda: 0})(), req.model_dump())
    await strat.on_start()
    candles = await adapter.get_ohlcv(req.symbol, req.tf, limit=req.limit)
    res = await run(strat, candles)
    return {"metrics": res}
