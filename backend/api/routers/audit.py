from fastapi import APIRouter, Depends
from sqlmodel import select
from backend.api.deps import require_role, Principal
from backend.core.db import get_session
from backend.core.models import AuditLog

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("")
def list_audit(limit: int = 200, session=Depends(get_session), _=Depends(require_role(["admin"]))):
    stmt = select(AuditLog).order_by(AuditLog.id.desc()).limit(limit)
    return list(session.exec(stmt))
