from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .api.routers import bot, strategies, backtest, ws, config, history, risk
import asyncio, os

app = FastAPI(title="Amadeus Multi-Exchange MVP", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration endpoints (config, defaults, restore)
app.include_router(config.router, prefix="/api")
app.include_router(bot.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")
app.include_router(backtest.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(ws.router, prefix="/api")  # /api/ws

@app.get("/")
def root():
    return {
        "ok": True,
        "service": "amadeus-mvp",
        "name": "Amadeus Multi-Exchange MVP",
    }


LOG_FILE = os.environ.get("LOG_FILE", "bot.log")


@app.websocket("/api/ws/logs")
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
