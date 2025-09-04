from fastapi import APIRouter
from ...core.config import settings

router = APIRouter()

@router.get("/config")
async def get_config():
    return {"mode": settings.mode, "exchange": settings.exchange}
