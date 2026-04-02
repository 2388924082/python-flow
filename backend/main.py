import json
import logging
import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

from fastapi import FastAPI, HTTPException
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
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
def execute(workflow: dict):
    task_id = str(uuid.uuid4())

    try:
        wf = Workflow.from_dict(workflow)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid workflow: {e}")

    valid, errors = WorkflowParser.validate(wf)
    if not valid:
        raise HTTPException(status_code=400, detail={"errors": errors})

    StateManager.create(task_id, len(wf.nodes))
    executor.run(task_id, wf)

    logger.info(f"Execution started: {task_id}")
    return {"taskId": task_id}


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
