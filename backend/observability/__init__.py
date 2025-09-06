from fastapi import APIRouter

from .otel import setup_otel

router = APIRouter(prefix="/observability", tags=["observability"])


@router.get("/ping")
def ping() -> dict:
    """Simple endpoint for observability checks."""
    return {"ok": True}
