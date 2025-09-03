import time
from backend.app.services.risk.manager import RiskManager


def test_mdd_lock_and_unlock():
    cfg = {"risk": {"max_drawdown_pct": 10, "dd_window_sec": 1, "stop_duration_sec": 60}}
    rm = RiskManager(cfg)
    t = time.time()
    rm.on_equity(100.0, ts=t)
    rm.on_equity(80.0, ts=t + 0.5)
    allowed, reason = rm.can_enter()
    assert not allowed
    assert "MaxDrawdown lock" in reason
    rm.unlock()
    rm.on_equity(100.0, ts=t + 1.6)  # past window, restoring equity
    allowed, _ = rm.can_enter()
    assert allowed


def test_trade_cooldown(monkeypatch):
    cfg = {"risk": {"cooldown_sec": 10}}
    rm = RiskManager(cfg)
    base = time.time()
    rm.on_trade_closed(1.0, ts=base)
    allowed, reason = rm.can_enter()
    assert not allowed and "Cooldown" in reason
    monkeypatch.setattr(time, "time", lambda: base + 11)
    allowed, _ = rm.can_enter()
    assert allowed


def test_max_base_ratio_blocks_buy():
    cfg = {"risk": {"max_base_ratio": 0.5}}
    rm = RiskManager(cfg)
    rm.on_equity(100.0)
    rm.on_position(base_qty=1.0, price=60.0, entry_price=60.0)
    allowed, reason = rm.can_enter()
    assert not allowed and "Base ratio" in (reason or "")


def test_max_loss_limits():
    cfg = {"risk": {"max_loss_pct": 10, "max_loss_usd": 5}}
    rm = RiskManager(cfg)
    rm.on_equity(100.0)
    rm.on_position(base_qty=1.0, price=90.0, entry_price=100.0)
    allowed, reason = rm.can_enter()
    assert not allowed and "Loss" in (reason or "")
