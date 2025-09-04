from __future__ import annotations
from typing import Callable, Dict, Tuple, List

from ..adapters.base import ExchangeAdapter


class MarketDataFeed:
    def __init__(self, adapter: ExchangeAdapter) -> None:
        self.adapter = adapter
        self._book_subs: Dict[Tuple[str, str], Dict[str, object]] = {}
        self._trade_subs: Dict[str, Dict[str, object]] = {}

    async def subscribe_book(self, symbol: str, depth: str, cb: Callable[[dict], None]) -> Callable[[], None]:
        key = (symbol, depth)
        if key not in self._book_subs:
            callbacks: List[Callable[[dict], None]] = []

            def dispatch(msg: dict) -> None:
                for fn in list(callbacks):
                    fn(msg)

            cancel = await self.adapter.subscribe_book(symbol, depth, dispatch)
            self._book_subs[key] = {"callbacks": callbacks, "cancel": cancel}
        self._book_subs[key]["callbacks"].append(cb)

        def unsubscribe() -> None:
            subs = self._book_subs.get(key)
            if not subs:
                return
            subs["callbacks"].remove(cb)
            if not subs["callbacks"]:
                subs["cancel"]()
                del self._book_subs[key]

        return unsubscribe

    async def subscribe_trades(self, symbol: str, cb: Callable[[dict], None]) -> Callable[[], None]:
        key = symbol
        if key not in self._trade_subs:
            callbacks: List[Callable[[dict], None]] = []

            def dispatch(msg: dict) -> None:
                for fn in list(callbacks):
                    fn(msg)

            cancel = await self.adapter.subscribe_trades(symbol, dispatch)
            self._trade_subs[key] = {"callbacks": callbacks, "cancel": cancel}
        self._trade_subs[key]["callbacks"].append(cb)

        def unsubscribe() -> None:
            subs = self._trade_subs.get(key)
            if not subs:
                return
            subs["callbacks"].remove(cb)
            if not subs["callbacks"]:
                subs["cancel"]()
                del self._trade_subs[key]

        return unsubscribe
