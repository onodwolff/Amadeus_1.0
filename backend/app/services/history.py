import sqlite3, time, threading
from typing import Optional, List, Dict, Any

class HistoryStore:
    def __init__(self, path: str = "history.db"):
        self._path = path
        self._conn: Optional[sqlite3.Connection] = None
        self._lock = threading.Lock()

    def init(self):
        with self._get_conn() as c:
            c.execute("""CREATE TABLE IF NOT EXISTS orders(
                id TEXT, symbol TEXT, side TEXT, qty REAL, price REAL,
                status TEXT, ts REAL
            )""")
            c.execute("""CREATE TABLE IF NOT EXISTS trades(
                id TEXT, order_id TEXT, symbol TEXT, side TEXT, qty REAL, price REAL,
                ts REAL
            )""")
            c.commit()

    def _get_conn(self):
        if self._conn is None:
            self._conn = sqlite3.connect(self._path, check_same_thread=False)
        return self._conn

    def log_order(self, row: Dict[str, Any]):
        with self._lock, self._get_conn() as c:
            c.execute("""INSERT INTO orders(id, symbol, side, qty, price, status, ts)
                         VALUES(?,?,?,?,?,?,?)""",                          (row.get("id"), row.get("symbol"), row.get("side"),
                       row.get("qty"), row.get("price"), row.get("status"),
                       row.get("ts", time.time())))
            c.commit()

    def log_trade(self, row: Dict[str, Any]):
        with self._lock, self._get_conn() as c:
            c.execute("""INSERT INTO trades(id, order_id, symbol, side, qty, price, ts)
                         VALUES(?,?,?,?,?,?,?)""",                          (row.get("id"), row.get("order_id"), row.get("symbol"),
                       row.get("side"), row.get("qty"), row.get("price"),
                       row.get("ts", time.time())))
            c.commit()

    def purge_old(self, retention_days: int):
        cutoff = time.time() - retention_days * 86400
        with self._lock, self._get_conn() as c:
            c.execute("DELETE FROM orders WHERE ts < ?", (cutoff,))
            c.execute("DELETE FROM trades WHERE ts < ?", (cutoff,))
            c.commit()

history = HistoryStore()
