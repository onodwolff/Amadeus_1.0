import os
from typing import Generator
from sqlmodel import SQLModel, create_engine, Session

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "amadeus")
DB_PASSWORD = os.getenv("DB_PASSWORD", "amadeus")
DB_NAME = os.getenv("DB_NAME", "amadeus")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

def create_db_and_tables() -> None:
    from .models import OrderRow, FillRow, PositionRow, BalanceRow  # noqa
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
