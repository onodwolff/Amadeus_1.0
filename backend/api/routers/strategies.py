from fastapi import APIRouter, Depends
from typing import Dict, Any
from backend.api.deps import require_token
from backend.core.db import get_session
from backend.core.models import OrderRow
from backend.core.risk import RISK_ENGINE
from backend.adapters.registry import get_adapter
from sqlmodel import Session
import time, random, string

router = APIRouter(prefix="/strategies", tags=["strategies"])

# NOTE: this is a minimal placeholder; wire it to your real strategy registry
_registry = {"sample_ema_crossover": {"schema": {"type":"object","properties":{"symbol":{"type":"string","default":"BTCUSDT"},"short":{"type":"integer","default":12},"long":{"type":"integer","default":26},"qty":{"type":"number","default":0.01},"exchange":{"type":"string","default":"binance"},"category":{"type":"string","default":"usdt"}}}}}
_running: Dict[str, Any] = {}

def _gen_cid(prefix: str) -> str:
    suf = ''.join(random.choice(string.ascii_lowercase+string.digits) for _ in range(6))
    return f"{prefix}-{int(time.time()*1000)}-{suf}"

@router.get("")
async def list_strategies(_=Depends(require_token)):
    return [{"id": k, "running": k in _running} for k in _registry.keys()]

@router.get("/{sid}/schema")
async def get_schema(sid: str, _=Depends(require_token)):
    return _registry[sid]["schema"]

@router.post("/{sid}/start")
async def start(sid: str, cfg: Dict[str, Any], session: Session = Depends(get_session), _=Depends(require_token)):
    if sid in _running:
        return {"ok": True, "already": True}
    exchange = cfg.get("exchange","mock")
    category = cfg.get("category","spot")
    symbol = cfg.get("symbol","BTCUSDT")
    adapter = get_adapter(exchange, category)

    # simulate one order placement to show clientOrderId tagging & persistence
    req = {"symbol": symbol, "side":"buy", "type":"limit", "qty": cfg.get("qty",0.01), "price": None, "client_order_id": _gen_cid(sid)}
    ack = await adapter.place_order(type("Req",(object,),req)())
    order_row = OrderRow(
        order_id=str(getattr(ack, "order_id", getattr(ack, "id", ""))),
        client_order_id=req["client_order_id"], symbol=symbol, side="buy", qty=req["qty"],
        price=None, status="new", exchange=exchange, category=category, strategy_id=sid
    )
    session.add(order_row); session.commit()
    _running[sid] = {"cfg": cfg}
    return {"ok": True, "order_client_id": req["client_order_id"]}

@router.post("/{sid}/stop")
async def stop(sid: str, _=Depends(require_token)):
    _running.pop(sid, None)
    return {"ok": True}
