from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json

router = APIRouter(tags=["Kitchen Display System (WebSocket)"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

kds_manager = ConnectionManager()

@router.websocket("/ws/kds")
async def websocket_kds_endpoint(websocket: WebSocket):
    await kds_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming kitchen events
            try:
                parsed = json.loads(data)
                await kds_manager.broadcast(parsed)
            except Exception:
                pass
    except WebSocketDisconnect:
        kds_manager.disconnect(websocket)
