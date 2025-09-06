from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, SQLModel, select

from backend.api.deps import require_token
from backend.core.db import get_session
from backend.core.models import StrategyRow


class StrategyCreate(SQLModel):
    name: str
    config: dict
    risk_policy: str


class StrategyUpdate(SQLModel):
    config: Optional[dict] = None
    risk_policy: Optional[str] = None


router = APIRouter(prefix="/strategies", tags=["strategies"])


@router.get("")
def list_strategies(session: Session = Depends(get_session), _=Depends(require_token)):
    return session.exec(select(StrategyRow)).all()


@router.post("", response_model=StrategyRow)
def create_strategy(
    payload: StrategyCreate,
    session: Session = Depends(get_session),
    _=Depends(require_token),
):
    row = StrategyRow(
        name=payload.name,
        config=payload.config,
        risk_policy=payload.risk_policy,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.put("/{strategy_id}", response_model=StrategyRow)
def update_strategy(
    strategy_id: int,
    payload: StrategyUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_token),
):
    row = session.get(StrategyRow, strategy_id)
    if not row:
        raise HTTPException(status_code=404, detail="Strategy not found")
    if payload.config is not None:
        row.config = payload.config
    if payload.risk_policy is not None:
        row.risk_policy = payload.risk_policy
    row.updated_at = datetime.utcnow()
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/{strategy_id}")
def delete_strategy(
    strategy_id: int,
    session: Session = Depends(get_session),
    _=Depends(require_token),
):
    row = session.get(StrategyRow, strategy_id)
    if not row:
        raise HTTPException(status_code=404, detail="Strategy not found")
    session.delete(row)
    session.commit()
    return {"ok": True}
