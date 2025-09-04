from fastapi import APIRouter, Depends
from sqlmodel import select
from typing import List
from backend.api.deps import require_token
from backend.core.db import get_session
from backend.core.models import OrderRow, FillRow

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("")
def list_orders(limit: int = 100, session=Depends(get_session), _=Depends(require_token)) -> List[OrderRow]:
    stmt = select(OrderRow).order_by(OrderRow.id.desc()).limit(limit)
    return list(session.exec(stmt))

@router.get("/fills")
def list_fills(limit: int = 200, session=Depends(get_session), _=Depends(require_token)) -> List[FillRow]:
    stmt = select(FillRow).order_by(FillRow.id.desc()).limit(limit)
    return list(session.exec(stmt))
