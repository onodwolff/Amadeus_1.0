from typing import List, Dict, Any
import math

async def run(strategy, candles: List[Dict[str, Any]], fee_bps=1, slippage_bps=0):
    # skeleton: invoke on_tick through historical candles
    # NOTE: in real version we should inject a backtest context.
    trades = 0
    pnl = 0.0
    for c in candles:
        await strategy.on_tick()
    return {"trades": trades, "pnl": pnl, "fee_bps": fee_bps}
