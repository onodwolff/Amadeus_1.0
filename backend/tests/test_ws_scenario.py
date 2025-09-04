import asyncio, pytest
from backend.adapters.mock import MockAdapter
from backend.core.contracts import OrderBookMsg, TradeMsg

@pytest.mark.asyncio
async def test_mock_adapter_streams():
    adapter = MockAdapter()
    got_book = asyncio.Event()
    got_trade = asyncio.Event()

    async def on_book(msg: OrderBookMsg):
        got_book.set()
    async def on_trade(msg: TradeMsg):
        got_trade.set()

    ub = await adapter.subscribe_book("BTCUSDT", "L2", on_book)
    ut = await adapter.subscribe_trades("BTCUSDT", on_trade)
    try:
        await asyncio.wait_for(got_book.wait(), timeout=2.0)
        await asyncio.wait_for(got_trade.wait(), timeout=2.0)
    finally:
        ub(); ut()
