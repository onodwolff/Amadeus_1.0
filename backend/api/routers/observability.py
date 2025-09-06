import os
import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["observability"])

LOG_FILE = os.environ.get("LOG_FILE", "bot.log")


@router.websocket("/ws/logs")
async def ws_logs(ws: WebSocket):
    await ws.accept()
    try:
        with open(LOG_FILE, "r") as f:
            f.seek(0, os.SEEK_END)
            while True:
                line = f.readline()
                if line:
                    await ws.send_text(line.rstrip())
                else:
                    await asyncio.sleep(0.2)
    except WebSocketDisconnect:
        pass
