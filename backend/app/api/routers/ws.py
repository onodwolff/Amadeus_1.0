from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from ...services.ws import ws_broadcast

router = APIRouter()

@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await ws_broadcast.register(websocket)
    try:
        while True:
            # keep connection alive; ignore incoming
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_broadcast.unregister(websocket)
