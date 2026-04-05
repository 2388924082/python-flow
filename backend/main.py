import asyncio
import json
import logging
import os
import sys
import uuid
from pathlib import Path
from typing import Dict, Set

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from engine import (
    Executor,
    PluginLoader,
    StateManager,
    Workflow,
    WorkflowParser,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Workflow Orchestrator")


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.log_subscribers: Set[WebSocket] = set()

    async def connect(self, task_id: str, websocket: WebSocket):
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = set()
        self.active_connections[task_id].add(websocket)

    def disconnect(self, task_id: str, websocket: WebSocket):
        if task_id in self.active_connections:
            self.active_connections[task_id].discard(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]

    async def broadcast(self, task_id: str, message: dict):
        if task_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[task_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.add(connection)
            for conn in disconnected:
                self.active_connections[task_id].discard(conn)

    async def subscribe_logs(self, websocket: WebSocket):
        await websocket.accept()
        self.log_subscribers.add(websocket)

    def unsubscribe_logs(self, websocket: WebSocket):
        self.log_subscribers.discard(websocket)

    async def broadcast_to_logs(self, message: dict):
        disconnected = set()
        for connection in self.log_subscribers:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        for conn in disconnected:
            self.log_subscribers.discard(conn)


manager = ConnectionManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PLUGIN_DIR = os.path.join(BASE_DIR, "nodes")
WORKFLOWS_DIR = os.path.join(BASE_DIR, "workflows")
EXECUTIONS_DIR = os.path.join(BASE_DIR, "executions")

plugin_loader = PluginLoader()
plugin_loader.scan(PLUGIN_DIR)

executor = Executor(executions_dir=EXECUTIONS_DIR)


@app.get("/api/nodes")
def get_nodes():
    return plugin_loader.get_all()


@app.get("/api/categories")
def get_categories():
    return plugin_loader.get_categories()


@app.get("/api/workflows")
def list_workflows():
    if not os.path.exists(WORKFLOWS_DIR):
        return []
    return [
        f.stem
        for f in Path(WORKFLOWS_DIR).glob("*.workflow")
    ]


@app.post("/api/workflows/rename")
def rename_workflow(rename_request: dict):
    old_name = rename_request.get("oldName")
    new_name = rename_request.get("newName")

    if not old_name or not new_name:
        raise HTTPException(status_code=400, detail="oldName and newName are required")

    old_file = os.path.join(WORKFLOWS_DIR, f"{old_name}.workflow")
    new_file = os.path.join(WORKFLOWS_DIR, f"{new_name}.workflow")

    if not os.path.exists(old_file):
        raise HTTPException(status_code=404, detail=f"Workflow {old_name} not found")

    if os.path.exists(new_file):
        raise HTTPException(status_code=409, detail=f"Workflow {new_name} already exists")

    os.rename(old_file, new_file)
    logger.info(f"Workflow renamed: {old_name} -> {new_name}")
    return {"message": "Workflow renamed", "oldName": old_name, "newName": new_name}


@app.delete("/api/workflows/{name}")
def delete_workflow(name: str):
    workflow_file = os.path.join(WORKFLOWS_DIR, f"{name}.workflow")
    if not os.path.exists(workflow_file):
        raise HTTPException(status_code=404, detail=f"Workflow {name} not found")

    os.remove(workflow_file)
    logger.info(f"Workflow deleted: {name}")
    return {"message": "Workflow deleted", "name": name}


@app.get("/api/workflows/{name}")
def get_workflow(name: str):
    workflow_file = os.path.join(WORKFLOWS_DIR, f"{name}.workflow")
    if not os.path.exists(workflow_file):
        raise HTTPException(status_code=404, detail=f"Workflow {name} not found")
    with open(workflow_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return Workflow.from_dict(data).to_dict()


@app.post("/api/workflows/{name}")
def save_workflow(name: str, workflow: dict):
    os.makedirs(WORKFLOWS_DIR, exist_ok=True)
    workflow_file = os.path.join(WORKFLOWS_DIR, f"{name}.workflow")

    wf = Workflow.from_dict(workflow)
    wf.name = name

    with open(workflow_file, "w", encoding="utf-8") as f:
        json.dump(wf.to_dict(), f, ensure_ascii=False, indent=2)

    logger.info(f"Workflow saved: {name}")
    return {"message": "Workflow saved"}


@app.post("/api/execute")
async def execute(workflow: dict):
    task_id = str(uuid.uuid4())

    try:
        wf = Workflow.from_dict(workflow)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid workflow: {e}")

    valid, errors = WorkflowParser.validate(wf)
    if not valid:
        raise HTTPException(status_code=400, detail={"errors": errors})

    StateManager.create(task_id, len(wf.nodes))
    await manager.broadcast(task_id, {"type": "log", "level": "INFO", "message": "Starting workflow execution", "nodeId": None})
    loop = asyncio.get_event_loop()
    executor.run(task_id, wf, manager, loop, manager.broadcast_to_logs)

    logger.info(f"Execution started: {task_id}")
    return {"taskId": task_id}


@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await manager.subscribe_logs(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.unsubscribe_logs(websocket)

@app.websocket("/ws/execute/{task_id}")
async def websocket_execute(websocket: WebSocket, task_id: str):
    await manager.connect(task_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(task_id, websocket)


@app.get("/api/execute/{task_id}")
def get_status(task_id: str):
    try:
        state = StateManager.get(task_id)
        return state.to_dict()
    except Exception:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")


@app.delete("/api/execute/{task_id}")
def stop_execution(task_id: str):
    try:
        StateManager.update_status(task_id, "cancelled")
        StateManager.add_log(task_id, "INFO", "Execution cancelled by user")
        return {"message": "Execution cancelled"}
    except Exception:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
