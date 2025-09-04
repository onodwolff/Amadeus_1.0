from typing import Dict
from backend.adapters.mock import MockAdapter
from backend.adapters.bybit import BybitAdapter
from backend.core.contracts import ExchangeAdapter

_registry: Dict[str, ExchangeAdapter] = {}

def get_adapter(exchange: str, category: str = "spot") -> ExchangeAdapter:
    key = f"{exchange}:{category}"
    if key in _registry:
        return _registry[key]
    if exchange == "mock":
        _registry[key] = MockAdapter()
    elif exchange == "bybit":
        _registry[key] = BybitAdapter(category=category)
    else:
        raise ValueError(f"Unknown exchange: {exchange}")
    return _registry[key]
