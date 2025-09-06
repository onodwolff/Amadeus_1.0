from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from backend.api.deps import require_token
from backend.adapters.registry import get_adapter
from backend.core.contracts import PlaceOrder

router = APIRouter(prefix="/bots", tags=["bots"])

_bots: Dict[str, Dict[str, Any]] = {}
_counter = 0


def _gen_cid() -> str:
    global _counter
    _counter += 1
    return f"bot-{_counter}"


class BotStart(BaseModel):
    strategy_id: str
    exchange: str
    symbol: str
    category: str = "spot"
    side: str = "buy"
    qty: float = 0.001
    risk_profile: str | None = None


@router.post("")
async def start_bot(body: BotStart, _=Depends(require_token)):
    cid = _gen_cid()
    adapter = get_adapter(body.exchange, body.category)
    await adapter.place_order(
        PlaceOrder(
            symbol=body.symbol,
            side=body.side,
            qty=body.qty,
            client_order_id=cid,
        )
    )
    info = body.model_dump()
    info["id"] = cid
    _bots[cid] = info
    return info


@router.get("")
def list_bots(_=Depends(require_token)):
    return {"items": list(_bots.values())}


@router.post("/{bot_id}/stop")
async def stop_bot(bot_id: str, _=Depends(require_token)):
    bot = _bots.pop(bot_id, None)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    adapter = get_adapter(bot["exchange"], bot.get("category", "spot"))
    await adapter.cancel_order(bot_id)
    return {"ok": True}
