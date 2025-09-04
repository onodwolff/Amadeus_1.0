from __future__ import annotations
from typing import Dict, Optional


class PaperExecutor:
    def __init__(self) -> None:
        self.last: Optional[float] = None
        self.best_bid: Optional[float] = None
        self.best_ask: Optional[float] = None
        self.orders: Dict[str, dict] = {}
        self._oid = 0

    def update_quote(self, bid: float, ask: float, last: Optional[float] = None) -> None:
        self.best_bid = bid
        self.best_ask = ask
        if last is not None:
            self.last = last
        self._check_limits()

    async def place_order(self, req: dict) -> dict:
        typ = req.get("type", "market")
        side = req.get("side")
        price = float(req.get("price", 0))
        if typ == "market":
            fill_price = self.last if self.last is not None else price
            return {"id": str(self._oid), "status": "filled", "price": fill_price}
        self._oid += 1
        oid = str(self._oid)
        self.orders[oid] = {"id": oid, "side": side, "price": price}
        return {"id": oid, "status": "open"}

    async def cancel_order(self, oid: str) -> dict:
        if oid in self.orders:
            self.orders.pop(oid, None)
            return {"id": oid, "status": "canceled"}
        return {"id": oid, "status": "not_found"}

    def _check_limits(self) -> None:
        to_fill = []
        for oid, o in self.orders.items():
            side = o["side"]
            price = o["price"]
            if side == "buy" and self.best_ask is not None and price >= self.best_ask:
                to_fill.append(oid)
            elif side == "sell" and self.best_bid is not None and price <= self.best_bid:
                to_fill.append(oid)
        for oid in to_fill:
            self.orders.pop(oid, None)
