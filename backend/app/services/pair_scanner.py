from __future__ import annotations
import asyncio
import logging
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Protocol


class BinanceClientProtocol(Protocol):
    async def get_exchange_info(self) -> Dict[str, Any]:
        ...

    async def get_ticker(self, symbol: str) -> Dict[str, Any]:
        ...

    async def get_orderbook_ticker(self, symbol: str) -> Dict[str, Any]:
        ...

    async def get_klines(self, symbol: str, interval: str, limit: int) -> List[Any]:
        ...

log = logging.getLogger(__name__)

@dataclass
class PairScore:
    symbol: str
    bid: float
    ask: float
    spread_bps: float
    vol_usdt_24h: float
    vol_bps_1m: float
    score: float

def _bps(x: float) -> float:
    return x * 10_000.0

async def _get_24h(client: BinanceClientProtocol, symbol: str) -> Optional[Dict[str, Any]]:
    try:
        return await client.get_ticker(symbol=symbol)
    except Exception as e:
        log.debug("24h fail %s: %s", symbol, e)
        return None

async def _get_book(client: BinanceClientProtocol, symbol: str) -> Optional[Dict[str, Any]]:
    try:
        return await client.get_orderbook_ticker(symbol=symbol)
    except Exception as e:
        log.debug("bookTicker fail %s: %s", symbol, e)
        return None

async def _get_klines_vol_bps(client: BinanceClientProtocol, symbol: str, bars: int) -> float:
    if bars <= 1:
        return 0.0
    try:
        ks = await client.get_klines(symbol=symbol, interval="1m", limit=bars)
        mids: List[float] = []
        for ohlc in ks:
            h, l, c = float(ohlc[2]), float(ohlc[3]), float(ohlc[4])
            mids.append(0.5 * (h + l) if h > 0 and l > 0 else c)
        if len(mids) < 2:
            return 0.0
        acc = 0.0
        for i in range(1, len(mids)):
            prev, cur = mids[i - 1], mids[i]
            if prev > 0:
                acc += abs(cur - prev) / prev
        return _bps(acc / max(1, len(mids) - 1))
    except Exception as e:
        log.debug("klines fail %s: %s", symbol, e)
        return 0.0

async def _gather_limited(coros, limit: int = 20):
    sem = asyncio.Semaphore(limit)
    async def wrap(coro):
        async with sem:
            return await coro
    return await asyncio.gather(*[wrap(c) for c in coros], return_exceptions=True)

async def _scan_impl(cfg: Dict[str, Any], client: BinanceClientProtocol) -> Dict[str, Any]:
    sc = cfg.get("scanner", {})
    paper = bool(cfg.get("api", {}).get("paper", False))
    quote = sc.get("quote", "USDT")
    min_price = float(sc.get("min_price", 0.0001))
    min_vol_usdt = float(sc.get("min_vol_usdt_24h", 0 if paper else 3_000_000))
    top_by_volume = int(sc.get("top_by_volume", 120))
    max_pairs = int(sc.get("max_pairs", 60))
    min_spread_bps = float(sc.get("min_spread_bps", 0.0 if paper else 5.0))
    vol_bars = int(sc.get("vol_bars", 0))
    w_spread = float(sc.get("score", {}).get("w_spread", 1.0))
    w_vol = float(sc.get("score", {}).get("w_vol", 0.3))
    whitelist = sc.get("whitelist") or []
    blacklist = set(sc.get("blacklist") or [])

    ex = await client.get_exchange_info()
    symbols = []
    for s in ex["symbols"]:
        try:
            if s["status"] != "TRADING":
                continue
            if s.get("quoteAsset") != quote:
                continue
            sym = s["symbol"]
            if whitelist and sym not in whitelist:
                continue
            if sym in blacklist:
                continue
            if s.get("isSpotTradingAllowed") is False:
                continue
            symbols.append(sym)
        except Exception:
            continue

    if not symbols:
        raise RuntimeError("Scanner: no candidates (filters too strict?)")

    symbols = symbols[: max_pairs * 2]
    t24s = await _gather_limited([_get_24h(client, s) for s in symbols], limit=20)
    vols = {}
    for s, t in zip(symbols, t24s):
        if not isinstance(t, dict):
            continue
        try:
            qv = float(t.get("quoteVolume") or 0.0)
            lp = float(t.get("lastPrice") or 0.0)
            if lp >= min_price and qv >= min_vol_usdt:
                vols[s] = qv
        except Exception:
            log.exception("Failed to process volume info for %s", s)

    top_syms = [kv[0] for kv in sorted(vols.items(), key=lambda kv: kv[1], reverse=True)[:top_by_volume]]
    if not top_syms:
        raise RuntimeError("Scanner: no pairs with lastPrice/volume thresholds")

    books = await _gather_limited([_get_book(client, s) for s in top_syms], limit=30)
    candidates = []
    for s, b in zip(top_syms, books):
        if not isinstance(b, dict):
            continue
        try:
            bid = float(b["bidPrice"]); ask = float(b["askPrice"])
            if bid <= 0 or ask <= 0 or ask <= bid:
                continue
            spread_bps = _bps((ask - bid) / bid)
            if spread_bps < min_spread_bps:
                continue
            candidates.append((s, bid, ask, spread_bps, vols.get(s, 0.0)))
        except Exception:
            continue

    if not candidates:
        raise RuntimeError("Scanner: no pairs with spread >= min_spread_bps")

    vol_bps_map = {s: 0.0 for s, *_ in candidates}
    if vol_bars > 1:
        vols2 = await _gather_limited([_get_klines_vol_bps(client, s, vol_bars) for s, *_ in candidates], limit=10)
        for (s, *_), vb in zip(candidates, vols2):
            try:
                vol_bps_map[s] = float(vb) if vb and vb == vb else 0.0
            except Exception:
                vol_bps_map[s] = 0.0

    scored: List[PairScore] = []
    for (s, bid, ask, spr_bps, qv) in candidates:
        vb = vol_bps_map.get(s, 0.0)
        score = w_spread * spr_bps + w_vol * vb
        scored.append(PairScore(symbol=s, bid=bid, ask=ask, spread_bps=spr_bps,
                                vol_usdt_24h=qv, vol_bps_1m=vb, score=score))
    scored.sort(key=lambda x: x.score, reverse=True)
    best = scored[0]
    top_list = [x.__dict__ for x in scored[:10]]
    return {"best": best.__dict__, "top": top_list}

async def scan_best_symbol(cfg: Dict[str, Any], client: BinanceClientProtocol) -> Dict[str, Any]:
    return await _scan_impl(cfg, client)

class PairScanner:
    def __init__(self, cfg: Dict[str, Any], client: BinanceClientProtocol):
        self.cfg = cfg; self.client = client

    async def pick_best(self) -> Dict[str, Any]:
        return await _scan_impl(self.cfg, self.client)
