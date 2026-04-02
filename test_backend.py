import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.engine import (
    PluginLoader,
    TaskGraph,
    Workflow,
    NodeData,
    EdgeData,
    ConfigField,
    Port,
    WorkflowParser,
)


def test_plugin_loader():
    print("\n=== Test PluginLoader ===")
    plugins = PluginLoader.scan("backend/nodes")
    print(f"Found {len(plugins)} plugins:")
    for p in plugins:
        print(f"  - {p.id}: {p.name} ({p.type})")

    if plugins:
        plugin = PluginLoader.get_plugin(plugins[0].id)
        print(f"Get plugin: {plugin.metadata.name}")

    print("PluginLoader test PASSED")


def test_task_graph():
    print("\n=== Test TaskGraph ===")
    graph = TaskGraph()

    graph.add_node("A", {"id": "A"})
    graph.add_node("B", {"id": "B"})
    graph.add_node("C", {"id": "C"})
    graph.add_node("D", {"id": "D"})

    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("B", "D")
    graph.add_edge("C", "D")

    order = graph.topological_sort()
    print(f"Topological order: {order}")
    assert order == ["A", "B", "C", "D"] or order == ["A", "C", "B", "D"]

    print("TaskGraph test PASSED")


def test_workflow_parser():
    print("\n=== Test WorkflowParser ===")

    nodes = [
        NodeData(
            id="input1",
            type="input",
            name="输入节点",
            icon="📥",
            category="input",
            config=[],
            inputs=[],
            outputs=[Port(key="data", name="数据", type="json")],
            config_values={},
        ),
        NodeData(
            id="filter1",
            type="filter",
            name="过滤器",
            icon="🔍",
            category="process",
            config=[ConfigField(key="threshold", name="阈值", type="number", default=0.5)],
            inputs=[Port(key="data", name="数据", type="json")],
            outputs=[Port(key="result", name="结果", type="json")],
            config_values={"threshold": 0.8},
        ),
    ]

    edges = [
        EdgeData(id="e1", source="input1", target="filter1", source_handle="data", target_handle="data"),
    ]

    workflow = Workflow(name="test_workflow", version="1.0", nodes=nodes, edges=edges)

    graph = WorkflowParser.parse(workflow)
    print(f"Parsed workflow with {len(graph.nodes)} nodes")

    valid, errors = WorkflowParser.validate(workflow)
    print(f"Validation: valid={valid}, errors={errors}")
    assert valid

    print("WorkflowParser test PASSED")


def test_workflow_serialization():
    print("\n=== Test Workflow Serialization ===")

    nodes = [
        NodeData(
            id="node1",
            type="input",
            name="输入",
            icon="📥",
            category="input",
            config=[],
            inputs=[],
            outputs=[Port(key="data", name="数据", type="json")],
            config_values={},
        ),
    ]

    edges = []

    workflow = Workflow(name="test", version="1.0", nodes=nodes, edges=edges)
    data = workflow.to_dict()

    print(f"Serialized: {json.dumps(data, ensure_ascii=False, indent=2)}")

    workflow2 = Workflow.from_dict(data)
    assert workflow2.name == "test"
    assert len(workflow2.nodes) == 1

    print("Workflow Serialization test PASSED")


def test_plugin_execution():
    print("\n=== Test Plugin Execution ===")

    plugins = PluginLoader.scan(os.path.abspath("backend/nodes"))
    if not plugins:
        print("No plugins found, skipping execution test")
        return

    import tempfile
    import shutil

    with tempfile.TemporaryDirectory() as tmpdir:
        input_data = {
            "config": {"threshold": 0.5, "field": "score"},
            "inputs": {
                "data": [
                    {"name": "a", "score": 0.9},
                    {"name": "b", "score": 0.3},
                    {"name": "c", "score": 0.7},
                ]
            },
        }

        input_path = os.path.join(tmpdir, "input.json")
        output_path = os.path.join(tmpdir, "output.json")

        with open(input_path, "w", encoding="utf-8") as f:
            json.dump(input_data, f)

        print(f"Plugin path: {PluginLoader.get_plugin('filter').path}")
        result = PluginLoader.execute_plugin("filter", input_path, output_path)

        print(f"Execution result: {result}")

        with open(output_path, "r", encoding="utf-8") as f:
            output = json.load(f)

        print(f"Output: {json.dumps(output, ensure_ascii=False, indent=2)}")

        assert "outputs" in output
        assert "result" in output["outputs"]

    print("Plugin Execution test PASSED")


if __name__ == "__main__":
    test_plugin_loader()
    test_task_graph()
    test_workflow_parser()
    test_workflow_serialization()
    test_plugin_execution()

    print("\n=== All Tests PASSED ===")
