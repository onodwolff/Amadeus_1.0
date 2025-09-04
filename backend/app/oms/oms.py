import time
from typing import Any, Dict
from ..services.ws import ws_broadcast
from ..services.history import history

class OMS:
    def __init__(self, adapter, paper_executor, risk):
        self.adapter = adapter
        self.paper = paper_executor
        self.risk = risk

    async def place_order(self, req: Dict[str, Any]) -> Dict[str, Any]:
        ok, reason = self.risk.check(req)
        if not ok:
            await ws_broadcast.broadcast({"type":"diag","text": f"Order blocked: {reason}"})
            raise ValueError(f"Order blocked: {reason}")
        # Paper by default in MVP
        if True:
            fill = await self.paper.execute(req)
            oid = fill["order_id"]
            await ws_broadcast.broadcast({"type": "order_event", "order": {"id": oid, "status": "FILLED"}})
            await ws_broadcast.broadcast({"type": "trade", "trade": fill})
            history.log_order({"id": oid, "symbol": req["symbol"], "side": req["side"], "qty": req["qty"], "price": fill["price"], "status": "FILLED", "ts": time.time()})
            history.log_trade({"id": fill["id"], "order_id": oid, "symbol": req["symbol"], "side": req["side"], "qty": req["qty"], "price": fill["price"], "ts": time.time()})
            return {"id": oid, "status": "FILLED"}
        else:
            ack = await self.adapter.place_order(req)
            return ack

    async def cancel_order(self, order_id: str):
        return {"id": order_id, "status": "CANCELED"}
