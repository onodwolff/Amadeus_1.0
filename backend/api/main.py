import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    backtest,
    observability,
    risk,
    risk_ext,
    strategies,
    strategy_analytics,
    strategy_export,
    trades,
)

app = FastAPI(title="Amadeus API (patch v12 mega)")

# Configure CORS settings from environment or defaults
ALLOWED_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:4400").split(",")
ALLOWED_METHODS = ["GET", "POST"]
ALLOWED_HEADERS = ["Content-Type"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
)

app.include_router(observability.router, prefix="/api")
app.include_router(trades.router, prefix="/api")
app.include_router(risk_ext.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(backtest.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")
app.include_router(strategy_analytics.router, prefix="/api")
app.include_router(strategy_export.router, prefix="/api")


@app.get("/healthz")
def healthz():
    return {"ok": True}
