from typing import Set
from fastapi import WebSocket
import asyncio

class WSBroadcaster:
    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def register(self, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            self._clients.add(ws)

    async def unregister(self, ws: WebSocket):
        async with self._lock:
            if ws in self._clients:
                self._clients.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        async with self._lock:
            for ws in list(self._clients):
                try:
                    await ws.send_json(data)
                except Exception:
                    dead.append(ws)
            for d in dead:
                self._clients.discard(d)

ws_broadcast = WSBroadcaster()
