from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/backtest", tags=["backtest"])

@router.post("/run")
def run(body: Dict[str, Any]):
    # toy backtest: compute simple SMA crossover on provided prices
    prices: List[float] = body.get("prices") or []
    fast = int(body.get("fast",12)); slow = int(body.get("slow",26)); qty = float(body.get("qty",1))
    if not prices or slow<1:
        return {"trades":0, "pnl":0, "equity":[0]}
    eq = 0.0; pos = 0.0; pnl=0.0; trades=0
    for i in range(len(prices)):
        if i<slow: continue
        f = sum(prices[i-fast+1:i+1])/fast
        s = sum(prices[i-slow+1:i+1])/slow
        if f>s and pos<=0:
            pos = qty; trades+=1
        elif f<s and pos>=0:
            pnl += pos*(prices[i]-prices[i-1]); pos = -qty; trades+=1
        eq = pnl + pos*prices[i]
    return {"trades": trades, "pnl": pnl, "equity": eq}
