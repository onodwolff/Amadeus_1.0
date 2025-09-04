import time
from typing import Dict, Any, List
from backend.core.strategy_sdk import StrategyPlugin, StrategyContext

def ema(series: List[float], period: int) -> float:
    k = 2/(period+1)
    e = series[0]
    for x in series[1:]:
        e = x * k + e * (1-k)
    return e

class SampleEmaCrossover(StrategyPlugin):
    id = "sample_ema_crossover"
    schema: Dict[str, Any] = {
        "title": "Sample EMA crossover",
        "type": "object",
        "properties": {
            "symbol": {"type": "string", "default": "BTCUSDT"},
            "short": {"type": "integer", "default": 12, "minimum": 2},
            "long":  {"type": "integer", "default": 26, "minimum": 5},
            "qty":   {"type": "number",  "default": 0.01}
        },
        "required": ["symbol","short","long","qty"]
    }

    def __init__(self):
        self.ctx: StrategyContext | None = None
        self.cfg: Dict[str, Any] = {}
        self.prices: List[float] = []

    async def init(self, ctx: StrategyContext, config: Dict[str, Any]) -> None:
        self.ctx = ctx
        self.cfg = config

    async def on_start(self) -> None:
        self.ctx.logger.info(f"[ema] start {self.cfg}")
        # subscribe to market data streams
        await self.ctx.md.subscribe_trades(self.cfg["symbol"], self.on_trade)
        subscribe_book = getattr(self.ctx.md, "subscribe_book", None)
        if callable(subscribe_book):
            await subscribe_book(self.cfg["symbol"], "L2", self.on_book)

    async def on_stop(self) -> None:
        self.ctx.logger.info("[ema] stop")

    async def on_tick(self, symbol: str) -> None:
        # periodically evaluate EMA crossover using cached prices
        await self._evaluate()

    async def on_book(self, msg) -> None:
        # use mid price of top of book as a price input
        price = None
        if msg.bids and msg.asks:
            price = (msg.bids[0].price + msg.asks[0].price) / 2
        elif msg.bids:
            price = msg.bids[0].price
        elif msg.asks:
            price = msg.asks[0].price
        if price is not None:
            self.prices.append(price)
            self._trim_prices()
        await self._evaluate()

    async def on_trade(self, msg) -> None:
        self.prices.append(msg.price)
        self._trim_prices()
        await self._evaluate()

    def _trim_prices(self) -> None:
        maxlen = max(self.cfg["short"], self.cfg["long"]) * 4
        if len(self.prices) > maxlen:
            self.prices = self.prices[-maxlen:]

    async def _evaluate(self) -> None:
        if len(self.prices) < self.cfg["long"] + 2:
            return
        s = ema(self.prices[-self.cfg["short"]:], self.cfg["short"])
        l = ema(self.prices[-self.cfg["long"]:], self.cfg["long"])
        if s > l:
            await self.ctx.trader.place_order({"symbol": self.cfg["symbol"], "side": "buy", "qty": self.cfg["qty"]})
        elif s < l:
            await self.ctx.trader.place_order({"symbol": self.cfg["symbol"], "side": "sell", "qty": self.cfg["qty"]})
