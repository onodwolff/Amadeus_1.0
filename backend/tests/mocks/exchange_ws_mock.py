import asyncio, json, websockets
from dataclasses import dataclass

@dataclass
class Scenario:
    name: str
    drop_after_messages: int = 0
    rate_limit_after: int = 0
    out_of_order: bool = False

class MockExchangeServer:
    def __init__(self, host="127.0.0.1", port=7891, scenario: Scenario = Scenario("default")):
        self.host = host; self.port = port; self.scenario = scenario
        self._n = 0

    async def _handler(self, websocket):
        # send two messages, optionally out-of-order
        async def send_msg(i, px, qty):
            msg = {"e":"ORDER_TRADE_UPDATE","E":1710000000000+i,"o":{"s":"BTCUSDT","S":"BUY","i":123456+i,"L":str(px),"l":str(qty),"X":"FILLED","n":"0.01"}}
            await websocket.send(json.dumps(msg))
        if self.scenario.out_of_order:
            await send_msg(2, 50005.0, 0.001)
            await send_msg(1, 50000.0, 0.001)
        else:
            await send_msg(1, 50000.0, 0.001)
            await send_msg(2, 50005.0, 0.001)
        self._n += 2
        if self.scenario.rate_limit_after and self._n >= self.scenario.rate_limit_after:
            await websocket.send(json.dumps({"code":429, "msg":"rate limit"}))
        if self.scenario.drop_after_messages and self._n >= self.scenario.drop_after_messages:
            await asyncio.sleep(0.05)
            await websocket.close()

    async def run(self):
        async with websockets.serve(self._handler, self.host, self.port):
            await asyncio.Future()
