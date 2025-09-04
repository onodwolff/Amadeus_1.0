from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from backend.api.deps import require_token
from backend.adapters.mock import MockAdapter
from backend.core.contracts import OrderBookMsg, TradeMsg
import asyncio

router = APIRouter(prefix="/market", tags=["market"])
adapter = MockAdapter()  # можно заменить фабрикой реальных адаптеров

@router.get("/ohlcv")
async def get_ohlcv(symbol: str, tf: str = "1m", limit: int = 200, _=Depends(require_token)):
    return [c.model_dump() for c in await adapter.get_ohlcv(symbol, tf, limit=limit)]

@router.websocket("/ws/book")
async def ws_book(ws: WebSocket, symbol: str = Query(...), depth: str = Query("L2")):
    await ws.accept()
    unsub = None
    try:
        async def push(msg: OrderBookMsg):
            await ws.send_json({"type": "book", **msg.model_dump()})
        unsub = await adapter.subscribe_book(symbol, "L2", push)
        while True:
            await ws.receive_text()  # пинги
    except WebSocketDisconnect:
        pass
    finally:
        if unsub: unsub()

@router.websocket("/ws/trades")
async def ws_trades(ws: WebSocket, symbol: str = Query(...)):
    await ws.accept()
    unsub = None
    try:
        async def push(msg: TradeMsg):
            await ws.send_json({"type":"trade", **msg.model_dump()})
        unsub = await adapter.subscribe_trades(symbol, push)
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if unsub: unsub()
