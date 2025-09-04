from fastapi import APIRouter, Depends
from typing import Dict, Any
from backend.api.deps import require_token
from backend.plugins.sample_ema_crossover import SampleEmaCrossover
from backend.adapters.registry import get_adapter
from backend.core.risk import RISK_ENGINE
from backend.core.db import get_session
from backend.core.models import OrderRow, FillRow, PositionRow
from backend.core.events import publish_fill
from sqlmodel import Session
import time

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
async def start(sid: str, cfg: Dict[str, Any], session: Session = Depends(get_session), _=Depends(require_token)):
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
                    opens = await adapter.get_open_orders(symbol)
                    pos_qty = 0.0
                    decision = RISK_ENGINE.pre_trade_check(req=req, open_orders_count=len(opens), current_pos_qty=pos_qty)
                    if not decision.allowed:
                        print("[risk] rejected:", decision.reason)
                        return {"rejected": True, "reason": decision.reason}
                    # assume market fill at last close
                    try:
                        ohlcv = await adapter.get_ohlcv(symbol, "1m", limit=1)
                        px = ohlcv[-1].c if ohlcv else None
                    except Exception:
                        px = None
                    ack = await adapter.place_order(req)
                    # persist order
                    order_row = OrderRow(
                        order_id=ack.order_id, client_order_id=req_dict.get("client_order_id"),
                        symbol=req.symbol, side=req.side, qty=req.qty, price=px, status="filled",
                        exchange=exchange, category=category
                    )
                    session.add(order_row)
                    # persist fill
                    fill_row = FillRow(
                        order_id=ack.order_id, symbol=req.symbol, price=px or 0.0, qty=req.qty, side=req.side,
                        exchange=exchange, category=category, ts=int(time.time()*1000), meta={"mode": self.mode}
                    )
                    session.add(fill_row)
                    session.commit()
                    # publish fill event
                    await publish_fill({
                        "order_id": ack.order_id, "symbol": req.symbol, "price": px, "qty": req.qty,
                        "side": req.side, "exchange": exchange, "category": category, "ts": int(time.time()*1000)
                    })
                    print("[order]", req_dict, ack.model_dump())
                    return ack.model_dump()
            self.md=MD(); self.trader=Trader(); self.mode = cfg.get("mode","paper")
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
