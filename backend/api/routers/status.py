import os
import time
from fastapi import APIRouter

router = APIRouter(tags=["status"])

_START_TIME = time.time()


@router.get("/status")
def api_status():
    """Return basic health information with uptime and version."""
    uptime = time.time() - _START_TIME
    version = os.getenv("APP_VERSION", "dev")
    return {"ok": True, "uptime": uptime, "version": version}
