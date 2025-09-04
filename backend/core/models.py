from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON
from datetime import datetime

class OrderRow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: str
    client_order_id: Optional[str] = None
    symbol: str
    side: str
    qty: float
    price: Optional[float] = None
    status: str = "new"
    exchange: str = "mock"
    category: str = "spot"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FillRow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: str
    symbol: str
    price: float
    qty: float
    side: str
    exchange: str = "mock"
    category: str = "spot"
    ts: int  # ms timestamp
    meta: dict = Field(sa_column=Column(JSON), default_factory=dict)

class PositionRow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str
    qty: float = 0.0
    avg_price: float = 0.0
    exchange: str = "mock"
    category: str = "spot"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BalanceRow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    asset: str
    free: float
    locked: float = 0.0
    exchange: str = "mock"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CredentialRow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exchange: str
    category: str = "spot"
    api_key_enc: str
    api_secret_enc: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ts: datetime = Field(default_factory=datetime.utcnow)
    route: str
    method: str
    actor: str  # hashed token id
    status: int
    extra: dict = Field(sa_column=Column(JSON), default_factory=dict)
