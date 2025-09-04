import os
from fastapi import Header, HTTPException, status

API_TOKEN = os.getenv("API_TOKEN", "")

def require_token(authorization: str = Header(default="")):
    if not API_TOKEN:
        return  # токен отключён в dev
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    token = authorization.split(" ", 1)[1]
    if token != API_TOKEN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
