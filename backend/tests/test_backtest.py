from backend.backtest.engine import run_backtest

def test_backtest_basic():
    prices = [100, 101, 102, 99, 100, 103]
    m = run_backtest(prices)
    assert 'sharpe' in m and 'maxdd' in m and 'winrate' in m and 'profit_factor' in m
