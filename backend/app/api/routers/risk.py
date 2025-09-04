from fastapi import APIRouter
router = APIRouter()

@router.get("/risk/status")
async def risk_status():
    return {"ok": True, "limits": {}, "blocked": False}
