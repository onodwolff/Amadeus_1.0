import asyncio, json, websockets

async def handler(websocket):
    # send one executionReport after 0.1s
    await asyncio.sleep(0.1)
    msg = {
        "e":"ORDER_TRADE_UPDATE",
        "E": 1710000000000,
        "o": {
            "s":"BTCUSDT","S":"BUY","i":123456,"L":"50000.0","l":"0.001","X":"FILLED","n":"0.01"
        }
    }
    await websocket.send(json.dumps(msg))
    await asyncio.sleep(0.1)
    await websocket.close()

async def run_server(host="127.0.0.1", port=7890):
    async with websockets.serve(handler, host, port):
        await asyncio.Future()
