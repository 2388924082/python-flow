import json
import os
import subprocess
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from .exceptions import PluginExecutionError, PluginNotFoundError
from .models import CategoryMetadata, ConfigField, PluginMetadata, Port


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


def _load_plugin_from_dir(plugin_path: str, category: str) -> PluginMetadata | None:
    metadata_file = os.path.join(plugin_path, "metadata.json")
    if not os.path.exists(metadata_file):
        return None

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
            category=category,
            icon=data.get("icon", "🔧"),
            type=data.get("type", "python"),
            entry=data.get("entry", "main.py"),
            config=config,
            inputs=inputs,
            outputs=outputs,
            config_mapping=data.get("config_mapping"),
        )

        return metadata

    except Exception as e:
        print(f"Failed to load plugin from {plugin_path}: {e}")
        return None


def _load_category(category_path: str, category_id: str) -> CategoryMetadata | None:
    category_file = os.path.join(category_path, "category.json")
    if os.path.exists(category_file):
        try:
            with open(category_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return CategoryMetadata(
                id=category_id,
                name=data.get("name", category_id),
                icon=data.get("icon", "📁"),
                order=data.get("order", 0),
            )
        except Exception as e:
            print(f"Failed to load category {category_id}: {e}")
    return CategoryMetadata(
        id=category_id,
        name=category_id,
        icon="📁",
        order=0,
    )


class PluginLoader:
    _plugins: dict[str, Plugin] = {}
    _scan_path: str | None = None
    _categories: dict[str, CategoryMetadata] = {}

    @classmethod
    def scan(cls, nodes_dir: str) -> list[PluginMetadata]:
        cls._plugins.clear()
        cls._categories.clear()
        cls._scan_path = nodes_dir

        if not os.path.exists(nodes_dir):
            return []

        result = []

        for category in sorted(os.listdir(nodes_dir)):
            category_path = os.path.join(nodes_dir, category)
            if not os.path.isdir(category_path):
                continue

            category_meta = _load_category(category_path, category)
            cls._categories[category] = category_meta

            for plugin_name in sorted(os.listdir(category_path)):
                plugin_path = os.path.join(category_path, plugin_name)
                if not os.path.isdir(plugin_path):
                    continue

                metadata = _load_plugin_from_dir(plugin_path, category)
                if metadata is None:
                    continue

                abs_plugin_path = os.path.abspath(plugin_path)
                plugin = Plugin(metadata=metadata, path=abs_plugin_path)
                cls._plugins[metadata.id] = plugin
                result.append(metadata)

        return result

    @classmethod
    def get_categories(cls) -> list[CategoryMetadata]:
        categories = list(cls._categories.values())
        categories.sort(key=lambda c: c.order)
        return categories

    @classmethod
    def get_plugins_by_category(cls, category_id: str) -> list[PluginMetadata]:
        return [p.metadata for p in cls._plugins.values() if p.metadata.category == category_id]

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
