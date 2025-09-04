from fastapi import APIRouter, Depends
from typing import Dict, Any
from backend.api.deps import require_token
from backend.plugins.sample_ema_crossover import SampleEmaCrossover
from backend.adapters.registry import get_adapter
from backend.core.risk import RISK_ENGINE

router = APIRouter(prefix="/strategies", tags=["strategies"])
_registry: Dict[str, Any] = {"sample_ema_crossover": SampleEmaCrossover()}
_running: Dict[str, Any] = {}

@router.get("")
async def list_strategies(_=Depends(require_token)):
    return [{"id": k, "running": k in _running} for k in _registry.keys()]

@router.get("/{sid}/schema")
async def get_schema(sid: str, _=Depends(require_token)):
    return _registry[sid].schema

@router.post("/{sid}/start")
async def start(sid: str, cfg: Dict[str, Any], _=Depends(require_token)):
    if sid in _running:
        return {"ok": True, "already": True}
    strat = _registry[sid]
    exchange = cfg.get("exchange","mock")
    category = cfg.get("category","spot")
    symbol = cfg.get("symbol","BTCUSDT")
    adapter = get_adapter(exchange, category)

    class Ctx:
        def __init__(self): 
            self.mode = cfg.get("mode","paper")
            self.logger = type("L",(object,),{"info":print})()
            self.risk = RISK_ENGINE
            class MD:
                async def subscribe_trades(self, sym, cb):
                    await adapter.subscribe_trades(sym, cb)
            class Trader:
                async def place_order(self, req_dict): 
                    req = type("Req",(object,), req_dict)()
                    # risk checks
                    opens = await adapter.get_open_orders(symbol)  # list
                    pos_list = await adapter.get_positions()
                    pos_qty = 0.0
                    for p in pos_list:
                        if getattr(p, "symbol", "") == symbol:
                            pos_qty = getattr(p, "qty", 0.0)
                            break
                    decision = RISK_ENGINE.pre_trade_check(req=req, open_orders_count=len(opens), current_pos_qty=pos_qty)
                    if not decision.allowed:
                        print("[risk] rejected:", decision.reason)
                        return {"rejected": True, "reason": decision.reason}
                    ack = await adapter.place_order(req)
                    print("[order]", req_dict, ack.model_dump())
                    return ack.model_dump()
            self.md=MD(); self.trader=Trader()
        def emit_metric(self, *a, **k): pass
        def now(self): 
            import time; return int(time.time()*1000)

    ctx = Ctx()
    await strat.init(ctx, cfg)
    await strat.on_start()
    _running[sid] = strat
    return {"ok": True}

@router.post("/{sid}/stop")
async def stop(sid: str, _=Depends(require_token)):
    if sid in _running:
        await _running[sid].on_stop()
        _running.pop(sid, None)
    return {"ok": True}
