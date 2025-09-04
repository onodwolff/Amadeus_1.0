from __future__ import annotations
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Dict, List, Tuple, Iterable, Optional
import time

@dataclass
class BookLevel:
    px: float
    qty: float

@dataclass
class BookSnapshot:
    ts: int
    bids: List[BookLevel]
    asks: List[BookLevel]

class OrderBookAgg:
    """Incremental L2 aggregator with coalescing + throttle window (e.g., 50–200ms)."""
    def __init__(self, depth: int = 50, window_ms: int = 100):
        self.depth = depth
        self.window_ms = window_ms
        self._bids: Dict[float, float] = defaultdict(float)
        self._asks: Dict[float, float] = defaultdict(float)
        self._last_emit_ms: int = 0
        self._pending = False

    def apply_delta(self, side: str, px: float, qty: float):
        book = self._bids if side == 'bid' else self._asks
        if qty <= 0:
            if px in book: del book[px]
        else:
            book[px] = qty
        self._pending = True

    def _levels(self, book: Dict[float, float], reverse: bool) -> List[BookLevel]:
        items = [(px, q) for px, q in book.items() if q > 0]
        items.sort(key=lambda x: x[0], reverse=reverse)
        return [BookLevel(px, qty) for px, qty in items[:self.depth]]

    def maybe_emit(self, ts_ms: Optional[int] = None) -> Optional[BookSnapshot]:
        now = int(time.time() * 1000) if ts_ms is None else ts_ms
        if not self._pending and now - self._last_emit_ms < self.window_ms:
            return None
        if now - self._last_emit_ms < self.window_ms:
            return None
        self._last_emit_ms = now
        self._pending = False
        return BookSnapshot(
            ts=now,
            bids=self._levels(self._bids, reverse=True),
            asks=self._levels(self._asks, reverse=False),
        )
