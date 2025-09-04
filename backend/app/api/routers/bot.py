from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...services.state import app_state

router = APIRouter()

class StartReq(BaseModel):
    strategy: str = "sample_ema"
    config: dict = {"symbol":"BTCUSDT","tf":"1m","fast":9,"slow":21,"qty":0.001}

@router.get("/status")
async def status():
    return app_state.status()

@router.post("/bot/start")
async def start(req: StartReq):
    if app_state.started:
        raise HTTPException(400, "Already started")
    await app_state.start(req.strategy, req.config)
    return {"ok": True}

@router.post("/bot/stop")
async def stop():
    await app_state.stop()
    return {"ok": True}
