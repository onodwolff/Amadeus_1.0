from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import trades, risk_ext, backtest

app = FastAPI(title="Amadeus API (patch v12 mega)")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(trades.router, prefix="/api")
app.include_router(risk_ext.router, prefix="/api")
app.include_router(backtest.router, prefix="/api")

@app.get("/healthz")
def healthz(): return {"ok": True}
