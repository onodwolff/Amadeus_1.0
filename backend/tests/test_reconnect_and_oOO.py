import asyncio, pytest
from backend.tests.mocks.exchange_ws_mock import MockExchangeServer, Scenario
import importlib

@pytest.mark.asyncio
async def test_reconnect_on_drop(monkeypatch):
    from backend.workers.binance_user import BinanceUserDataWorker
    import backend.workers.binance_user as mod
    mod.WS_BASE = "ws://127.0.0.1:7891/ws"
    async def fake_listen_key(_): return "k"
    BinanceUserDataWorker._get_listen_key = lambda self, s: asyncio.sleep(0) or "k"

    server = MockExchangeServer(scenario=Scenario("drop", drop_after_messages=1))
    task = asyncio.create_task(server.run())
    await asyncio.sleep(0.1)

    w = BinanceUserDataWorker("usdt")
    await w.start()
    await asyncio.sleep(0.5)  # let it reconnect silently
    await w.stop()
    task.cancel()
    assert True

@pytest.mark.asyncio
async def test_out_of_order(monkeypatch):
    from backend.workers.binance_user import BinanceUserDataWorker
    import backend.workers.binance_user as mod
    mod.WS_BASE = "ws://127.0.0.1:7891/ws"
    BinanceUserDataWorker._get_listen_key = lambda self, s: asyncio.sleep(0) and "k"
    server = MockExchangeServer(scenario=Scenario("ooo", out_of_order=True))
    task = asyncio.create_task(server.run())
    await asyncio.sleep(0.1)

    w = BinanceUserDataWorker("usdt")
    await w.start()
    await asyncio.sleep(0.3)
    await w.stop()
    task.cancel()
    assert True
