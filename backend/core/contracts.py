from typing import Literal, Callable, Awaitable, Optional, List, Dict, Protocol
from pydantic import BaseModel, Field

DepthLevel = Literal["L2", "L3"]

class OrderBookLevel(BaseModel):
    price: float
    size: float

class OrderBookMsg(BaseModel):
    ts: int
    symbol: str
    bids: List[OrderBookLevel]
    asks: List[OrderBookLevel]
    snapshot: bool = False

class TradeMsg(BaseModel):
    ts: int
    symbol: str
    price: float
    size: float
    side: Literal["buy", "sell"]

class Candle(BaseModel):
    ts: int
    o: float; h: float; l: float; c: float; v: float
    tf: str
    symbol: str

class PlaceOrder(BaseModel):
    symbol: str
    side: Literal["buy", "sell"]
    qty: float
    type: Literal["market","limit"] = "market"
    price: Optional[float] = None
    client_order_id: Optional[str] = None

class OrderAck(BaseModel):
    order_id: str
    client_order_id: Optional[str] = None
    status: Literal["accepted","rejected"] = "accepted"
    reason: Optional[str] = None

class CancelAck(BaseModel):
    order_id: str
    status: Literal["canceled","not_found","already_filled"]

class Order(BaseModel):
    order_id: str
    symbol: str
    side: Literal["buy","sell"]
    qty: float
    price: Optional[float] = None
    status: Literal["new","filled","canceled","partially_filled"] = "new"

class Position(BaseModel):
    symbol: str
    qty: float
    avg_price: float = 0.0

class Balance(BaseModel):
    asset: str
    free: float
    locked: float = 0.0

class SymbolInfo(BaseModel):
    symbol: str
    tick_size: float
    step_size: float
    quote: str = "USDT"
    base: str = Field(default="BTC")

Unsub = Callable[[], None]

class ExchangeAdapter(Protocol):
    id: str
    capabilities: Dict[str,bool]

    async def subscribe_book(self, symbol: str, depth: DepthLevel,
                             cb: Callable[[OrderBookMsg], Awaitable[None]]) -> Unsub: ...
    async def subscribe_trades(self, symbol: str,
                               cb: Callable[[TradeMsg], Awaitable[None]]) -> Unsub: ...
    async def get_ohlcv(self, symbol: str, tf: str, since: Optional[int]=None,
                        limit: Optional[int]=None) -> List[Candle]: ...

    async def place_order(self, req: PlaceOrder) -> OrderAck: ...
    async def cancel_order(self, id_or_client_id: str) -> CancelAck: ...
    async def get_open_orders(self, symbol: Optional[str]=None) -> List[Order]: ...
    async def get_positions(self) -> List[Position]: ...
    async def get_balances(self) -> List[Balance]: ...
    async def get_symbol_info(self, symbol: str) -> SymbolInfo: ...
    def normalize_symbol(self, user_input: str) -> str: ...
