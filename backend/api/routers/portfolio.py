from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlmodel import select
from backend.api.deps import require_token
from backend.core.db import get_session
from backend.core.models import BalanceRow, PositionRow, FillRow
from backend.core.events import register_queue, unregister_queue
import asyncio

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

@router.get("/balances")
def get_balances(session=Depends(get_session), _=Depends(require_token)):
    stmt = select(BalanceRow).order_by(BalanceRow.asset.asc())
    return list(session.exec(stmt))

@router.get("/positions")
def get_positions(session=Depends(get_session), _=Depends(require_token)):
    stmt = select(PositionRow).order_by(PositionRow.symbol.asc())
    return list(session.exec(stmt))

@router.websocket("/ws/fills")
async def ws_fills(ws: WebSocket):
    await ws.accept()
    q: asyncio.Queue = asyncio.Queue(maxsize=1000)
    register_queue(q)
    try:
        while True:
            evt = await q.get()
            await ws.send_json({"type":"fill", **evt})
    except WebSocketDisconnect:
        pass
    finally:
        unregister_queue(q)
