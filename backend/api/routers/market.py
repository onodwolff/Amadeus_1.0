from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from backend.api.deps import require_token
from backend.adapters.registry import get_adapter
from backend.core.contracts import OrderBookMsg, TradeMsg

router = APIRouter(prefix="/market", tags=["market"])

@router.get("/ohlcv")
async def get_ohlcv(exchange: str = "mock", category: str = "spot", symbol: str = "BTCUSDT", tf: str = "1m", limit: int = 200, _=Depends(require_token)):
    adapter = get_adapter(exchange, category)
    return [c.model_dump() for c in await adapter.get_ohlcv(symbol, tf, limit=limit)]

@router.websocket("/ws/book")
async def ws_book(ws: WebSocket, exchange: str = Query("mock"), category: str = Query("spot"), symbol: str = Query(...), depth: str = Query("L2")):
    await ws.accept()
    adapter = get_adapter(exchange, category)
    unsub = None
    try:
        async def push(msg: OrderBookMsg):
            await ws.send_json({"type": "book", "exchange": exchange, **msg.model_dump()})
        unsub = await adapter.subscribe_book(symbol, "L2", push)
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if unsub: unsub()

@router.websocket("/ws/trades")
async def ws_trades(ws: WebSocket, exchange: str = Query("mock"), category: str = Query("spot"), symbol: str = Query(...)):
    await ws.accept()
    adapter = get_adapter(exchange, category)
    unsub = None
    try:
        async def push(msg: TradeMsg):
            await ws.send_json({"type":"trade", "exchange": exchange, **msg.model_dump()})
        unsub = await adapter.subscribe_trades(symbol, push)
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if unsub: unsub()
