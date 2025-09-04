from typing import Optional
from sqlmodel import Session, select
from backend.core.models import OrderRow

def find_strategy_by_order_id(session: Session, order_id: str) -> Optional[str]:
    if not order_id: return None
    row = session.exec(select(OrderRow).where(OrderRow.order_id==str(order_id))).first()
    if row and row.strategy_id:
        return row.strategy_id
    return None
