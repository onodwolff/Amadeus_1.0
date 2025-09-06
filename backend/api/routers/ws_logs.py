from fastapi import APIRouter, WebSocket
from .observability import ws_logs as _ws_logs

router = APIRouter()

@router.websocket("/ws/logs")
async def ws_logs(ws: WebSocket):
    await _ws_logs(ws)
