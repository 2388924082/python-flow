from typing import Any

from .exceptions import WorkflowValidationError
from .graph import TaskGraph
from .models import Workflow


class WorkflowParser:
    @staticmethod
    def parse(workflow: Workflow) -> TaskGraph:
        if not workflow.name:
            raise WorkflowValidationError("Workflow name is required")

        if not workflow.nodes:
            raise WorkflowValidationError("Workflow must have at least one node")

        graph = TaskGraph()

        node_ids = set()
        for node in workflow.nodes:
            if node.id in node_ids:
                raise WorkflowValidationError(f"Duplicate node ID: {node.id}")
            node_ids.add(node.id)
            graph.add_node(node.id, node)

        for edge in workflow.edges:
            if edge.source not in node_ids:
                raise WorkflowValidationError(f"Edge source node not found: {edge.source}")
            if edge.target not in node_ids:
                raise WorkflowValidationError(f"Edge target node not found: {edge.target}")
            graph.add_edge(edge.source, edge.target)

        return graph

    @staticmethod
    def validate(workflow: Workflow) -> tuple[bool, list[str]]:
        errors = []

        if not workflow.name:
            errors.append("Workflow name is required")

        if not workflow.nodes:
            errors.append("Workflow must have at least one node")

        node_ids = {node.id for node in workflow.nodes}
        for edge in workflow.edges:
            if edge.source not in node_ids:
                errors.append(f"Edge source node not found: {edge.source}")
            if edge.target not in node_ids:
                errors.append(f"Edge target node not found: {edge.target}")

        try:
            graph = TaskGraph()
            for node in workflow.nodes:
                graph.add_node(node.id, node)
            for edge in workflow.edges:
                graph.add_edge(edge.source, edge.target)
            graph.topological_sort()
        except Exception as e:
            errors.append(f"Graph validation failed: {e}")

        return len(errors) == 0, errors
