## To start a single-agent CLI, run:
##   python agent_cli.py --url ws://localhost:8000/ws ##
##   python3 agent_cli.py --url wss://deviation-addressing-adjust-trying.trycloudflare.com/ws
## Replace the URL with your own WebSocket endpoint.


import asyncio
import json
import sys
import argparse ## For command-line argument parsing
from datetime import datetime
from datetime import timezone
import contextlib

import websockets


def ts_short():
    """ For timestammping use"""
    return datetime.now(timezone.utc).strftime("%H:%M:%S")


async def stdin_reader(queue: asyncio.Queue[str]):
    ## Get currently running loop, to schedule running tasks
    loop = asyncio.get_running_loop()
    while True:
        ## This will ensure blocking the readline doesnt block the main loop
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if line == "":
            await queue.put("/quit")
            break
        await queue.put(line.rstrip("\n"))


## Run the agent CLI with given URL
async def agent_cli(url: str):
    ## Append the role=agent if not present in the websocket provided
    sep = "&" if "?" in url else "?"
    if "role=" not in url:
        url = f"{url}{sep}role=agent"

    print(f"[cli] Connecting to {url} ...")

    async with websockets.connect(url) as ws:
        raw = await ws.recv()
        try:
            msg = json.loads(raw)
        except Exception:
            print("[cli] Unexpected non-JSON from server:", raw)
            return
        if msg.get("type") != "ready" or msg.get("role") != "agent":
            print("[cli] Unexpected greeting:", msg)
            return

        print("[cli] Connected as AGENT. Waiting for assignment…")
        current_conv: str | None = None

        ## stdin will push typed lines into here, FIFO
        inbox_q: asyncio.Queue[str] = asyncio.Queue()
        stdin_task = asyncio.create_task(stdin_reader(inbox_q))

        ## This has to run concurrently with the stdin loop
        async def ws_recv_loop():
            nonlocal current_conv
            while True:
                raw_in = await ws.recv()
                try:
                    data = json.loads(raw_in)
                except Exception:
                    print("[srv] (non-JSON)", raw_in)
                    continue

                t = data.get("type")
                ## Handling assigned messages sent in do_assign() in main.py
                if t == "assigned":
                    current_conv = data.get("conversationId")
                    partner = data.get("partner", {})
                    print(f"[{ts_short()}] Assigned conversation: {current_conv} (partner={partner.get('role')})")
                    print("Type your reply. Use /end to finish, /quit to exit.")
                elif t == "message.new":
                    m = data.get("message", {})
                    role = m.get("sender_role")
                    content = m.get("content")
                    print(f"[{ts_short()}] {role}: {content}")
                elif t == "ended":
                    reason = data.get("reason")
                    print(f"[{ts_short()}] Conversation ended (reason={reason}). Waiting for next assignment…")
                    current_conv = None
                elif t == "error":
                    print(f"[srv:ERROR] {data}")
                else:
                    pass

        ## Initialise the websocket receiving loop
        ws_task = asyncio.create_task(ws_recv_loop())


        ## Inbox processing
        try:
            while True:
                line = await inbox_q.get()
                if line.strip() == "":
                    continue
                if line.strip().lower() == "/quit":
                    print("[cli] Quitting…")
                    break
                if line.strip().lower() == "/end":
                    if current_conv is None:
                        print("[cli] No active conversation.")
                        continue
                    await ws.send(json.dumps({
                        "type": "end",
                        "conversationId": current_conv,
                    }))
                    continue

                if current_conv is None:
                    print("[cli] Not assigned yet. Your message will be ignored. Use /quit to exit.")
                    continue

                payload = {
                    "type": "message.send",
                    "conversationId": current_conv,
                    "content": line,
                }
                await ws.send(json.dumps(payload))
        except websockets.ConnectionClosed as e:
            print(f"[cli] Connection closed: {e}")
        finally:
            ws_task.cancel()
            stdin_task.cancel()
            with contextlib.suppress(Exception):
                await ws.close()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Single-agent chat CLI")
    parser.add_argument("--url", default="ws://localhost:8000/ws", help="WebSocket endpoint")
    args = parser.parse_args()

    try:
        asyncio.run(agent_cli(args.url))
    except KeyboardInterrupt:
        print("[cli] Interrupted.")
