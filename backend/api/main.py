from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from .routers import market, strategies, risk, portfolio, orders, backtest, keys, dashboard, analytics, auth
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from backend.core.db import create_db_and_tables
from backend.workers.manager import MANAGER
from backend.core.models import AuditLog
from backend.core.db import get_session
from backend.api.deps import require_token, Principal

app = FastAPI(title="Amadeus API")

# Prometheus metrics
REQS = Counter("amadeus_requests_total", "Total HTTP requests", ["route","method"])
LAT = Histogram("amadeus_request_latency_seconds", "Request latency", ["route","method"])

@app.on_event("startup")
async def _startup():
    create_db_and_tables()
    try:
        await MANAGER.start()
    except Exception:
        pass

@app.on_event("shutdown")
async def _shutdown():
    try:
        await MANAGER.stop()
    except Exception:
        pass

@app.middleware("http")
async def metrics_audit_mw(request: Request, call_next):
    route = request.url.path.split("?")[0]
    method = request.method
    principal: Principal | None = None
    try:
        # try resolve principal (best-effort)
        auth_header = request.headers.get("authorization","")
        from .deps import require_token as _rt, Principal as _P
        try:
            principal = _rt(auth_header)  # may raise
        except Exception:
            principal = _P("", "dev")
    except Exception:
        pass
    with LAT.labels(route, method).time():
        response = await call_next(request)
    REQS.labels(route, method).inc()
    # audit
    try:
        from sqlmodel import Session
        with Session(get_session.__self__.engine) if hasattr(get_session, "__self__") else next(get_session()) as s:
            s.add(AuditLog(route=route, method=method, actor=(principal.sub if principal else "anon"), status=response.status_code, extra={"ip": request.client.host if request.client else ""}))
            s.commit()
    except Exception:
        pass
    return response

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4400","http://localhost:4200","*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")  # rbac test routes
app.include_router(market.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(backtest.router, prefix="/api")
app.include_router(keys.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/healthz")
def healthz(): return {"ok": True}
