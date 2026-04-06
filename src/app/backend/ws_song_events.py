import asyncio
import json
import os

from websockets.asyncio.server import serve


ws_port = os.getenv('ws_port')

CLIENTS = set()


async def broadcast(message: str) -> None:
    if not CLIENTS:
        return
    await asyncio.gather(
        *(client.send(message) for client in list(CLIENTS)),
        return_exceptions=True,
    )


async def handler(websocket):
    CLIENTS.add(websocket)
    try:
        async for raw_message in websocket:
            try:
                payload = json.loads(raw_message)
            except json.JSONDecodeError:
                payload = {"type": "raw", "data": raw_message}

            await broadcast(json.dumps(payload))
    finally:
        CLIENTS.discard(websocket)


async def main() -> None:
    async with serve(handler, "0.0.0.0", ws_port):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
