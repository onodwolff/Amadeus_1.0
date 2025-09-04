from typing import Optional
from sqlmodel import Session, select
from .models import CredentialRow
from .crypto import encrypt, decrypt

def set_keys(session: Session, exchange: str, category: str, api_key: str, api_secret: str) -> CredentialRow:
    stmt = select(CredentialRow).where(CredentialRow.exchange==exchange, CredentialRow.category==category)
    row = session.exec(stmt).first()
    if row:
        row.api_key_enc = encrypt(api_key)
        row.api_secret_enc = encrypt(api_secret)
        session.add(row)
    else:
        row = CredentialRow(exchange=exchange, category=category, api_key_enc=encrypt(api_key), api_secret_enc=encrypt(api_secret))
        session.add(row)
    session.commit()
    session.refresh(row)
    return row

def get_keys(session: Session, exchange: str, category: str) -> Optional[tuple[str,str]]:
    stmt = select(CredentialRow).where(CredentialRow.exchange==exchange, CredentialRow.category==category)
    row = session.exec(stmt).first()
    if not row:
        return None
    return decrypt(row.api_key_enc), decrypt(row.api_secret_enc)
