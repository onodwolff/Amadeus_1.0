from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import strategy_analytics, dashboard

app = FastAPI(title="Amadeus API (patch v9)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(strategy_analytics.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/healthz")
def healthz(): return {"ok": True}
