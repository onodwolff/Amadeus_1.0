import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.observability import router as observability_router
from .routers import (
    backtest,
    risk,
    risk_ext,
    strategies,
    bots,
    strategy_analytics,
    strategy_export,
    trades,
    observability,
    ws_logs,
    dashboard,
    history,
    status,
)

app = FastAPI(title="Amadeus API (patch v12 mega)")

# Configure CORS settings from environment or defaults
ALLOWED_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:4400").split(",")
ALLOWED_METHODS = ["*"]
ALLOWED_HEADERS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
)

app.include_router(status.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(observability_router, prefix="/api")
app.include_router(trades.router, prefix="/api")
app.include_router(risk_ext.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(backtest.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")
app.include_router(bots.router, prefix="/api")
app.include_router(strategy_analytics.router, prefix="/api")
app.include_router(strategy_export.router, prefix="/api")
app.include_router(observability.router, prefix="/api")
app.include_router(ws_logs.router, prefix="/api")


@app.get("/healthz")
def healthz():
    return {"ok": True}
