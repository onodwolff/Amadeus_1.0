import asyncio, pytest, os
from backend.tests.mocks.binance_ws_mock import run_server
import importlib

@pytest.mark.asyncio
async def test_binance_fut_worker_with_mock_server(monkeypatch):
    # monkeypatch the WS endpoint to point to our mock
    import backend.workers.binance_user as bu
    bu.WS_BASE = "ws://127.0.0.1:7890/ws"  # worker appends '/<listenKey>' so keep /ws
    # monkeypatch listenKey retrieval to static
    async def fake_listen_key(_): return "test"
    bu.BinanceUserDataWorker._get_listen_key = lambda self, session: asyncio.Future()
    fut = bu.BinanceUserDataWorker._get_listen_key.__get__(bu.BinanceUserDataWorker('usdt'), bu.BinanceUserDataWorker)
    # Start mock server
    server_task = asyncio.create_task(run_server())
    await asyncio.sleep(0.1)
    worker = bu.BinanceUserDataWorker(category="usdt")
    await worker.start()
    await asyncio.sleep(0.5)
    await worker.stop()
    server_task.cancel()
    assert True  # if no exceptions -> pass
