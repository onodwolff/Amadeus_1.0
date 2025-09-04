class RiskAPI:
    def __init__(self) -> None:
        # minimal allow-all with one knob: block market sells above qty for demo
        self.max_qty = None

    def check(self, order_req: dict):
        # Simple demo: always allow
        return True, None
