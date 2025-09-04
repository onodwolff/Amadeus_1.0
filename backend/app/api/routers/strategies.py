from fastapi import APIRouter
from ...strategies.sample_ema import SampleEMAStrategy

router = APIRouter()

@router.get("/strategies")
async def list_strategies():
    return [{"id": "sample_ema", "schema": SampleEMAStrategy.schema}]
