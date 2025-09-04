import os
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from backend.core.db import engine

def setup_otel(app):
    # No explicit exporter config here; use env OTEL_* (OTLP endpoint, service name, etc.)
    try:
        FastAPIInstrumentor.instrument_app(app)
    except Exception:
        pass
    try:
        HTTPXClientInstrumentor().instrument()
    except Exception:
        pass
    try:
        SQLAlchemyInstrumentor().instrument(engine=engine.sync_engine)
    except Exception:
        pass
    try:
        RedisInstrumentor().instrument()
    except Exception:
        pass
