from .base import StrategyPlugin, StrategyContext
import math

class SampleEMAStrategy(StrategyPlugin):
    id = "sample_ema"
    schema = {
        "type": "object",
        "properties": {
            "symbol": {"type": "string", "default": "BTCUSDT"},
            "tf": {"type": "string", "default": "1m"},
            "fast": {"type": "integer", "default": 9, "minimum": 2},
            "slow": {"type": "integer", "default": 21, "minimum": 3},
            "qty": {"type": "number", "default": 0.001, "exclusiveMinimum": 0}
        },
        "required": ["symbol","fast","slow","qty","tf"]
    }

    async def init(self, ctx: StrategyContext, config: dict) -> None:
        self.ctx = ctx
        self.cfg = config
        self.last_fast = None
        self.last_slow = None
        self.position = 0.0

    async def on_start(self) -> None:
        candles = await self.ctx.md.get_ohlcv(self.cfg["symbol"], self.cfg["tf"], limit=max(self.cfg["slow"]*3, 200))
        closes = [c["c"] for c in candles]
        self.last_fast = self._ema(closes, self.cfg["fast"])
        self.last_slow = self._ema(closes, self.cfg["slow"])

    async def on_stop(self) -> None:
        pass

    async def on_tick(self) -> None:
        # Pull last few candles to update EMAs quickly
        candles = await self.ctx.md.get_ohlcv(self.cfg["symbol"], self.cfg["tf"], limit=max(self.cfg["slow"], 50))
        closes = [c["c"] for c in candles]
        fast = self._ema(closes, self.cfg["fast"])
        slow = self._ema(closes, self.cfg["slow"])
        if self.last_fast is None or self.last_slow is None:
            self.last_fast, self.last_slow = fast, slow
            return
        # Cross detection
        crossed_up = self.last_fast <= self.last_slow and fast > slow
        crossed_dn = self.last_fast >= self.last_slow and fast < slow
        self.last_fast, self.last_slow = fast, slow
        if crossed_up and self.position <= 0:
            await self.ctx.trader.place_order({"symbol": self.cfg["symbol"], "side": "buy", "type": "market", "qty": self.cfg["qty"]})
            self.position += self.cfg["qty"]
        elif crossed_dn and self.position >= 0:
            await self.ctx.trader.place_order({"symbol": self.cfg["symbol"], "side": "sell", "type": "market", "qty": self.cfg["qty"]})
            self.position -= self.cfg["qty"]

    async def on_book(self, msg: dict) -> None: ...
    async def on_trade(self, msg: dict) -> None: ...

    def _ema(self, values, period):
        k = 2/(period+1)
        ema = values[0]
        for v in values[1:]:
            ema = v*k + ema*(1-k)
        return ema
