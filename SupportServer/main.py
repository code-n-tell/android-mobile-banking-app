"""
FastAPI WebSocket PoC: Single-Agent live chat with in-memory FIFO queue.


Simplified single agent support chat, that polls the queue, when conversation ends, agent connects or customer connects

Run the server with:

    uvicorn main:app --reload --port 8000

"""

import asyncio
import contextlib
import json
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional, Any, List


from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import PlainTextResponse


app = FastAPI(title="WS Chat PoC", version="0.1")


## Data Structure for this FastAPI

@dataclass
class Conversation:
    id: str
    created_at: datetime
    status: str  # 'waiting' | 'active' | 'closed'
    customer_id: str
    agent_id: Optional[str] = None
    transcript: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class Session:
    conv: Conversation
    customer_ws: WebSocket
    agent_ws: Optional[WebSocket] = None
    customer_task: Optional[asyncio.Task] = None
    agent_task: Optional[asyncio.Task] = None


class ChatHub:
    """In-memory state for single-agent chat."""

    def __init__(self) -> None:
        ## Manage concurrency with a lock
        self.lock = asyncio.Lock()
        ## Declare the FIFO queue
        self.waiting_queue: deque[str] = deque()
        self.conversations: Dict[str, Conversation] = {}
        self.sessions: Dict[str, Session] = {}
        self.agent_ws: Optional[WebSocket] = None
        self.agent_id: Optional[str] = None

    async def enqueue_customer(self, conv: Conversation) -> int:
        """ Add conversation ID to queue under lock and returns current position. """
        async with self.lock: ## Automatially releases if theres any error
            self.waiting_queue.append(conv.id)
            position = len(self.waiting_queue)
            return position

    async def assign_next_if_possible(self) -> Optional[str]:
        """If agent present and someone is waiting, assign and return conv_id."""
        async with self.lock:
            agent_ws = self.agent_ws
            if agent_ws is None: ## No Agent available return None
                return None
            if not self.waiting_queue: ## No waiting customers
                return None

            conv_id = self.waiting_queue.popleft() ## Dequeue the next customer
            return conv_id

    async def set_agent(self, ws: WebSocket, agent_id: str) -> None:
        """ Sets agent wwebsocket and ID under lock"""
        async with self.lock:
            self.agent_ws = ws
            self.agent_id = agent_id

    async def clear_agent(self, ws: WebSocket) -> None:
        async with self.lock:
            if self.agent_ws is ws:
                self.agent_ws = None
                self.agent_id = None


# Instantiate the global chathub
hub = ChatHub()


## Helper functions

async def send_json(ws: Optional[WebSocket], payload: Dict[str, Any]) -> None:
    if ws is None:
        return
    ## Serialize and send over websocket as text
    await ws.send_text(json.dumps(payload))


def now_iso() -> str:
    ## Timestamping helper
    return datetime.now(timezone.utc).isoformat()


async def safe_close(ws: Optional[WebSocket]) -> None:
    """Attempt to close a websocket, ignoring errors. Used for cleanup """
    if ws is None:
        return
    try:
        await ws.close()
    except Exception:
        pass


## Core Flow of Server

async def start_relay(session: Session) -> None:
    """Start bidirectional relay tasks for the active session."""

    if session.agent_ws is None:
        # Agent isn't attached yet; wait for proper assignment
        return

    async def pipe(src_ws: WebSocket, dst_ws: WebSocket, sender_role: str) -> None:
        dst_role = "agent" if sender_role == "customer" else "customer"
        while True:
            try:
                raw = await src_ws.receive_text() ## Awaits for text message from Client
                msg = json.loads(raw)
            except WebSocketDisconnect:
                # Source left: end the conversation
                await end_conversation(session.conv.id, reason=f"{sender_role}_left")
                return
            except Exception as e:
                await send_json(src_ws, {"type": "error", "code": "BAD_JSON", "message": str(e)})
                continue


            ## Handles the message to our simple JSON protocol
            mtype = msg.get("type")
            if mtype == "message.send":
                content = (msg.get("content") or "").strip()
                if not content:
                    await send_json(src_ws, {"type": "error", "code": "BAD_REQUEST", "message": "empty content"})
                    continue
                # Build canonical message
                out = {
                    "type": "message.new",
                    "message": {
                        "id": str(uuid.uuid4()), ## Unique message ID for ref later
                        "conversationId": session.conv.id,
                        "sender_role": sender_role,
                        "content": content,
                        "ts": now_iso(),
                    },
                }
                # Append to transcript
                session.conv.transcript.append({
                    "sender_role": sender_role,
                    "content": content,
                    "ts": out["message"]["ts"],
                })
                # Relay to both sides
                try:
                    await send_json(dst_ws, out)
                except Exception:
                    # Partner unreachable -> end conversation
                    await end_conversation(session.conv.id, reason=f"{dst_role}_unreachable")
                    return
                try:
                    await send_json(src_ws, out)
                except Exception:
                    # If echoing back to sender fails, still continue; reading loop will catch disconnect
                    pass

            elif mtype == "end":
                await end_conversation(session.conv.id, reason="closed")
                return
            else:
                await send_json(src_ws, {"type": "error", "code": "BAD_REQUEST", "message": f"unknown type: {mtype}"})

    # Start both directions
    session.customer_task = asyncio.create_task(pipe(session.customer_ws, session.agent_ws, "customer"))
    session.agent_task = asyncio.create_task(pipe(session.agent_ws, session.customer_ws, "agent"))


async def end_conversation(conv_id: str, reason: str) -> None:
    """Close sockets, mark closed, dump transcript, and free agent to next."""
    session = hub.sessions.get(conv_id)
    if session is None:
        return

    # Mark closed & print transcript (hook DB save here later)
    session.conv.status = "closed"
    print("\n==== Conversation closed ====")
    print(f"conv_id={conv_id} reason={reason} at={now_iso()}")
    print(json.dumps(session.conv.transcript, indent=2))
    print("============================\n")

    # Inform both sides
    payload = {"type": "ended", "conversationId": conv_id, "reason": reason}
    for ws in (session.customer_ws, session.agent_ws):
        try:
            await send_json(ws, payload)
        except Exception:
            pass

    # Stop the relay loops before tearing down websockets
    for task in (session.customer_task, session.agent_task):
        if task is not None:
            task.cancel()
    for task in (session.customer_task, session.agent_task):
        if task is not None:
            with contextlib.suppress(asyncio.CancelledError):
                await task
    session.customer_task = None
    session.agent_task = None

    # Close customer socket; agent stays connected unless they left
    await safe_close(session.customer_ws)

    agent_ws = session.agent_ws
    agent_should_close = reason in {"agent_left", "agent_unreachable"}
    if agent_should_close:
        await safe_close(agent_ws)
        if agent_ws is not None:
            await hub.clear_agent(agent_ws)

    # Cleanup
    hub.sessions.pop(conv_id, None)

    # Immediately try to serve next waiting customer
    next_conv_id = await hub.assign_next_if_possible()
    if next_conv_id:
        await do_assign(next_conv_id)


async def do_assign(conv_id: str) -> None:
    """Pair the queued conversation with the current agent and start relaying."""
    async with hub.lock:
        if hub.agent_ws is None:
            # No agent anymore; requeue
            hub.waiting_queue.appendleft(conv_id)
            return

        ## Agent available; assign
        conv = hub.conversations[conv_id]
        conv.status = "active"
        conv.agent_id = hub.agent_id or "agent"
        # Build session
        # For safety, we require the customer_ws to be attached by now via waiting_clients.
        session = hub.sessions.get(conv_id)
        if session is None or session.customer_ws is None:
            # Customer disappeared; skip
            return
        session.agent_ws = hub.agent_ws

    # Notify both sides
    await send_json(session.customer_ws, {
        "type": "assigned",
        "conversationId": conv_id,
        "partner": {"role": "agent", "id": conv.agent_id},
    })
    await send_json(session.agent_ws, {
        "type": "assigned",
        "conversationId": conv_id,
        "partner": {"role": "customer", "id": conv.customer_id},
    })

    # Start relay loops
    await start_relay(session)


# Track customers awaiting assignment: conv_id -> customer websocket
waiting_customers: Dict[str, WebSocket] = {}


# ----------------------------- Endpoints ----------------------------- #

@app.get("/health", response_class=PlainTextResponse)
async def health() -> str:
    return "ok\n"


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, role: str = Query("customer")):
    """
    WebSocket entrypoint.
    - role=customer | agent (no auth yet, add JWT later)
    Other roles are rejected and closed nicely
    """
    await websocket.accept()

    # Send immediate 'ready' with role (conversationId filled after hello for customers)
    await send_json(websocket, {"type": "ready", "role": role, "conversationId": None})

    # Agent path
    if role == "agent":
        agent_id = "agent-1"
        await hub.set_agent(websocket, agent_id)
        try:
            # If anyone is waiting, assign immediately
            conv_id = await hub.assign_next_if_possible()
            if conv_id:
                await do_assign(conv_id)

            # Keep the connection alive; agent receives events in relay
            while True:
                # Agent doesn't need to send 'hello'; just stay connected until disconnect
                await asyncio.sleep(60)
        except WebSocketDisconnect:
            pass
        finally:
            await hub.clear_agent(websocket)
            # End any active sessions with this agent
            for cid, sess in list(hub.sessions.items()):
                if sess.agent_ws is websocket:
                    await end_conversation(cid, reason="agent_left")
            await safe_close(websocket)
        return

    if role != "customer":
        await send_json(websocket, {"type": "error", "code": "BAD_REQUEST", "message": "unknown role"})
        await safe_close(websocket)
        return

    # Customer path
    # Expect a 'hello' from the customer to begin
    try:
        raw = await websocket.receive_text()
        msg = json.loads(raw)
        if msg.get("type") != "hello":
            raise ValueError("first message must be 'hello'")
    except Exception as e:
        await send_json(websocket, {"type": "error", "code": "BAD_REQUEST", "message": str(e)})
        await safe_close(websocket)
        return

    # Create a new conversation and enqueue
    conv_id = str(uuid.uuid4()) ## Randomly creates a unique conversation ID
    conv = Conversation(
        id=conv_id,
        created_at=datetime.now(timezone.utc),
        status="waiting",
        customer_id=str(uuid.uuid4()),  # PoC: random placeholder. Replace with auth.uid later
    )
    hub.conversations[conv_id] = conv

    # Register this customer's socket in a pre-session holder
    session = Session(conv=conv, customer_ws=websocket, agent_ws=None)
    hub.sessions[conv_id] = session ## Throw into dictionary conv_id -> session
    waiting_customers[conv_id] = websocket

    # Acknowledge ready with conversationId
    await send_json(websocket, {"type": "ready", "role": "customer", "conversationId": conv_id})

    position = await hub.enqueue_customer(conv)
    await send_json(websocket, {"type": "queue.update", "position": position})

    # If agent is already available, assign now
    maybe_conv = await hub.assign_next_if_possible()
    if maybe_conv == conv_id:
        await do_assign(conv_id)

    # Keep the customer socket alive until disconnect or session relay ends it
    try:
        while True:
            # When assigned, relay loop will handle incoming messages.
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        # If customer disconnects while waiting
        if conv.status == "waiting":
            # Remove from queue if present
            async with hub.lock:
                try:
                    hub.waiting_queue.remove(conv_id)
                except ValueError:
                    pass
            conv.status = "closed"
            hub.sessions.pop(conv_id, None)
            waiting_customers.pop(conv_id, None)
        else:
            # If active, end the conversation
            await end_conversation(conv_id, reason="customer_left")
    finally:
        await safe_close(websocket)
