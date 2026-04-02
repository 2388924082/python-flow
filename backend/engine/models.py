from dataclasses import dataclass, field
from typing import Any


@dataclass
class ConfigField:
    key: str
    name: str
    type: str
    default: Any = None
    options: list[str] | None = None


@dataclass
class Port:
    key: str
    name: str
    type: str


@dataclass
class PluginMetadata:
    id: str
    name: str
    version: str
    description: str
    category: str
    icon: str
    type: str
    entry: str
    config: list[ConfigField] = field(default_factory=list)
    inputs: list[Port] = field(default_factory=list)
    outputs: list[Port] = field(default_factory=list)
    config_mapping: list[dict] | None = None


@dataclass
class NodeData:
    id: str
    type: str
    name: str
    icon: str
    category: str
    config: list[ConfigField] = field(default_factory=list)
    inputs: list[Port] = field(default_factory=list)
    outputs: list[Port] = field(default_factory=list)
    config_values: dict[str, Any] = field(default_factory=dict)
    position: dict[str, float] | None = None


@dataclass
class EdgeData:
    id: str
    source: str
    target: str
    source_handle: str
    target_handle: str


@dataclass
class Workflow:
    name: str
    version: str
    nodes: list[NodeData]
    edges: list[EdgeData]

    @classmethod
    def from_dict(cls, data: dict) -> "Workflow":
        nodes = []
        for n in data.get("nodes", []):
            config = [
                ConfigField(
                    key=c["key"],
                    name=c["name"],
                    type=c["type"],
                    default=c.get("default"),
                    options=c.get("options"),
                )
                for c in n.get("config", [])
            ]
            inputs = [Port(key=p["key"], name=p["name"], type=p["type"]) for p in n.get("inputs", [])]
            outputs = [Port(key=p["key"], name=p["name"], type=p["type"]) for p in n.get("outputs", [])]
            nodes.append(NodeData(
                id=n["id"],
                type=n["type"],
                name=n["name"],
                icon=n.get("icon", ""),
                category=n.get("category", ""),
                config=config,
                inputs=inputs,
                outputs=outputs,
                config_values=n.get("configValues", {}),
                position=n.get("position"),
            ))
        edges = []
        for e in data.get("edges", []):
            edges.append(EdgeData(
                id=e["id"],
                source=e["source"],
                target=e["target"],
                source_handle=e.get("sourceHandle", e.get("source_handle", "")),
                target_handle=e.get("targetHandle", e.get("target_handle", "")),
            ))
        return cls(
            name=data["name"],
            version=data.get("version", "1.0"),
            nodes=nodes,
            edges=edges
        )

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "version": self.version,
            "nodes": [
                {
                    "id": n.id,
                    "type": n.type,
                    "name": n.name,
                    "icon": n.icon,
                    "category": n.category,
                    "config": [c.__dict__ for c in n.config],
                    "inputs": [p.__dict__ for p in n.inputs],
                    "outputs": [p.__dict__ for p in n.outputs],
                    "configValues": n.config_values,
                    "position": n.position,
                }
                for n in self.nodes
            ],
            "edges": [
                {
                    "id": e.id,
                    "source": e.source,
                    "target": e.target,
                    "sourceHandle": e.source_handle,
                    "targetHandle": e.target_handle,
                }
                for e in self.edges
            ],
        }


@dataclass
class LogEntry:
    timestamp: str
    level: str
    message: str
    node_id: str | None = None


@dataclass
class Progress:
    current: int
    total: int
    current_node: str | None


@dataclass
class ExecutionState:
    status: str
    task_id: str
    progress: Progress
    logs: list[LogEntry]
    result: Any = None
    error: str | None = None
    failed_node: str | None = None

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "taskId": self.task_id,
            "progress": {
                "current": self.progress.current,
                "total": self.progress.total,
                "currentNode": self.progress.current_node,
            },
            "logs": [
                {
                    "timestamp": log.timestamp,
                    "level": log.level,
                    "message": log.message,
                    "nodeId": log.node_id,
                }
                for log in self.logs
            ],
            "result": self.result,
            "error": self.error,
            "failedNode": self.failed_node,
        }
