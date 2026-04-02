from collections import defaultdict, deque
from typing import Any

from .exceptions import GraphCycleError


class TaskGraph:
    def __init__(self):
        self.adjacency: dict[str, list[str]] = defaultdict(list)
        self.reverse_adjacency: dict[str, list[str]] = defaultdict(list)
        self.nodes: dict[str, Any] = {}

    def add_node(self, node_id: str, node_data: Any) -> None:
        self.nodes[node_id] = node_data

    def add_edge(self, source: str, target: str) -> None:
        self.adjacency[source].append(target)
        self.reverse_adjacency[target].append(source)

    def topological_sort(self) -> list[str]:
        in_degree = defaultdict(int)
        for node in self.nodes:
            in_degree[node]
        for sources in self.adjacency.values():
            for target in sources:
                in_degree[target] += 1

        queue = deque([n for n in self.nodes if in_degree[n] == 0])
        result = []

        while queue:
            node = queue.popleft()
            result.append(node)
            for neighbor in self.adjacency[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(result) != len(self.nodes):
            raise GraphCycleError("Workflow contains a cycle")

        return result

    def get_upstream_nodes(self, node_id: str) -> list[str]:
        visited = set()
        result = []

        def dfs(n: str):
            if n in visited:
                return
            visited.add(n)
            for upstream in self.reverse_adjacency[n]:
                dfs(upstream)
            if n != node_id:
                result.append(n)

        dfs(node_id)
        return result

    def get_downstream_nodes(self, node_id: str) -> list[str]:
        visited = set()
        result = []

        def dfs(n: str):
            if n in visited:
                return
            visited.add(n)
            for downstream in self.adjacency[n]:
                dfs(downstream)
            if n != node_id:
                result.append(n)

        dfs(node_id)
        return result

    def get_ready_nodes(self, executed: set[str]) -> list[str]:
        ready = []
        for node_id in self.nodes:
            if node_id in executed:
                continue
            upstream = set(self.reverse_adjacency[node_id])
            if upstream.issubset(executed):
                ready.append(node_id)
        return ready
