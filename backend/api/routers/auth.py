from fastapi import APIRouter, Depends
from backend.api.deps import require_role, Principal

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/whoami")
def whoami(principal: Principal = Depends(require_role(["admin","trader","viewer"]))):
    return {"role": principal.role, "sub": principal.sub}
