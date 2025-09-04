from backend.core.risk import RiskEngine

def test_risk_forbid_market():
    r = RiskEngine()
    r.set_limits({"forbid_market_orders": True})
    class Req: type='market'; qty=1.0; side='buy'
    d = r.pre_trade_check(req=Req(), open_orders_count=0, current_pos_qty=0.0)
    assert not d.allowed and 'forbidden' in d.reason

def test_risk_active_orders():
    r = RiskEngine()
    r.set_limits({"max_active_orders": 1})
    class Req: type='limit'; qty=1.0; side='buy'
    d_ok = r.pre_trade_check(req=Req(), open_orders_count=0, current_pos_qty=0.0)
    d_bad = r.pre_trade_check(req=Req(), open_orders_count=1, current_pos_qty=0.0)
    assert d_ok.allowed and not d_bad.allowed
