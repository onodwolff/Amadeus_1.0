from fastapi import APIRouter
from ...services.history import history

router = APIRouter()

@router.post("/history/purge")
async def purge(days: int = 7):
    history.purge_old(days)
    return {"ok": True, "retention_days": days}
