import time, random
from typing import Dict, Any

class PaperExecutor:
    def __init__(self) -> None:
        self.last_price = 50000.0

    async def execute(self, req: Dict[str, Any]) -> Dict[str, Any]:
        # simplistic: market fills at last_price +/- small random
        price = self.last_price + random.uniform(-2, 2)
        qty = float(req["qty"])
        side = req["side"]
        oid = f"paper-{int(time.time()*1000)}"
        trade_id = f"t-{oid}"
        return {"id": trade_id, "order_id": oid, "price": round(price, 2), "qty": qty, "side": side, "symbol": req["symbol"], "ts": time.time()}
