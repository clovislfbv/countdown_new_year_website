import asyncio
import json
import sys
import os

from websockets.asyncio.client import connect


ws_port = os.getenv('ws_port')

async def publish(payload: str) -> None:
    async with connect(f"ws://127.0.0.1:{ws_port}") as websocket:
        await websocket.send(payload)


def main() -> None:
    if len(sys.argv) < 2:
        return

    raw_payload = sys.argv[1]
    try:
        normalized_payload = json.dumps(json.loads(raw_payload))
    except json.JSONDecodeError:
        normalized_payload = json.dumps({"type": "raw", "data": raw_payload})

    asyncio.run(publish(normalized_payload))


if __name__ == "__main__":
    main()
