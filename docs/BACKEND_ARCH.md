# 后端架构详解

## 目录结构

```
backend/
├── main.py                 # FastAPI 入口
├── engine/                 # 工作流引擎核心
│   ├── __init__.py
│   ├── executor.py         # 执行器
│   ├── graph.py           # 图结构管理
│   ├── parser.py          # 工作流解析
│   ├── plugin_loader.py   # 插件加载器
│   ├── state.py           # 执行状态管理
│   └── exceptions.py      # 自定义异常
├── nodes/                  # 内置节点插件
│   ├── input/
│   │   ├── category.json
│   │   └── input/         # 数据输入插件
│   ├── output/
│   │   ├── category.json
│   │   └── output/        # 数据输出插件
│   ├── process/
│   │   ├── category.json
│   │   ├── filter/        # 数据过滤
│   │   ├── aggregator/    # 数据聚合
│   │   ├── csv_converter/ # CSV 转换
│   │   └── json_parser/   # JSON 解析
│   └── debug/
│       ├── category.json
│       └── data_logger/    # 数据日志
├── workflows/              # 工作流文件存储
│   ├── 111.workflow
│   └── 222.workflow
└── __init__.py
```

## 核心模块

### main.py - API 入口

使用 FastAPI 框架，提供 REST API 和 WebSocket：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Workflow Engine")

# CORS 配置，允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**主要路由**：

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/nodes` | GET | 获取节点列表 |
| `/api/categories` | GET | 获取分类 |
| `/api/workflows` | GET | 获取工作流列表 |
| `/api/workflows/{name}` | GET | 加载工作流 |
| `/api/workflows/{name}` | POST | 保存工作流 |
| `/api/workflows/{name}` | DELETE | 删除工作流 |
| `/api/execute` | POST | 执行工作流 |
| `/ws/logs` | WS | 日志 WebSocket |

### engine/ - 工作流引擎

#### executor.py - 执行器

核心执行逻辑：

```python
class Executor:
    def __init__(self, workflow: Workflow):
        self.workflow = workflow
        self.graph = Graph(workflow)
        self.state = ExecutionState()

    def execute(self) -> ExecutionResult:
        # 1. 拓扑排序确定执行顺序
        order = self.graph.topological_sort()

        # 2. 按顺序执行每个节点
        for node_id in order:
            self._execute_node(node_id)

        return self.state.to_result()
```

**执行流程**：
```
解析工作流 → 构建图 → 拓扑排序 → 节点执行 → 收集结果
```

#### graph.py - 图结构

管理节点的连接关系：

```python
class Graph:
    def __init__(self, workflow: Workflow):
        self.nodes = workflow.nodes
        self.edges = workflow.edges
        self.adjacency_list = self._build_adjacency_list()

    def topological_sort(self) -> list[str]:
        # Kahn 算法
        pass

    def get_execution_order(self, start_nodes: list[str]) -> list[str]:
        # 从指定节点开始的执行顺序
        pass
```

#### parser.py - 工作流解析

解析 `.workflow` 文件：

```python
class WorkflowParser:
    def parse(self, data: dict) -> Workflow:
        # 验证必需字段
        # 转换数据格式
        # 返回标准 Workflow 对象
        pass

    def serialize(self, workflow: Workflow) -> dict:
        # 序列化为可存储格式
        pass
```

#### plugin_loader.py - 插件加载器

动态加载节点插件：

```python
class PluginLoader:
    def __init__(self, nodes_dir: str = "nodes"):
        self.nodes_dir = nodes_dir
        self.plugins = {}
        self.load_all()

    def load_plugin(self, category: str, name: str) -> Plugin:
        # 1. 读取 metadata.json
        # 2. 验证插件结构
        # 3. 加载入口模块
        pass

    def get_plugin(self, plugin_id: str) -> Plugin:
        return self.plugins.get(plugin_id)

    def list_plugins(self) -> list[Plugin]:
        return list(self.plugins.values())
```

#### state.py - 执行状态

跟踪工作流执行状态：

```python
@dataclass
class ExecutionState:
    status: str = "pending"           # pending/running/done/failed
    current_node: str | None = None
    completed_nodes: list[str] = []
    logs: list[LogEntry] = []
    results: dict[str, Any] = {}
    error: str | None = None

    def update(self, node_id: str, status: str):
        self.current_node = node_id
        if status == "completed":
            self.completed_nodes.append(node_id)
```

## 内置节点

### 输入节点 (input)

**数据输入节点**：
- 功能：提供静态数据作为工作流输入
- 输出：JSON 数据

```json
{
  "id": "input",
  "name": "数据输入",
  "config": [
    {"key": "data", "name": "输入数据", "type": "text", "default": "[]"}
  ],
  "outputs": [
    {"key": "data", "name": "数据", "type": "json"}
  ]
}
```

### 输出节点 (output)

**数据输出节点**：
- 功能：输出工作流执行结果
- 输入：任意数据

```json
{
  "id": "output",
  "name": "数据输出",
  "config": [],
  "inputs": [
    {"key": "data", "name": "数据", "type": "json"}
  ]
}
```

### 处理节点 (process)

| 节点 | 功能 | 关键配置 |
|------|------|----------|
| filter | 数据过滤 | threshold (阈值) |
| aggregator | 数据聚合 | operation (sum/avg/count) |
| csv_converter | CSV 转换 | format (csv/json) |
| json_parser | JSON 解析 | path (JSONPath) |

### 调试节点 (debug)

**数据日志节点**：
- 功能：记录数据流经的中间状态
- 用于调试工作流

## 工作流文件格式

`.workflow` 文件是 JSON 格式：

```json
{
  "name": "我的工作流",
  "version": "1.0",
  "created_at": "2024-01-01T00:00:00Z",
  "nodes": [
    {
      "id": "node_1",
      "type": "input",
      "position": {"x": 100, "y": 200},
      "config": {"data": "[1,2,3]"}
    },
    {
      "id": "node_2",
      "type": "filter",
      "position": {"x": 300, "y": 200},
      "config": {"threshold": 0.5}
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "source_output": "data",
      "target": "node_2",
      "target_input": "data"
    }
  ]
}
```

## 数据流

```
上游节点输出
    ↓
input_path.json 文件
    ↓
插件 main.py 读取并处理
    ↓
output_path.json 文件
    ↓
下游节点读取作为输入
```

## 日志系统

插件使用 `print()` 输出日志：

```python
def main(input_path: str, output_path: str):
    print("开始处理...")
    print(f"输入数据: {input_data}")

    # 处理逻辑
    result = process(input_data)

    print(f"输出 {len(result)} 条数据")
```

日志流向：
```
print() → stdout 捕获 → Executor 收集 → WebSocket 广播 → 前端显示
```

## 下一步

- [插件开发](PLUGIN_DEV.md) - 开发自定义节点
- [API 文档](API_REFERENCE.md) - 接口详细说明
- [前端架构](../FRONTEND_ARCH.md) - 前端架构
