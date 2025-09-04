import asyncio, time
from typing import Optional, Dict, Any, Callable
from ..core.config import settings
from .ws import ws_broadcast
from .history import history
from ..adapters.base import ExchangeAdapter
from ..adapters.mock import MockAdapter
from ..adapters.binance import BinanceAdapter
from ..strategies.base import StrategyPlugin, StrategyContext
from ..strategies.sample_ema import SampleEMAStrategy
from ..oms.oms import OMS
from ..paper.executor import PaperExecutor
from ..risk.api import RiskAPI

class AppState:
    def __init__(self) -> None:
        self.started = False
        self.adapter: Optional[ExchangeAdapter] = None
        self.strategy: Optional[StrategyPlugin] = None
        self._task: Optional[asyncio.Task] = None
        self.mode = settings.mode
        self._registry: Dict[str, Callable[[], StrategyPlugin]] = {
            "sample_ema": lambda: SampleEMAStrategy(),
        }

    def _make_adapter(self) -> ExchangeAdapter:
        if settings.exchange == "mock":
            return MockAdapter()
        if settings.exchange == "binance":
            return BinanceAdapter()
        return MockAdapter()

    async def start(self, strategy_name: str, config: Dict[str, Any]):
        if self.started:
            return
        self.adapter = self._make_adapter()
        history.init()
        history.purge_old(retention_days=7)
        risk = RiskAPI()
        paper = PaperExecutor()
        oms = OMS(self.adapter, paper, risk)
        ctx: StrategyContext = type("Ctx", (), {})()
        ctx.md = self.adapter
        ctx.trader = oms
        ctx.risk = risk
        ctx.storage = {}
        ctx.logger = lambda **kw: None
        ctx.emitMetric = lambda name, value, tags=None: None
        ctx.mode = self.mode
        ctx.now = lambda: time.time()

        factory = self._registry.get(strategy_name)
        if not factory:
            raise ValueError(f"Unknown strategy {strategy_name}")
        self.strategy = factory()
        await self.strategy.init(ctx, config)
        await self.strategy.on_start()
        self.started = True
        self._task = asyncio.create_task(self._run_loop())
        await ws_broadcast.broadcast({"type": "diag", "text": f"Strategy {strategy_name} started"})

    async def _run_loop(self):
        try:
            while self.started and self.strategy:
                await self.strategy.on_tick()
                await asyncio.sleep(0.2)
        except Exception as e:
            await ws_broadcast.broadcast({"type": "error", "text": f"Loop error: {e}"})
        finally:
            # ensure stopped
            if self.strategy:
                await self.strategy.on_stop()

    async def stop(self):
        if not self.started:
            return
        self.started = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except Exception:
                pass
        if self.strategy:
            await self.strategy.on_stop()
        await ws_broadcast.broadcast({"type": "diag", "text": "Strategy stopped"})
        self.strategy = None
        self.adapter = None

    def status(self) -> Dict[str, Any]:
        return {
            "started": self.started,
            "mode": self.mode,
            "exchange": settings.exchange,
            "strategy": getattr(self.strategy, "id", None),
        }

app_state = AppState()
