from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from ...core.config import settings
from ...deps import auth_dep
from ...models.schemas import ConfigEnvelope
from ...services.configuration import ConfigService


# Require authentication for all configuration endpoints
router = APIRouter(dependencies=[Depends(auth_dep)])


# In-memory configuration store
_cfg_service = ConfigService({"mode": settings.mode, "exchange": settings.exchange})
_saved_cfg: Dict[str, Any] = _cfg_service.cfg.copy()
_default_cfg: Dict[str, Any] = _cfg_service.cfg.copy()


@router.get("/config", response_model=ConfigEnvelope)
async def get_config() -> ConfigEnvelope:
    """Return current runtime configuration."""
    return ConfigEnvelope(cfg=_cfg_service.cfg)


@router.get("/config/default", response_model=ConfigEnvelope)
async def get_default_config() -> ConfigEnvelope:
    """Return default configuration."""
    return ConfigEnvelope(cfg=_default_cfg)


@router.put("/config")
@router.post("/config")
async def save_config(request: Request) -> ConfigEnvelope:
    """Save provided configuration. Accepts JSON wrapper or raw string."""
    try:
        data: Any = await request.json()
    except Exception:
        raw = await request.body()
        data = raw.decode()

    cfg_payload: Any
    if isinstance(data, dict) and "cfg" in data:
        cfg_payload = data["cfg"]
    else:
        cfg_payload = data

    new_cfg = _cfg_service.set_cfg(cfg_payload)
    global _saved_cfg
    _saved_cfg = new_cfg.copy()
    return ConfigEnvelope(cfg=new_cfg)


@router.post("/config/restore", response_model=ConfigEnvelope)
async def restore_config() -> ConfigEnvelope:
    """Restore last saved configuration."""
    _cfg_service.set_cfg(_saved_cfg)
    return ConfigEnvelope(cfg=_cfg_service.cfg)
