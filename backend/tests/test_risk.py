from backend.core.risk import RiskEngine


def test_risk_drawdown_limit():
    r = RiskEngine()
    r.set_policy("default", max_dd=0.1)
    d = r.pre_trade_check(
        strategy_id="default", open_orders_count=0, current_drawdown=0.15
    )
    assert not d.allowed and d.reason == "max_dd"


def test_risk_active_orders():
    r = RiskEngine()
    r.set_policy("default", max_active_orders=1)
    d_ok = r.pre_trade_check(
        strategy_id="default", open_orders_count=1, current_drawdown=0.0
    )
    d_bad = r.pre_trade_check(
        strategy_id="default", open_orders_count=2, current_drawdown=0.0
    )
    assert d_ok.allowed and not d_bad.allowed and d_bad.reason == "max_active_orders"
