import asyncio
import os
from typing import List

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query

from backend.api.deps import require_token

router = APIRouter(prefix="/observability", tags=["observability"])

LOG_PATH = os.getenv("AMADEUS_LOG_PATH", "/var/log/amadeus.log")


async def _read_last_lines(path: str, limit: int) -> List[str]:
    """Read the last ``limit`` lines from ``path`` in a thread to avoid blocking."""

    def _read() -> List[str]:
        try:
            with open(path, "r") as f:
                return f.readlines()[-limit:]
        except FileNotFoundError:
            return []

    lines = await asyncio.to_thread(_read)
    return [line.rstrip("\n") for line in lines]


@router.get("/logs")
async def get_logs(limit: int = Query(100, ge=1, le=1000), _=Depends(require_token)):
    """Return the last ``limit`` lines from the log file without blocking the event loop."""
    return {"lines": await _read_last_lines(LOG_PATH, limit)}


@router.websocket("/logs")
async def ws_logs(ws: WebSocket):
    """Stream log lines to the client using a non-blocking file tail."""
    await ws.accept()
    try:
        if not os.path.exists(LOG_PATH):
            await ws.close(code=1003)
            return

        f = await asyncio.to_thread(open, LOG_PATH, "r")
        try:
            await asyncio.to_thread(f.seek, 0, os.SEEK_END)
            while True:
                line = await asyncio.to_thread(f.readline)
                if line:
                    await ws.send_text(line.rstrip("\n"))
                else:
                    await asyncio.sleep(0.2)
        finally:
            await asyncio.to_thread(f.close)
    except WebSocketDisconnect:
        pass
