from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import market, strategies

app = FastAPI(title="Amadeus API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4400","http://localhost:4200","*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(market.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")

@app.get("/healthz")
def healthz(): return {"ok": True}
