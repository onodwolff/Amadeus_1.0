from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import strategy_export, funding_sync, risk

app = FastAPI(title="Amadeus API (patch v11)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(strategy_export.router, prefix="/api")
app.include_router(funding_sync.router, prefix="/api")
app.include_router(risk.router, prefix="/api")

@app.get("/healthz")
def healthz(): return {"ok": True}
