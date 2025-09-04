from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.api.deps import require_token
from backend.core.db import get_session
from backend.core.keys import set_keys, get_keys as _get_keys

router = APIRouter(prefix="/keys", tags=["keys"])

class KeyBody(BaseModel):
    exchange: str
    category: str = "spot"
    api_key: str
    api_secret: str

@router.post("")
def save_keys(body: KeyBody, session=Depends(get_session), _=Depends(require_token)):
    set_keys(session, body.exchange, body.category, body.api_key, body.api_secret)
    return {"ok": True}

@router.get("")
def get_keys(exchange: str, category: str = "spot", session=Depends(get_session), _=Depends(require_token)):
    creds = _get_keys(session, exchange, category)
    if not creds:
        raise HTTPException(status_code=404, detail="not found")
    # never return secrets; only existence
    return {"exchange": exchange, "category": category, "configured": True}
