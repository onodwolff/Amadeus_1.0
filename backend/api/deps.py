import os, hashlib, json
from fastapi import Header, HTTPException, status, Request
from typing import Optional, List

API_TOKEN = os.getenv("API_TOKEN", "")
# Simple role mapping: API_ROLE or API_TOKENS_JSON='{"token1":"admin","token2":"viewer"}'
API_ROLE = os.getenv("API_ROLE", "admin")
API_TOKENS_JSON = os.getenv("API_TOKENS_JSON", "")

def _roles_map():
    if API_TOKENS_JSON:
        try:
            return json.loads(API_TOKENS_JSON)
        except Exception:
            return {}
    return {API_TOKEN: API_ROLE} if API_TOKEN else {}

class Principal:
    def __init__(self, token: str, role: str):
        self.token = token
        self.role = role
        self.sub = hashlib.sha256(token.encode()).hexdigest()[:16] if token else "anon"

def require_token(authorization: str = Header(default="")) -> Optional[Principal]:
    mapping = _roles_map()
    if not mapping:
        return Principal("", "admin")  # tokens disabled in dev
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    token = authorization.split(" ", 1)[1]
    role = mapping.get(token)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return Principal(token, role)

def require_role(roles: List[str]):
    def _dep(principal: Principal = require_token()):
        if principal.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
        return principal
    return _dep
