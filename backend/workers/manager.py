import asyncio
from backend.workers.binance_user import BinanceUserDataWorker

class WorkerManager:
    def __init__(self):
        self.binance = BinanceUserDataWorker(category="usdt")

    async def start(self):
        await self.binance.start()

    async def stop(self):
        await self.binance.stop()

MANAGER = WorkerManager()
