import asyncio
from typing import List, Dict, Any

_subscribers: List[asyncio.Queue] = []

def register_queue(q: asyncio.Queue) -> None:
    _subscribers.append(q)

def unregister_queue(q: asyncio.Queue) -> None:
    try:
        _subscribers.remove(q)
    except ValueError:
        pass

async def publish_fill(event: Dict[str, Any]) -> None:
    for q in list(_subscribers):
        try:
            q.put_nowait(event)
        except Exception:
            pass
