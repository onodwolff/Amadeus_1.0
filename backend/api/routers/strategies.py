from fastapi import APIRouter, Depends
from typing import Dict, Any, Callable, Awaitable
from backend.api.deps import require_token
from backend.plugins.sample_ema_crossover import SampleEmaCrossover
from backend.adapters.registry import get_adapter

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
    adapter = get_adapter(exchange, category)

    class Ctx:
        def __init__(self): 
            self.mode = cfg.get("mode","paper")
            self.logger = type("L",(object,),{"info":print})()
            class MD:
                async def subscribe_trades(self, symbol, cb):
                    await adapter.subscribe_trades(symbol, cb)
            class Trader:
                async def place_order(self, req): 
                    # req is dict; convert to pydantic PlaceOrder-like with attributes
                    req_obj = type("Req",(object,), req)()
                    ack = await adapter.place_order(req_obj)
                    print("[order]", req, ack.model_dump())
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
