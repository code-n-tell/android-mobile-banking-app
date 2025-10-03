# LiveChatSupport

A simple, single-agent live chat support system built with FastAPI and Python websockets. This project allows a support agent to handle customer chats in real time via a terminal-based CLI, with optional Docker and Cloudflare support for secure deployments.

> Commands ran below are from MacOS environment, use the Windows commands / installers equivalent if on Windows

---

## 📦 Repository

GitHub: [nictjh/LiveChatSupport](https://github.com/nictjh/LiveChatSupport)

---

## 🚀 Quick Start

### 1. Clone the Repository

```sh
git clone https://github.com/nictjh/LiveChatSupport.git
cd LiveChatSupport
```

---

### 2. Running with Docker (Recommended)

#### Build and Start

```sh
docker compose up --build
```

- This will build and start both the FastAPI server and the agent CLI in containers.
- The default WebSocket endpoint will be available at `ws://localhost:8000/ws`.

---

### 3. Running Locally (Without Docker)

#### Install Requirements

It is recommended to use a virtual environment:

```sh
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Start the FastAPI Server

In **Terminal 1**:

```sh
uvicorn main:app --reload --port 8000
```

#### Start the Agent CLI

In **Terminal 2**:

```sh
python agent_cli.py --url ws://localhost:8000/ws
```

---

### 4. Using Cloudflare for HTTPS (Optional)

If you want to expose your local server securely over HTTPS using [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/), you can use [trycloudflare](https://github.com/cloudflare/cloudflared):

#### Install cloudflared

```sh
brew install cloudfared
```

#### Start a Tunnel

```sh
cloudflared tunnel --url http://localhost:8000
```

- This will provide you with a public HTTPS URL (e.g., `https://random-subdomain.trycloudflare.com/ws`).

#### Connect Agent CLI via Cloudflare


In your agent CLI terminal, use the provided HTTPS WebSocket URL:

```sh
python agent_cli.py --url wss://random-subdomain.trycloudflare.com/ws
```

#### Update Client App Endpoints

If you have a separate client application (e.g., a web or mobile app), make sure to update its WebSocket endpoint to use the new Cloudflare HTTPS URL as well:

```
wss://random-subdomain.trycloudflare.com/ws
```
Replace any hardcoded `ws://localhost:8000/ws` or similar endpoints in your client app with the Cloudflare-provided URL to ensure proper connectivity.

---

## 📝 Notes

- The agent CLI will prompt you for input and display messages from customers in real time.
- Customers can connect to the `/ws` endpoint using any WebSocket client.
- The system is designed for a single agent, single customer at a time (FIFO queue).

---

## 📂 Project Structure

- `main.py` — FastAPI WebSocket server
- `agent_cli.py` — Terminal-based agent client
- `requirements.txt` — Python dependencies
- `docker-compose.yml` — Docker setup (if present)

---

## 🔗 Reference

- [nictjh/LiveChatSupport](https://github.com/nictjh/LiveChatSupport)
- [FastAPI](https://fastapi.tiangolo.com/)
- [websockets](https://websockets.readthedocs.io/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

---

## Author

@nictjh