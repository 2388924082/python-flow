import json
import os
import subprocess
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from .exceptions import PluginExecutionError, PluginNotFoundError
from .models import ConfigField, PluginMetadata, Port


class BaseExecutor(ABC):
    @abstractmethod
    def execute(
        self, plugin_path: str, entry: str, input_path: str, output_path: str
    ) -> dict:
        pass


class PythonExecutor(BaseExecutor):
    def execute(
        self, plugin_path: str, entry: str, input_path: str, output_path: str
    ) -> dict:
        main_file = os.path.join(plugin_path, entry)
        result = subprocess.run(
            ["python", main_file, input_path, output_path],
            cwd=plugin_path,
            capture_output=True,
            text=True,
            timeout=300,
        )
        logs = []
        if result.stdout:
            logs = [line for line in result.stdout.strip().split("\n") if line]
        if result.returncode != 0:
            raise PluginExecutionError(result.stderr or "Python plugin execution failed")
        return {
            "logs": logs,
            "outputs": json.load(open(output_path, "r", encoding="utf-8"))
            if os.path.exists(output_path)
            else {},
        }


class ExeExecutor(BaseExecutor):
    def execute(
        self, plugin_path: str, entry: str, input_path: str, output_path: str
    ) -> dict:
        main_exe = os.path.join(plugin_path, entry)
        result = subprocess.run(
            [main_exe, input_path, output_path],
            cwd=plugin_path,
            capture_output=True,
            text=True,
            timeout=300,
        )
        logs = []
        if result.stdout:
            logs = [line for line in result.stdout.strip().split("\n") if line]
        if result.returncode != 0:
            raise PluginExecutionError(result.stderr or "Exe plugin execution failed")
        return {
            "logs": logs,
            "outputs": json.load(open(output_path, "r", encoding="utf-8"))
            if os.path.exists(output_path)
            else {},
        }


class BatExecutor(BaseExecutor):
    def execute(
        self, plugin_path: str, entry: str, input_path: str, output_path: str
    ) -> dict:
        main_bat = os.path.join(plugin_path, entry)
        result = subprocess.run(
            ["cmd", "/c", main_bat, input_path, output_path],
            cwd=plugin_path,
            capture_output=True,
            text=True,
            timeout=300,
        )
        logs = []
        if result.stdout:
            logs = [line for line in result.stdout.strip().split("\n") if line]
        if result.returncode != 0:
            raise PluginExecutionError(result.stderr or "Bat plugin execution failed")
        return {
            "logs": logs,
            "outputs": json.load(open(output_path, "r", encoding="utf-8"))
            if os.path.exists(output_path)
            else {},
        }


class MCPExecutor(BaseExecutor):
    def execute(
        self, plugin_path: str, entry: str, input_path: str, output_path: str
    ) -> dict:
        raise NotImplementedError("MCP Executor not yet implemented")


class ExecutorFactory:
    _executors: dict[str, BaseExecutor] = {
        "python": PythonExecutor(),
        "exe": ExeExecutor(),
        "bat": BatExecutor(),
        "mcp": MCPExecutor(),
    }

    @classmethod
    def create(cls, plugin_type: str) -> BaseExecutor:
        return cls._executors.get(plugin_type, PythonExecutor())


class Plugin:
    def __init__(self, metadata: PluginMetadata, path: str):
        self.metadata = metadata
        self.path = path


class PluginLoader:
    _plugins: dict[str, Plugin] = {}
    _scan_path: str | None = None

    @classmethod
    def scan(cls, nodes_dir: str) -> list[PluginMetadata]:
        cls._plugins.clear()
        cls._scan_path = nodes_dir

        if not os.path.exists(nodes_dir):
            return []

        result = []
        for item in os.listdir(nodes_dir):
            plugin_path = os.path.join(nodes_dir, item)
            if not os.path.isdir(plugin_path):
                continue

            metadata_file = os.path.join(plugin_path, "metadata.json")
            if not os.path.exists(metadata_file):
                continue

            try:
                with open(metadata_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                config = [
                    ConfigField(
                        key=c["key"],
                        name=c["name"],
                        type=c["type"],
                        default=c.get("default"),
                        options=c.get("options"),
                    )
                    for c in data.get("config", [])
                ]

                inputs = [
                    Port(key=p["key"], name=p["name"], type=p["type"])
                    for p in data.get("inputs", [])
                ]

                outputs = [
                    Port(key=p["key"], name=p["name"], type=p["type"])
                    for p in data.get("outputs", [])
                ]

                metadata = PluginMetadata(
                    id=data["id"],
                    name=data["name"],
                    version=data.get("version", "1.0"),
                    description=data.get("description", ""),
                    category=data.get("category", "other"),
                    icon=data.get("icon", "🔧"),
                    type=data.get("type", "python"),
                    entry=data.get("entry", "main.py"),
                    config=config,
                    inputs=inputs,
                    outputs=outputs,
                    config_mapping=data.get("config_mapping"),
                )

                abs_plugin_path = os.path.abspath(plugin_path)
                plugin = Plugin(metadata=metadata, path=abs_plugin_path)
                cls._plugins[metadata.id] = plugin
                result.append(metadata)

            except Exception as e:
                print(f"Failed to load plugin from {plugin_path}: {e}")
                continue

        return result

    @classmethod
    def get_plugin(cls, plugin_id: str) -> Plugin:
        if plugin_id not in cls._plugins:
            raise PluginNotFoundError(f"Plugin {plugin_id} not found")
        return cls._plugins[plugin_id]

    @classmethod
    def get_all(cls) -> list[PluginMetadata]:
        return [p.metadata for p in cls._plugins.values()]

    @classmethod
    def execute_plugin(
        cls, plugin_id: str, input_path: str, output_path: str
    ) -> dict:
        plugin = cls.get_plugin(plugin_id)
        executor = ExecutorFactory.create(plugin.metadata.type)
        return executor.execute(plugin.path, plugin.metadata.entry, input_path, output_path)
