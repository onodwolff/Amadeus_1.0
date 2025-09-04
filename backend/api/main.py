from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import strategy_analytics
from backend.workers.manager import MANAGER

app = FastAPI(title="Amadeus API (patch v8)")

@app.on_event("startup")
async def _startup():
    try:
        await MANAGER.start()
    except Exception:
        pass

@app.on_event("shutdown")
async def _shutdown():
    try:
        await MANAGER.stop()
    except Exception:
        pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(strategy_analytics.router, prefix="/api")

@app.get("/healthz")
def healthz(): return {"ok": True}
