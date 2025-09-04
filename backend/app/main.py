from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routers import bot, strategies, backtest, ws, config, history, risk

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
app.include_router(ws.router)  # /ws

@app.get("/")
def root():
    return {"ok": True, "service": "amadeus-mvp"}
