import asyncio
from backend.workers.binance_user import BinanceUserDataWorker
from backend.workers.binance_spot_user import BinanceSpotUserDataWorker
from backend.workers.bybit_user import BybitUserDataWorker

class WorkerManager:
    def __init__(self):
        self.binance_usdt = BinanceUserDataWorker(category="usdt")
        self.binance_spot = BinanceSpotUserDataWorker()
        self.bybit_linear = BybitUserDataWorker(category="linear")

    async def start(self):
        await self.binance_usdt.start()
        await self.binance_spot.start()
        await self.bybit_linear.start()

    async def stop(self):
        await self.binance_usdt.stop()
        await self.binance_spot.stop()
        await self.bybit_linear.stop()

MANAGER = WorkerManager()
