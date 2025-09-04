from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from .routers import market, strategies, risk, portfolio, orders
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from backend.core.db import create_db_and_tables

app = FastAPI(title="Amadeus API")

# Prometheus metrics
REQS = Counter("amadeus_requests_total", "Total HTTP requests", ["route","method"])
LAT = Histogram("amadeus_request_latency_seconds", "Request latency", ["route","method"])

@app.on_event("startup")
def _startup():
    create_db_and_tables()

@app.middleware("http")
async def metrics_mw(request, call_next):
    route = request.url.path.split("?")[0]
    method = request.method
    with LAT.labels(route, method).time():
        response = await call_next(request)
    REQS.labels(route, method).inc()
    return response

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4400","http://localhost:4200","*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(market.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(orders.router, prefix="/api")

@app.get("/healthz")
def healthz(): return {"ok": True}
