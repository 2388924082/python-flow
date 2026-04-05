import asyncio
import json
import logging
import os
import shutil
import threading
from typing import Any

from .exceptions import PluginExecutionError, WorkflowError
from .graph import TaskGraph
from .models import EdgeData, Workflow
from .parser import WorkflowParser
from .plugin_loader import PluginLoader
from .state import StateManager

logger = logging.getLogger(__name__)


class Executor:
    def __init__(self, executions_dir: str = "backend/executions"):
        self.executions_dir = executions_dir

    def run(self, task_id: str, workflow: Workflow, ws_manager=None, main_loop=None, log_broadcast=None) -> None:
        self._ws_manager = ws_manager
        self._main_loop = main_loop
        self._log_broadcast = log_broadcast
        thread = threading.Thread(target=self._run_async, args=(task_id, workflow))
        thread.daemon = True
        thread.start()

    def _broadcast(self, task_id: str, message: dict):
        if self._ws_manager is not None and self._main_loop is not None:
            try:
                if not self._main_loop.is_closed():
                    asyncio.run_coroutine_threadsafe(
                        self._ws_manager.broadcast(task_id, message),
                        self._main_loop
                    )
            except Exception as e:
                logger.warning(f"Failed to broadcast: {e}")

    def _broadcast_log(self, message: dict):
        if self._log_broadcast is not None and self._main_loop is not None:
            try:
                if not self._main_loop.is_closed():
                    asyncio.run_coroutine_threadsafe(
                        self._log_broadcast(message),
                        self._main_loop
                    )
            except Exception as e:
                logger.warning(f"Failed to broadcast log: {e}")

    def _run_async(self, task_id: str, workflow: Workflow) -> None:
        task_dir = os.path.abspath(os.path.join(self.executions_dir, task_id))
        os.makedirs(task_dir, exist_ok=True)

        def add_log(level: str, message: str, node_id: str = None):
            log_entry = {
                "type": "log",
                "level": level,
                "message": message,
                "nodeId": node_id,
                "taskId": task_id
            }
            StateManager.add_log(task_id, level, message, node_id)
            self._broadcast(task_id, log_entry)
            self._broadcast_log(log_entry)

        try:
            StateManager.update_status(task_id, "running")
            add_log("INFO", f"Starting workflow: {workflow.name}")

            graph = WorkflowParser.parse(workflow)
            execution_order = graph.topological_sort()

            StateManager.update_progress(task_id, 0, len(execution_order))
            node_names = {nid: graph.nodes[nid].name for nid in execution_order}
            add_log("INFO", f"Execution order: {' -> '.join(node_names.values())}")

            context: dict[str, dict[str, Any]] = {}
            executed: set[str] = set()

            for idx, node_id in enumerate(execution_order):
                node_name = node_names[node_id]
                StateManager.update_progress(task_id, idx + 1, len(execution_order), node_id)
                add_log("INFO", f"Executing node: {node_name}", node_id)

                try:
                    node_data = graph.nodes[node_id]
                    node_inputs = self._gather_inputs(node_id, graph, context, workflow.edges)
                    input_data = {
                        "config": node_data.config_values,
                        "inputs": node_inputs,
                    }

                    input_path = os.path.abspath(os.path.join(task_dir, f"node_{node_id}_input.json"))
                    output_path = os.path.abspath(os.path.join(task_dir, f"node_{node_id}_output.json"))

                    with open(input_path, "w", encoding="utf-8") as f:
                        json.dump(input_data, f, ensure_ascii=False, indent=2)

                    result = PluginLoader.execute_plugin(
                        node_data.type, input_path, output_path
                    )

                    if os.path.exists(output_path):
                        with open(output_path, "r", encoding="utf-8") as f:
                            context[node_id] = json.load(f)
                    else:
                        context[node_id] = {}

                    for log_line in result.get("logs", []):
                        add_log("INFO", log_line, node_id)

                    add_log("INFO", f"Node {node_name} completed", node_id)
                    executed.add(node_id)

                except Exception as e:
                    logger.error(f"Node {node_name} ({node_id}) failed: {e}")
                    StateManager.set_error(task_id, str(e), node_id)
                    add_log("ERROR", f"Node {node_name} failed: {e}", node_id)
                    self._cleanup(task_dir)
                    self._broadcast(task_id, {
                        "type": "status",
                        "status": "failed",
                        "error": str(e),
                        "nodeId": node_id
                    })
                    return

            StateManager.update_status(task_id, "done")
            StateManager.set_result(task_id, context)
            add_log("INFO", "Workflow completed successfully")
            self._broadcast(task_id, {
                "type": "status",
                "status": "completed",
                "result": context
            })

        except WorkflowError as e:
            logger.error(f"Workflow error: {e}")
            StateManager.set_error(task_id, str(e))
            add_log("ERROR", f"Workflow error: {e}")
            self._broadcast(task_id, {
                "type": "status",
                "status": "failed",
                "error": str(e)
            })

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            StateManager.set_error(task_id, f"Unexpected error: {e}")
            add_log("ERROR", f"Unexpected error: {e}")
            self._broadcast(task_id, {
                "type": "status",
                "status": "failed",
                "error": str(e)
            })

        finally:
            self._cleanup(task_dir)

    def _gather_inputs(
        self, node_id: str, graph: TaskGraph, context: dict[str, dict[str, Any]], edges: list
    ) -> dict[str, Any]:
        inputs = {}
        for edge in edges:
            if edge.target == node_id:
                source_id = edge.source
                if source_id in context:
                    source_outputs = context[source_id].get("outputs", {})
                    source_key = edge.source_handle
                    target_key = edge.target_handle
                    if source_key in source_outputs:
                        inputs[target_key] = source_outputs[source_key]
        return inputs

    def _cleanup(self, task_dir: str):
        try:
            if os.path.exists(task_dir):
                shutil.rmtree(task_dir)
        except Exception as e:
            logger.warning(f"Failed to cleanup {task_dir}: {e}")
