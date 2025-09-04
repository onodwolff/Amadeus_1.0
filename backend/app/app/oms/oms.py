from __future__ import annotations
from typing import Dict

from ..adapters.base import ExchangeAdapter
from ..paper.executor import PaperExecutor


class OMS:
    def __init__(self, adapters: Dict[str, ExchangeAdapter], mode: str = "paper") -> None:
        self.adapters = adapters
        self.mode = mode
        self.paper = PaperExecutor() if mode == "paper" else None

    async def place_order(self, adapter_id: str, req: dict) -> dict:
        if self.mode == "paper" and self.paper:
            return await self.paper.place_order(req)
        adapter = self.adapters[adapter_id]
        return await adapter.place_order(req)

    async def cancel_order(self, adapter_id: str, id_or_client_id: str) -> dict:
        if self.mode == "paper" and self.paper:
            return await self.paper.cancel_order(id_or_client_id)
        adapter = self.adapters[adapter_id]
        return await adapter.cancel_order(id_or_client_id)
