from typing import Dict, Any, List
from statistics import mean, pstdev

def run_backtest(prices: List[float]) -> Dict[str, Any]:
    # toy metrics over price changes
    if len(prices) < 3:
        return {"sharpe": 0, "maxdd": 0, "winrate": 0, "profit_factor": 0}
    rets = [ (prices[i+1]-prices[i])/prices[i] for i in range(len(prices)-1) ]
    avg = mean(rets)
    vol = pstdev(rets) or 1e-6
    sharpe = (avg/vol) * (252**0.5)
    # max drawdown
    peak = prices[0]; maxdd = 0.0
    for p in prices:
        peak = max(peak, p)
        dd = (p-peak)/peak
        if dd < maxdd: maxdd = dd
    wins = sum(1 for r in rets if r>0); losses = sum(1 for r in rets if r<=0)
    winrate = wins/max(1, wins+losses)
    profit_factor = (sum(r for r in rets if r>0) / abs(sum(r for r in rets if r<0) or 1e-6))
    return {"sharpe": sharpe, "maxdd": maxdd, "winrate": winrate, "profit_factor": profit_factor}
