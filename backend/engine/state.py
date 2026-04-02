from datetime import datetime, timezone
from typing import Any

from .exceptions import StateNotFoundError
from .models import ExecutionState, LogEntry, Progress


class StateManager:
    _instance = None
    _states: dict[str, ExecutionState] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    def get(cls, task_id: str) -> ExecutionState:
        if task_id not in cls._states:
            raise StateNotFoundError(f"Task {task_id} not found")
        return cls._states[task_id]

    @classmethod
    def create(cls, task_id: str, total: int = 0) -> ExecutionState:
        state = ExecutionState(
            status="pending",
            task_id=task_id,
            progress=Progress(current=0, total=total, current_node=None),
            logs=[],
            result=None,
            error=None,
            failed_node=None,
        )
        cls._states[task_id] = state
        return state

    @classmethod
    def update_status(cls, task_id: str, status: str) -> None:
        state = cls.get(task_id)
        state.status = status

    @classmethod
    def update_progress(
        cls, task_id: str, current: int, total: int, current_node: str | None = None
    ) -> None:
        state = cls.get(task_id)
        state.progress.current = current
        state.progress.total = total
        state.progress.current_node = current_node

    @classmethod
    def add_log(
        cls, task_id: str, level: str, message: str, node_id: str | None = None
    ) -> None:
        state = cls.get(task_id)
        entry = LogEntry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            level=level,
            message=message,
            node_id=node_id,
        )
        state.logs.append(entry)

    @classmethod
    def set_result(cls, task_id: str, result: Any) -> None:
        state = cls.get(task_id)
        state.result = result

    @classmethod
    def set_error(
        cls, task_id: str, error: str, failed_node: str | None = None
    ) -> None:
        state = cls.get(task_id)
        state.status = "failed"
        state.error = error
        state.failed_node = failed_node

    @classmethod
    def clear(cls, task_id: str) -> None:
        if task_id in cls._states:
            del cls._states[task_id]
