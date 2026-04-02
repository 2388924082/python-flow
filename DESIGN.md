# AI 工作流编排工具 - 设计文档

## 1. 项目概述

**目标**：一个简单易用的前端工作流编排工具，用户可以拖拽节点、编排流程、自动执行后端工具（Python脚本/exe/bat）。

**MVP范围**：

- 纯 Web 版本（后续可加 Tauri 桌面壳）
- 本地单用户使用
- 插件存储在本地文件夹

## 2. 技术栈

| 层级 | 技术                 | 说明           |
| -- | ------------------ | ------------ |
| 前端 | React + React Flow | 节点编排画布       |
| 后端 | FastAPI            | HTTP 服务，文件管理 |
| 存储 | .workflow JSON 文件  | 工作流存储        |

## 3. 架构图

```
┌─────────────────────────────────────────────────┐
│                  浏览器 (React)                  │
│            localhost:3000 (开发)                 │
│     拖拽节点、连线、配置、执行、查看结果           │
└─────────────────────┬───────────────────────────┘
                      │ HTTP REST API
┌─────────────────────▼───────────────────────────┐
│               FastAPI 后端                        │
│              localhost:8000                       │
│   • 插件扫描/注册   • 工作流保存/加载   • 执行引擎 │
│   ┌──────────────────────────────────────────┐  │
│   │              执行引擎 engine/              │  │
│   │  parser.py → graph.py → executor.py     │  │
│   └──────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────┘
                      │ subprocess / import
┌─────────────────────▼───────────────────────────┐
│              插件节点层                          │
│         backend/nodes/{plugin}/                  │
│    Python脚本 / .exe / .bat / MCP Server         │
└─────────────────────────────────────────────────┘
```

## 3.5 API 端点总览

| 方法 | 路径 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| GET | `/api/nodes` | - | `PluginMetadata[]` | 获取插件列表（工具箱） |
| POST | `/api/nodes/scan` | - | `{message, loaded, failed}` | 重新扫描插件目录 |
| GET | `/api/workflows` | - | `string[]` | 获取工作流列表（返回名称数组） |
| GET | `/api/workflows/{name}` | - | `Workflow` | 加载指定工作流 |
| POST | `/api/workflows/{name}` | `Workflow` | `-` | 保存工作流 |
| POST | `/api/execute` | `Workflow` | `{taskId: string}` | 开始执行工作流 |
| GET | `/api/execute/{taskId}` | - | `ExecutionState` | 查询执行状态（轮询） |
| DELETE | `/api/execute/{taskId}` | - | `-` | 停止执行 |

#### 请求/响应示例

**POST /api/execute** 请求体：
```json
{
  "name": "my_workflow",
  "version": "1.0",
  "nodes": [...],
  "edges": [...]
}
```

**GET /api/execute/{taskId}** 响应：
```json
{
  "status": "running",
  "taskId": "abc123",
  "progress": {"current": 2, "total": 5, "currentNode": "filter"},
  "logs": [
    {"timestamp": "2024-01-01T10:00:00Z", "level": "info", "message": "节点 input 执行完成", "nodeId": "input"}
  ],
  "result": null,
  "error": null,
  "failedNode": null
}
```

> **注意**：API 响应字段使用驼峰命名（camelCase），如 `taskId`、`currentNode`、`failedNode`。前端 `ExecutionState` 类型需匹配此格式。

#### main.py 路由设计

```python
# main.py
from fastapi import FastAPI
from engine import PluginLoader, WorkflowParser, Executor

app = FastAPI()

# 初始化插件加载器
plugin_loader = PluginLoader()
plugin_loader.scan("backend/nodes")

# 路由
@app.get("/api/nodes")
def get_nodes():
    return plugin_loader.get_all()

@app.get("/api/workflows")
def list_workflows():
    # 列出 workflows/ 目录下的 .workflow 文件
    ...

@app.get("/api/workflows/{name}")
def get_workflow(name: str):
    # 读取指定 .workflow 文件
    ...

@app.post("/api/workflows/{name}")
def save_workflow(name: str, workflow: Workflow):
    # 保存到 workflows/{name}.workflow
    ...

@app.post("/api/execute")
def execute(workflow: Workflow):
    task_id = str(uuid.uuid4())
    # 后台启动 Executor.run(task_id, workflow)
    return {"taskId": task_id}

@app.get("/api/execute/{task_id}")
def get_status(task_id: str):
    return StateManager().get(task_id)

@app.delete("/api/execute/{task_id}")
def stop_execution(task_id: str):
    # 停止任务
    ...
```

## 4. 目录结构

```
project/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/       # 组件
│   │   │   ├── DynamicNode.jsx   # 通用动态节点
│   │   │   ├── Toolbox.jsx      # 工具箱
│   │   │   ├── TopToolbar.jsx   # 顶部工具栏
│   │   │   ├── ConfigPanel.jsx   # 配置面板
│   │   │   └── StatusBar.jsx    # 底部状态栏
│   │   ├── hooks/           # React Hooks
│   │   └── useWorkflow.ts   # 工作流状态 + 执行轮询
│   ├── services/        # API 服务
│   │   └── api.ts       # HTTP 请求封装
│   ├── types/           # 类型定义
│   │   └── index.ts     # 前端数据结构
│   ├── App.tsx
│   └── main.tsx
│   └── package.json
├── backend/                  # FastAPI 后端
│   ├── main.py              # 入口
│   ├── engine/              # 执行引擎
│   │   ├── __init__.py
│   │   ├── models.py       # 所有 @dataclass 数据类型
│   │   ├── exceptions.py    # 自定义异常
│   │   ├── parser.py       # WorkflowParser
│   │   ├── graph.py        # TaskGraph
│   │   ├── state.py        # StateManager
│   │   ├── plugin_loader.py # PluginLoader
│   │   └── executor.py     # Executor
│   ├── nodes/               # 插件目录
│   │   ├── filter/          # 插件示例
│   │   │   ├── metadata.json
│   │   │   └── main.py
│   │   └── ...
│   └── workflows/           # 工作流存储
│       └── *.workflow
└── README.md
```

#### engine 模块说明

| 文件 | 类/内容 | 说明 |
|------|---------|------|
| `models.py` | Position, ConfigField, Port, Node, Edge, Workflow, LogEntry, Progress, TaskState, ExecutionContext | 所有数据结构 |
| `exceptions.py` | WorkflowValidationError | 自定义异常 |
| `parser.py` | WorkflowParser | 解析/保存工作流文件 |
| `graph.py` | TaskGraph | 构建节点依赖图 |
| `state.py` | StateManager | 管理任务执行状态 |
| `plugin_loader.py` | Plugin, PluginLoader | 插件加载和执行 |
| `executor.py` | Executor | 工作流执行器 |

#### frontend 模块说明

| 文件 | 类/内容 | 说明 |
|------|---------|------|
| `components/DynamicNode.jsx` | DynamicNode | 通用动态节点组件 |
| `components/Toolbox.jsx` | Toolbox | 工具箱组件 |
| `components/TopToolbar.jsx` | TopToolbar | 顶部工具栏 |
| `components/ConfigPanel.jsx` | ConfigPanel | 配置面板 |
| `components/StatusBar.jsx` | StatusBar | 底部状态栏 |
| `hooks/useWorkflow.js` | useWorkflow | 工作流状态 hook |
| `services/api.js` | - | HTTP API 封装 |
| `types/index.js` | - | 前端数据结构（Node, Edge, Workflow 等） |

## 5. 前端动态节点渲染

### 5.1 设计原则

前端只需 **一个通用节点组件**，根据 metadata.json 动态渲染：

```
插件 metadata.json  →  通用节点组件  →  动态渲染配置 + 连接点
```

新增插件或修改插件配置 → **无需修改前端代码**

### 5.2 动态表单映射

| metadata type | 前端渲染               |
| ------------- | ------------------ |
| `string`      | 文本输入框              |
| `number`      | 数字输入框              |
| `boolean`     | 复选框                |
| `file`        | 文件选择框              |
| `select`      | 下拉选择（需配 `options`） |

### 5.3 动态端口渲染

| metadata 字段 | 渲染内容                     |
| ----------- | ------------------------ |
| `inputs[]`  | 左侧 Handle（连接点），数量和名称来自数组 |
| `outputs[]` | 右侧 Handle（连接点），数量和名称来自数组 |

### 5.4 通用节点组件伪代码

```jsx
// DynamicNode.jsx
function DynamicNode({ data }) {
  return (
    <div className="node">
      <div className="node-header">{data.icon} {data.name}</div>

      {/* 动态渲染配置项 */}
      {data.config?.map(field => (
        <FormField key={field.key} field={field} />
      ))}

      {/* 动态渲染输入端口 */}
      {data.inputs?.map(input => (
        <Handle key={input.key} type="target" position={Position.Left} />
      ))}

      {/* 动态渲染输出端口 */}
      {data.outputs?.map(output => (
        <Handle key={output.key} type="source" position={Position.Right} />
      ))}
    </div>
  );
}
```

### 5.5 React Flow 注册

```jsx
import { DynamicNode } from './components/DynamicNode';

const nodeTypes = {
  dynamicNode: DynamicNode
};

nodes = apiNodes.map(node => ({
  id: node.id,
  type: 'dynamicNode',
  data: { ...node, configValues: {} },
  position: { x: 0, y: 0 }
}));
```

### 5.6 configValues 定义和流转

```
用户编辑配置 → useWorkflow state → 保存时写入 workflow 文件
     ↓
用户在前端修改配置
     ↓
configValues = { threshold: 0.8 }  // 前端 state
     ↓
保存工作流时
     ↓
node.config = configValues  // 合并回 node
```

**configValues**：前端运行时状态，存储用户当前的配置修改

**node.config**：工作流文件中的持久化配置

**流程**：

1. 加载工作流 → node.config → configValues
2. 用户修改配置 → configValues 更新
3. 保存工作流 → configValues → node.config（写回文件）

### 5.7 前端页面布局

```
┌──────────────────────────────────────────────────────────┐
│  TopToolbar（保存/加载/运行/停止/工作流选择）              │
├────────────┬─────────────────────────────┬───────────────┤
│            │                             │               │
│  Toolbox   │      WorkflowCanvas        │  ConfigPanel  │
│  (左侧)    │        (中上)               │  (右侧)       │
│  工具箱     │                             │  配置面板      │
│  可拖拽调整  │      可缩放/拖拽/连线       │  可拖拽调整    │
│            ├─────────────────────────────┤               │
│            │      BottomPanel            │               │
│            │       (中下)                │               │
│            │       日志面板               │               │
│            │       可拖拽调整              │               │
├────────────┴─────────────────────────────┴───────────────┤
│  StatusBar（执行状态/日志摘要）                           │
└──────────────────────────────────────────────────────────┘
```

#### 布局层级说明

```
App
├── TopToolbar        # 顶部工具栏
├── Layout            # 中间主区域（水平三栏）
│   ├── Toolbox       # 左侧：工具箱
│   ├── Middle        # 中间（垂直布局）
│   │   ├── WorkflowCanvas  # 中上：画布
│   │   └── BottomPanel     # 中下：日志面板
│   └── ConfigPanel   # 右侧：配置面板
└── StatusBar        # 底部状态栏
```

#### 面板尺寸

| 区域 | 默认尺寸 | 调整范围 | 说明 |
| ---- | -------- | -------- | ---- |
| Toolbox（左侧） | 220px | 150-400px | 可拖拽调整宽度 |
| ConfigPanel（右侧） | 300px | 200-500px | 可拖拽调整宽度 |
| BottomPanel（中下） | 150px | 80-400px | 可拖拽调整高度 |

#### 组件职责

| 组件 | 职责 |
| ---- | ---- |
| TopToolbar | 工作流选择、新建、保存、执行/停止按钮 |
| Toolbox | 插件分类列表，支持拖拽添加节点到画布 |
| WorkflowCanvas | React Flow 画布，节点拖拽、连线、位置调整 |
| ConfigPanel | 显示选中节点的配置项、输入端口、输出端口 |
| BottomPanel | 详细日志显示，支持过滤、自动滚动 |
| StatusBar | 简洁的执行状态和日志摘要 |

#### 布局说明

| 区域 | 宽度 | 内容 |
| ---- | ---- | ---- |
| 工具箱 | 可调 | 插件分类列表，可折叠 |
| 画布 | flex: 1 | React Flow，可缩放/拖拽/连线 |
| 配置面板 | 可调 | **选中节点时**显示配置，**无选中时**显示提示信息 |

#### 工具箱分组

工具箱按插件的 `category` 字段分组显示，各分组以 category 名称为标题，无额外 emoji 图标。

#### 配置面板内容

配置面板显示选中节点的以下信息：
- 节点名称和图标
- 节点描述
- **输入端口**（inputs）- 来自 metadata
- **输出端口**（outputs）- 来自 metadata
- **配置项**（config）- 来自 metadata，用户可编辑

#### 日志面板功能

BottomPanel 支持：
- 按级别过滤（debug/info/warn/error）
- 自动滚动
- 清空日志
- 显示日志来源标识（FE/前端 或 BE/后端）

### 5.8 前端数据类型（types/api.ts）

```typescript
// 插件元数据（来自 backend metadata.json）
export interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  icon: string;
  type: 'python' | 'exe' | 'bat';  // 插件执行类型
  entry: string;                   // 入口文件
  config: ConfigField[];
  inputs: Port[];
  outputs: Port[];
  config_mapping: Record<string, unknown>[] | null;
}

// 节点位置
export interface Position {
  x: number;
  y: number;
}

// 插件配置项（来自 metadata）
export interface ConfigField {
  key: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'select';
  default: unknown;
  options: string[] | null;
}

// 端口定义（来自 metadata）
export interface Port {
  key: string;
  name: string;
  type: 'file' | 'json' | 'string' | 'number';
}

// 节点数据（React Flow 节点 data 字段）
export interface NodeData extends PluginDefinition {
  configValues: Record<string, unknown>;
  position?: Position;
}

// 工作流数据（完整工作流）
export interface Workflow {
  name: string;
  version: string;
  nodes: NodeData[];
  edges: EdgeData[];
}

// 连线数据（React Flow Edge）
export interface EdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

// 任务执行状态
export interface ExecutionState {
  status: 'pending' | 'running' | 'done' | 'failed';
  taskId: string;
  progress: {
    current: number;
    total: number;
    currentNode: string | null;
  };
  logs: LogEntry[];
  result: Record<string, unknown> | null;
  error: string | null;
  failedNode: string | null;
}

// 日志条目
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  nodeId: string | null;
}

// 日志条目（前端内部使用，包含 source）
export interface FrontendLogEntry extends LogEntry {
  id: string;
  source: 'FE' | 'BE';
  level: 'debug' | 'info' | 'warn' | 'error';
}
```

> **类型说明**：`PluginDefinition` 来自后端 metadata.json，`NodeData` 继承 `PluginDefinition` 并添加 `configValues` 和 `position`。前端 `getNodes()` 返回 `PluginDefinition[]`，加载工作流后得到 `NodeData[]`。

### 5.9 API 服务设计（services/api.ts）

```typescript
const API_BASE = 'http://localhost:8000/api';

// 获取插件列表（工具箱数据源）
async function getNodes(): Promise<PluginDefinition[]> {
  const res = await fetch(`${API_BASE}/nodes`);
  if (!res.ok) throw new Error('获取节点列表失败');
  return res.json();
}

// 重新扫描插件目录
async function scanNodes(): Promise<{ message: string; loaded: number; failed: number }> {
  const res = await fetch(`${API_BASE}/nodes/scan`, { method: 'POST' });
  if (!res.ok) throw new Error('扫描插件失败');
  return res.json();
}

// 获取工作流列表
async function listWorkflows(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/workflows`);
  if (!res.ok) throw new Error('获取工作流列表失败');
  return res.json();
}

// 保存工作流
async function saveWorkflow(workflow: Workflow): Promise<void> {
  const res = await fetch(`${API_BASE}/workflows/${workflow.name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  if (!res.ok) throw new Error('保存工作流失败');
}

// 加载工作流
async function loadWorkflow(name: string): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/workflows/${name}`);
  if (!res.ok) throw new Error('加载工作流失败');
  return res.json();
}

// 执行工作流
async function executeWorkflow(workflow: Workflow): Promise<{ taskId: string }> {
  const res = await fetch(`${API_BASE}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  if (!res.ok) throw new Error('执行工作流失败');
  return res.json();
}

// 查询执行状态（轮询）
async function getExecutionStatus(taskId: string): Promise<ExecutionState> {
  const res = await fetch(`${API_BASE}/execute/${taskId}`);
  if (!res.ok) throw new Error('查询执行状态失败');
  return res.json();
}

// 停止执行
async function stopExecution(taskId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/execute/${taskId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('停止执行失败');
}
```

### 5.10 前端核心组件设计

**useWorkflow hook**

```typescript
// hooks/useWorkflow.ts
function useWorkflow() {
  // state
  workflow: Workflow;         // 当前工作流
  selectedNodeId: string | null;  // 选中的节点 ID（null 表示无选中）
  executionState: ExecutionState | null;  // 执行状态
  isLoading: boolean;         // 加载状态
  error: string | null;       // 错误信息

  // computed
  selectedNode: NodeData | null;  // 选中的节点数据

  // methods
  loadWorkflow(name: string): Promise<void>;
  saveWorkflow(): Promise<void>;
  executeWorkflow(): Promise<void>;
  stopExecution(): Promise<void>;
  selectNode(nodeId: string | null): void;
  updateNodeConfig(nodeId: string, configValues: Record<string, any>): void;
  addNode(plugin: NodeData, position: Position): void;
  removeNode(nodeId: string): void;
  addEdge(edge: EdgeData): void;
  removeEdge(edgeId: string): void;
}
```

**ConfigPanel 组件**

```typescript
// 右侧配置面板，选中节点时显示
interface ConfigPanelProps {
  node: NodeData | null;           // 选中的节点，无选中时为 null
  onUpdateConfig: (configValues: Record<string, any>) => void;
}

function ConfigPanel({ node, onUpdateConfig }: ConfigPanelProps) {
  // 布局规则（来自 5.7）：
  // - node !== null 时显示面板
  // - node === null 时隐藏面板
  // - 只显示 node.config 表单
  // - 不显示 inputs/outputs（那是节点的连接点）
}
```

**DynamicNode 组件（扩展性预留）**

```typescript
// 节点类型注册表（MVP 只支持 dynamicNode）
const nodeTypeMap: Record<string, React.ComponentType> = {
  dynamicNode: DynamicNode,  // 内置通用节点
  // 未来扩展：
  // customNode: CustomNode,
};

// 根据 metadata.frontend_component 返回对应组件
function getNodeComponent(frontendComponent?: string) {
  return nodeTypeMap[frontendComponent || 'dynamicNode'];
}

// DynamicNode Props
interface DynamicNodeProps {
  data: NodeData;  // 包含 config、inputs、outputs 定义
  selected: boolean;
}

// DynamicNode 内部渲染逻辑
function DynamicNode({ data, selected }: DynamicNodeProps) {
  // - 渲染 node.icon + node.name
  // - 根据 node.config 渲染对应表单项
  // - 根据 node.inputs 渲染左侧 Handle（连接点）
  // - 根据 node.outputs 渲染右侧 Handle（连接点）
}
```

### 5.11 错误处理机制

```
API 请求失败
     ↓
抛出异常 / 返回错误状态
     ↓
useWorkflow.error 存储错误信息
     ↓
StatusBar 组件显示错误提示（红色文字/Toast）
     ↓
用户可关闭错误提示，继续操作
```

***

## 6. 插件系统

### 6.1 插件结构

每个插件是一个文件夹，包含：

```
plugin_id/
├── metadata.json    # 插件描述
├── main.py          # Python 插件入口 (可选)
├── main.exe         # 或其他可执行文件 (可选)
└── ...              # 其他依赖文件
```

### 6.2 metadata.json 格式

```json
{
  "id": "filter",
  "name": "数据过滤器",
  "category": "process",
  "version": "1.0",
  "description": "根据阈值过滤数据",
  "icon": "🔍",
  "type": "python",
  "config": [
    {
      "key": "threshold",
      "name": "阈值",
      "type": "number",
      "default": 0.5
    }
  ],
  "inputs": [
    {"key": "data", "name": "输入数据", "type": "file"}
  ],
  "outputs": [
    {"key": "result", "name": "过滤结果", "type": "file"}
  ]
}
```

### 6.3 category 分组值

| 值         | 说明        |
| --------- | --------- |
| `input`   | 输入类节点     |
| `process` | 处理类节点     |
| `output`  | 输出类节点     |
| `tool`    | 工具类节点（默认） |

### 6.4 字段说明

| 字段          | 必填 | 说明                                   |
| ----------- | -- | ------------------------------------ |
| id          | 是  | 插件唯一标识                               |
| name        | 是  | 显示名称                                 |
| category    | 是  | 分组：`input`/`process`/`output`/`tool` |
| type        | 是  | `python` / `exe` / `bat` / `mcp`     |
| config      | 否  | 用户配置项（阈值、文件名等）                       |
| inputs      | 否  | 执行时的输入端口                             |
| outputs     | 否  | 执行后的输出端口                             |
| icon        | 否  | emoji 图标                             |
| description | 否  | 描述                                   |

### 6.5 配置/输入/输出类型

| type      | 说明    | 示例                      |
| --------- | ----- | ----------------------- |
| `string`  | 文本输入框 | `"default": "hello"`    |
| `number`  | 数字输入框 | `"default": 0.5`        |
| `boolean` | 复选框   | `"default": true`       |
| `file`    | 文件路径  | `"default": "data.csv"` |
| `select`  | 下拉选择  | `"options": ["a", "b"]` |

#### select 类型完整示例

```json
{
  "key": "mode",
  "name": "模式",
  "type": "select",
  "options": ["fast", "accurate"],
  "default": "fast"
}
```

### 6.6 节点 ID 生成规则

工作流中每个节点实例需要唯一 ID：

```
前端拖拽节点到画布时生成
格式: node_{uuid_short}
示例: node_a1b2c3d4
```

- ID 在工作流内唯一
- 同一个插件类型可以实例化多个节点
- 删除节点后 ID 不复用

### 6.7 插件扫描时机

```
后端启动时
       ↓
自动扫描 backend/nodes/ 目录下所有插件
       ↓
缓存节点列表到内存
       ↓
GET /api/nodes 返回缓存列表
       ↓
POST /api/nodes/scan 可手动触发重新扫描
```

### 6.8 并发控制

```
用户点击"运行"
       ↓
检查是否有任务正在执行
       ↓
有 → 返回 {error: "已有任务执行中", code: 409}
无 → 启动执行
```

### 6.9 执行超时处理

```
每个节点执行超时时间: 300 秒（可配置）
       ↓
超时 → 终止进程，标记任务失败
       ↓
返回 {status: "failed", error: "节点 xxx 执行超时"}
```

### 6.10 文件类型配置处理

当 `config` 中有 `type: "file"` 时：

```json
{
  "key": "input_file",
  "name": "输入文件",
  "type": "file",
  "file_type": "csv",
  "default": ""
}
```

| 字段          | 说明                              |
| ----------- | ------------------------------- |
| `file_type` | 限制文件类型（可选），如 `csv`、`json`、`txt` |

**文件路径处理**：

- 用户在前端选择文件，路径存入 `node.config.input_file`
- 执行时路径传入 `input.json.config`
- 插件直接使用该路径

***

### 6.11 数据类型声明与校验

#### 6.11.1 插件声明数据类型

```json
{
  "id": "filter",
  "inputs": [
    {"key": "data", "name": "输入数据", "type": "file", "accepts": ["csv", "json"]}
  ],
  "outputs": [
    {"key": "result", "name": "过滤结果", "type": "file", "produces": "csv"}
  ]
}
```

| 字段         | 说明                  |
| ---------- | ------------------- |
| `accepts`  | 接受哪些数据类型（数组），为空表示任意 |
| `produces` | 输出什么数据类型（字符串）       |

#### 6.11.2 前端连线校验

```
允许连接条件：source.produces ∈ target.accepts

例如：
  filter 输出 csv → output 接受 [csv, json]  ✅ 允许
  filter 输出 csv → image 输入 [png, jpg]   ❌ 禁止
```

#### 6.11.3 内置数据类型

| data\_type    | 说明       |
| ------------- | -------- |
| `csv`         | CSV 文本文件 |
| `json`        | JSON 文件  |
| `txt`         | 纯文本文件    |
| `png/jpg/pdf` | 图片/文档    |
| `any`         | 任意类型     |

#### 6.11.4 宽松解析（插件内部）

插件执行时对输入格式保持宽松：

```python
def main(input_path, output_path):
    with open(input_path) as f:
        raw = f.read()

    # 尝试多种格式解析
    if raw.startswith('{'):
        data = json.loads(raw)
    elif raw.startswith('['):
        data = json.loads(raw)
    else:
        data = parse_csv(raw)

    # 处理...
```

#### 6.11.5 后续：转换节点

当两个节点类型不兼容时，提供内置转换器：

| 转换节点          | 功能         |
| ------------- | ---------- |
| `csv_to_json` | CSV → JSON |
| `json_to_csv` | JSON → CSV |

***

## 7. 执行引擎

### 7.1 核心组件

| 组件               | 职责                   |
| ---------------- | -------------------- |
| `WorkflowParser` | 解析 .workflow 文件，验证结构 |
| `TaskGraph`      | 构建节点依赖图，管理执行状态       |
| `Executor`       | 按拓扑顺序执行节点，调用插件       |
| `StateManager`   | 存储任务状态，供前端轮询         |
| `PluginLoader`   | 扫描/加载/缓存插件，统一调用入口    |

### 7.2 执行流程

```
1. POST /api/execute
   ├── 创建 TaskGraph
   ├── 生成 task_id (uuid)
   ├── 任务状态设为 "pending"
   ├── 启动后台执行线程
   └── 返回 {task_id, status: "running"}

2. 后台执行
   ├── topological_sort() → [node_A, node_B, node_C]

   └── for node in order:
       ├── 状态更新: "running", current_node = node.id
       ├── 准备 input.json
       │   ├── config: 从 workflow nodes[] 取
       │   └── inputs: 从上游节点输出取
       ├── PluginLoader.execute(node)  # 统一调用
       │   ├── 成功 → 读取 output.json，记录输出路径
       │   └── 失败 → 停止，返回错误
       └── 清理临时文件

3. GET /api/execute/{task_id}
   ├── 从 StateManager 读取状态
   └── 返回 {status, progress, logs, result}
```

### 7.3 拓扑排序

**BFS（ Kahn 算法）**：

```
工作流：
  node_A → node_B → node_D
  node_A → node_C → node_D

edges:
  {source: A, target: B}
  {source: A, target: C}
  {source: B, target: D}
  {source: C, target: D}

拓扑排序结果：[A, B, C, D]
```

### 7.4 节点执行逻辑

```python
def execute_node(node, context, task_dir):
    plugin = PluginLoader.get_plugin(node.type)
    node_dir = plugin.path  # backend/nodes/filter/

    # 1. 准备输入
    input_data = {
        "config": node.config,
        "inputs": context.get_upstream_outputs(node.id)
    }
    input_path = f"{task_dir}/node_{node.id}_input.json"
    output_path = f"{task_dir}/node_{node.id}_output.json"
    write_json(input_path, input_data)

    # 2. 执行（由 PluginLoader 统一调用）
    output = PluginLoader.execute(plugin, input_path, output_path)
    if output["code"] != 0:
        raise PluginError(output["error"])

    return output["outputs"]
```

### 7.5 PluginLoader 接口

```python
class PluginLoader:
    @staticmethod
    def scan_nodes(nodes_dir: str) -> List[dict]:
        """扫描插件目录，返回所有节点元数据"""

    @staticmethod
    def get_plugin(plugin_id: str) -> Plugin:
        """获取插件实例（带缓存）"""

    @staticmethod
    def execute(plugin: Plugin, input_path: str, output_path: str) -> dict:
        """执行插件，返回 output.json 内容"""
        # 内部根据 plugin.type 调用对应执行器
```

**可测试性**：executor.py 通过 PluginLoader 接口调用，实际 subprocess 逻辑在 PluginLoader 内部，单元测试时可 mock PluginLoader。

### 7.6 插件执行器设计

```python
# 执行器工厂
class ExecutorFactory:
    @staticmethod
    def create(plugin_type: str) -> 'BaseExecutor':
        executors = {
            'python': PythonExecutor(),
            'exe': ExeExecutor(),
            'bat': BatExecutor(),
            'mcp': MCPExecutor(),
        }
        return executors.get(plugin_type, PythonExecutor())
```

#### PythonExecutor

```python
class PythonExecutor(BaseExecutor):
    def execute(self, plugin: Plugin, input_path: str, output_path: str) -> dict:
        main_file = os.path.join(plugin.path, 'main.py')
        result = subprocess.run(
            ['python', main_file, input_path, output_path],
            cwd=plugin.path,
            capture_output=True,
            text=True,
            timeout=300
        )
        # 捕获 stdout 作为日志
        logs = result.stdout.strip().split('\n') if result.stdout else []
        if result.returncode != 0:
            raise PluginError(result.stderr or '执行失败')
        return {
            'logs': logs,
            'outputs': json.load(open(output_path, 'r', encoding='utf-8'))
        }
```

#### ExeExecutor

```python
class ExeExecutor(BaseExecutor):
    def execute(self, plugin: Plugin, input_path: str, output_path: str) -> dict:
        main_exe = os.path.join(plugin.path, 'main.exe')
        result = subprocess.run(
            [main_exe, input_path, output_path],
            cwd=plugin.path,
            capture_output=True,
            text=True,
            timeout=300
        )
        logs = result.stdout.strip().split('\n') if result.stdout else []
        if result.returncode != 0:
            raise PluginError(result.stderr or '执行失败')
        return {
            'logs': logs,
            'outputs': json.load(open(output_path, 'r', encoding='utf-8'))
        }
```

#### BatExecutor

```python
class BatExecutor(BaseExecutor):
    def execute(self, plugin: Plugin, input_path: str, output_path: str) -> dict:
        main_bat = os.path.join(plugin.path, 'main.bat')
        result = subprocess.run(
            ['cmd', '/c', main_bat, input_path, output_path],
            cwd=plugin.path,
            capture_output=True,
            text=True,
            timeout=300
        )
        logs = result.stdout.strip().split('\n') if result.stdout else []
        if result.returncode != 0:
            raise PluginError(result.stderr or '执行失败')
        return {
            'logs': logs,
            'outputs': json.load(open(output_path, 'r', encoding='utf-8'))
        }
```

#### MCPExecutor（预留）

```python
class MCPExecutor(BaseExecutor):
    """MCP Server 执行器，后续实现"""
    def execute(self, plugin: Plugin, input_path: str, output_path: str) -> dict:
        raise NotImplementedError("MCP Executor 待实现")
```

### 7.7 工作目录

- 执行时 `cwd` = 插件目录（如 `backend/nodes/filter/`）
- 插件可用相对路径引用同目录下的资源

### 7.8 临时文件清理

```
执行目录结构：
  backend/executions/{task_id}/
    ├── node_node1_input.json
    ├── node_node1_output.json
    └── {中间生成的文件}...

执行完成后：删除整个 task_id 目录
```

### 7.9 日志收集方案

#### 插件日志（用户可见）

插件通过 print() 输出到 stdout，后端捕获：

```python
# 插件 main.py
def main(input_path: output_path):
    print("开始处理数据...", flush=True)  # → 用户可见日志
    # 处理...
    print("处理完成", flush=True)  # → 用户可见日志
```

```python
# 后端 executor.py
result = subprocess.run(
    ["python", "main.py", input_path, output_path],
    cwd=node_dir,
    capture_output=True,
    text=True,
    timeout=300
)
# result.stdout 包含所有 print 内容
```

#### 框架日志（调试用）

关键位置需打印框架日志，便于排查问题：

```python
import logging
logger = logging.getLogger(__name__)

# 1. 插件扫描
logger.info(f"扫描插件目录: {nodes_dir}")
logger.info(f"加载插件: {plugin_id}, type={plugin.type}")

# 2. 工作流解析
logger.info(f"加载工作流: {workflow_name}, nodes={len(nodes)}")
logger.warning(f"工作流缺少必要的config字段: node_id={node_id}")

# 3. 执行引擎
logger.info(f"开始执行任务: task_id={task_id}")
logger.info(f"拓扑排序结果: {order}")
logger.debug(f"准备输入: node={node_id}, input_path={input_path}")
logger.error(f"节点执行失败: node={node_id}, error={error}")

# 4. API 请求
logger.info(f"POST /api/execute task_id={task_id}")
logger.info(f"GET /api/execute/{task_id} status={status}")
```

#### 日志级别使用

| 级别      | 使用场景                |
| ------- | ------------------- |
| DEBUG   | 详细输入输出、变量值          |
| INFO    | 请求开始/结束、重要步骤        |
| WARNING | 工作流缺少字段、类型不匹配（但可继续） |
| ERROR   | 执行失败、文件不存在、超时       |

### 7.10 失败策略

```
节点执行失败时：
1. 停止后续节点执行
2. 状态设为 "failed"
3. 返回 {status: "failed", error: "...", failed_node: "node_id"}
```

### 7.11 核心类设计

#### 设计原则

- 使用 `@dataclass` 定义数据结构
- 核心类的方法只列出签名，不写实现，用伪代码或文字描述关键逻辑
- 异常类单独定义

#### 公共数据类型

```python
@dataclass
class Position:
    x: int
    y: int

@dataclass
class ConfigField:
    key: str
    name: str
    type: str  # string / number / boolean / file / select
    default: Any = None
    options: List[str] = None  # select 类型的选项

@dataclass
class Port:
    key: str
    name: str
    type: str  # file / json / string / number

@dataclass
class Node:
    id: str
    type: str  # 插件 ID
    position: Position
    config: dict  # 用户配置 {key: value}

@dataclass
class Edge:
    id: str
    source: str  # 源节点 ID
    source_output: str  # 源输出 key
    target: str  # 目标节点 ID
    target_input: str  # 目标输入 key

@dataclass
class Workflow:
    name: str
    version: str
    created_at: str
    nodes: List[Node]
    edges: List[Edge]

@dataclass
class LogEntry:
    timestamp: str  # ISO 格式
    level: str  # INFO / WARNING / ERROR
    message: str
    node_id: str = None  # 可选，关联的节点

@dataclass
class Progress:
    current: int  # 当前第几个节点
    total: int    # 总节点数
    current_node: str = None

@dataclass
class TaskState:
    task_id: str
    status: str  # pending / running / done / failed
    progress: Progress
    logs: List[LogEntry]
    result: dict
    error: str = None
    failed_node: str = None

@dataclass
class ExecutionContext:
    """执行上下文，存储各节点输出，供下游节点使用"""
    outputs: Dict[str, Dict[str, Any]]  # node_id -> {output_key: value}
```

#### 异常类

```python
class WorkflowValidationError(Exception):
    """工作流验证失败，包含错误列表"""
    def __init__(self, message: str, errors: List[str] = None)
```

#### 核心类

**WorkflowParser** - 工作流解析器

```python
class WorkflowParser:
    @staticmethod
    def parse(file_path: str) -> Workflow:
        """读取 .workflow 文件，解析 JSON，返回 Workflow 对象"""

    @staticmethod
    def validate(workflow: Workflow) -> None:
        """检查节点是否存在、必填字段、循环依赖等，失败抛 WorkflowValidationError"""

    @staticmethod
    def save(workflow: Workflow, file_path: str) -> None:
        """将 Workflow 对象序列化为 JSON，写入文件"""
```

**TaskGraph** - 节点依赖图

```python
class TaskGraph:
    def __init__(self, workflow: Workflow):
        self.workflow = workflow
        self.graph: Dict[str, List[str]] = {}  # 下游 adjacency list
        self.reverse_graph: Dict[str, List[str]] = {}  # 上游 adjacency list
        self.in_degree: Dict[str, int] = {}    # 入度

    def build(self) -> None:
        """遍历 edges 构建 graph 和 reverse_graph，计算 in_degree"""

    def topological_sort(self) -> List[str]:
        """Kahn 算法：用队列处理入度为 0 的节点，返回排序后的节点 ID 列表"""

    def get_upstream(self, node_id: str) -> List[str]:
        """返回直接上游节点 ID 列表"""

    def get_downstream(self, node_id: str) -> List[str]:
        """返回直接下游节点 ID 列表"""
```

**StateManager** - 任务状态管理器（单例）

```python
class StateManager:
    _instance = None

    def __new__(cls):
        """单例模式"""
        
    def create(self, task_id: str) -> TaskState:
        """创建新 TaskState，初始状态为 pending"""

    def get(self, task_id: str) -> TaskState:
        """根据 task_id 查询状态，不存在返回 None"""

    def update(self, task_id: str, **kwargs) -> None:
        """更新指定任务的状态字段"""
```

**Plugin** - 插件数据模型

```python
@dataclass
class Plugin:
    id: str
    name: str
    category: str  # input / process / output
    version: str
    type: str  # python / exe / bat / mcp
    config: List[ConfigField]
    inputs: List[Port]
    outputs: List[Port]
    path: str  # 插件目录路径
```

**PluginLoader** - 插件加载器

```python
class PluginLoader:
    _cache: Dict[str, Plugin] = {}
    _initialized: bool = False

    @classmethod
    def scan(cls, nodes_dir: str) -> List[Plugin]:
        """遍历 nodes_dir 子目录，读取每个 metadata.json，构建 Plugin 对象并缓存"""

    @classmethod
    def get(cls, plugin_id: str) -> Plugin:
        """从缓存获取插件，未初始化抛异常"""

    @classmethod
    def execute(cls, plugin: Plugin, input_path: str, output_path: str) -> dict:
        """根据 plugin.type 调用对应执行器，返回 output.json 内容"""
```

**Executor** - 工作流执行器

```python
class Executor:
    def __init__(self, workflow: Workflow):
        self.workflow = workflow
        self.task_graph = TaskGraph(workflow)
        self.state_manager = StateManager()
        self.context = ExecutionContext(outputs={})

    def run(self, task_id: str) -> None:
        """后台线程执行：
        1. 创建任务状态
        2. build() + topological_sort()
        3. 遍历节点：
           - 更新状态为 running
           - 准备 input.json（config + 上游输出）
           - PluginLoader.execute()
           - 读取 output.json，存入 context.outputs
           - 记录日志
        4. 全部成功则状态置为 done，失败则置为 failed
        """
```

#### 类关系图

```
WorkflowParser
    ↓ parse/save
    ↓
Workflow (nodes, edges)
    ↓ 构建
    ↓
TaskGraph ──────────────────────────────→ reverse_graph (反向查找上游)
    │ topological_sort
    ↓
Executor
    │ 调用
    ↓
PluginLoader ───→ Plugin (config[], inputs[], outputs[])
    │
    ↓ execute()
Plugin (type: python/exe/bat/mcp)

StateManager (单例，管理所有 TaskState)
```

#### 实例变量一览

| 类 | 实例变量 |
|---|---------|
| `TaskGraph` | workflow, graph, reverse_graph, in_degree |
| `StateManager` | _states |
| `PluginLoader` | _cache, _initialized |
| `Executor` | workflow, task_graph, state_manager, context |

***

## 8. 数据流转

### 8.1 统一接口

所有插件统一通过**临时 JSON 文件**传递数据：

```
input.json  →  插件执行  →  output.json
```

### 8.2 input.json 格式

```json
{
  "config": {
    "threshold": 0.5
  },
  "inputs": {
    "data": "path/to/input.csv"
  }
}
```

### 8.3 output.json 格式

```json
{
  "code": 0,
  "outputs": {
    "result": "path/to/output.csv"
  },
  "error": null
}
```

- `code`: 0 表示成功，非 0 表示失败
- `error`: 错误信息，成功时为 null

### 8.4 数据传递

1. 前端连线确定数据流向：`node_A.outputs.result → node_B.inputs.data`
2. 后端按拓扑顺序执行节点
3. 每个节点：
   - 写入 `input.json`（config + 上游输出文件路径）
   - 执行插件
   - 读取 `output.json`
   - 将输出路径传给下游节点

***

## 9. 工作流文件格式 (.workflow)

```json
{
  "name": "我的工作流",
  "version": "1.0",
  "created_at": "2024-01-01T00:00:00Z",
  "nodes": [
    {
      "id": "node_1",
      "type": "filter",
      "position": {"x": 100, "y": 200},
      "config": {"threshold": 0.5}
    },
    {
      "id": "node_2",
      "type": "output",
      "position": {"x": 300, "y": 200},
      "config": {}
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "source_output": "result",
      "target": "node_2",
      "target_input": "data"
    }
  ]
}
```

## 10. Python 插件示例

### filter/main.py

```python
import json
import sys

def main(input_path: str, output_path: str):
    with open(input_path) as f:
        data = json.load(f)

    threshold = data["config"]["threshold"]
    input_file = data["inputs"]["data"]

    # 读取输入文件并过滤
    with open(input_file) as f:
        lines = f.readlines()
    filtered = [l for l in lines if float(l.strip()) > threshold]

    # 写入输出文件
    output_file = output_path.replace(".json", "_output.csv")
    with open(output_file, "w") as f:
        f.writelines(filtered)

    # 写入标准输出格式
    with open(output_path, "w") as f:
        json.dump({
            "code": 0,
            "outputs": {"result": output_file},
            "error": None
        }, f)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
```

## 11. 插件类型处理

| 类型       | 执行方式                                            |
| -------- | ----------------------------------------------- |
| `python` | 执行 `python main.py {input_path} {output_path}`  |
| `exe`    | 执行 `main.exe {input_path} {output_path}`        |
| `bat`    | 执行 `cmd /c main.bat {input_path} {output_path}` |
| `mcp`    | 通过 MCP SDK 调用远程工具                               |

## 12. 待定/后续功能

- [ ] Tauri 桌面壳（打包成独立应用）
- [ ] 用户认证（多用户支持）
- [ ] 插件市场（分享/下载插件）
- [ ] 循环/条件分支支持
- [ ] MCP Server 原生支持
- [ ] **WebSocket 实时日志**（将后端 cmd 窗口搬到前端，实时显示执行过程）
- [ ] **第三方工具配置文件映射**（config\_file + config_mapping 双向绑定）
- [ ] **工作流列表加载 UI**（点击加载弹出列表，选择后加载工作流）
- [ ] **全局配置页面**（插件目录、超时时间等）
- [ ] **前端组件扩展**（插件自带前端组件）

## 13. 开发顺序

### 推荐开发顺序

```
1. 后端核心（执行引擎）
   ├── PluginLoader（扫描/加载/执行插件）
   ├── graph.py（拓扑排序）
   └── executor.py（节点执行）

2. 后端 API 层
   ├── GET /api/nodes（返回插件列表）
   ├── POST /api/workflows（保存）
   ├── GET /api/workflows/:name（加载）
   └── POST /api/execute + GET /api/execute/:task_id

3. 前端搭架子
   ├── React 项目初始化
   ├── React Flow 集成
   ├── 工具箱、画布布局
   └── 用 mock 数据跑通 UI

4. 前后端联调
   ├── 对接真实 API
   └── 端到端测试
```

### 或交替开发

```
阶段1: 后端 PluginLoader + 执行引擎（核心逻辑）
阶段2: 前端基础 UI（mock 数据）
阶段3: 后端 API 接口
阶段4: 前后端联调
```

## 14. MVP 简化说明

### 14.1 当前 MVP 简化点

| 功能      | MVP 处理方式           |
| ------- | ------------------ |
| 全局配置页   | 硬编码或 `.env` 文件     |
| 前端插件化   | 仅配置驱动，不支持插件自带前端组件  |
| 多用户     | 单用户本地使用            |
| 工作流管理   | 保存/加载，无重命名/复制/版本历史 |
| 执行日志    | 轮询获取，无实时 WebSocket |
| 循环/条件分支 | 仅线性流程              |

### 14.2 前端扩展点预留（未来）

#### 字段定义

```json
{
  "id": "filter",
  "name": "数据过滤器",
  "frontend_component": "FilterNode",  // 预留字段
  ...
}
```

- MVP 忽略该字段，使用内置通用组件渲染
- 后续可实现组件注册机制，支持插件自带 React 组件

#### 节点类型注册机制

```javascript
// frontend/src/App.jsx
const nodeTypeMap = {
  dynamicNode: DynamicNode,  // 内置通用节点
  // 未来扩展：
  // chartNode: ChartNode,
  // inputNode: InputNode,
};

function getNodeComponent(frontend_component) {
  return nodeTypeMap[frontend_component] || nodeTypeMap.dynamicNode;
}

// 渲染时
const Component = getNodeComponent(metadata.frontend_component);
<Component data={nodeData} />
```

- 前端手动维护 `nodeTypeMap` 映射表
- 插件不自带组件注册逻辑
- 新增节点类型需前端手动添加映射

### 13.3 内置组件库（当前）

| 组件          | 支持的 metadata type |
| ----------- | ----------------- |
| TextInput   | `string`          |
| NumberInput | `number`          |
| Checkbox    | `boolean`         |
| FilePicker  | `file`            |
| Select      | `select`          |

## 15. MVP 执行状态方案（轮询）

### 15.1 执行流程

```
POST /api/execute          →  返回 {task_id: "xxx", status: "running"}
GET  /api/execute/{task_id} →  返回 {status: "running", progress: "node_2/5", logs: [...]}
GET  /api/execute/{task_id} →  返回 {status: "done", result: {...}, logs: [...]}
```

### 15.2 执行状态数据结构

```json
{
  "task_id": "abc123",
  "status": "running",
  "progress": {
    "current_node": "filter",
    "total_nodes": 5,
    "completed_nodes": 2
  },
  "logs": [
    {"node": "input", "type": "info", "message": "读取文件 data.csv 成功"},
    {"node": "filter", "type": "info", "message": "开始过滤数据..."},
    {"node": "filter", "type": "error", "message": "阈值配置错误"}
  ],
  "result": null
}
```

### 15.3 后续升级：SSE → WebSocket

MVP 用轮询简单实现后，可升级为：

- **SSE**：后端推送日志，前端实时显示（中等工作量）
- **WebSocket**：完整双向通信，支持后端 cmd 窗口投射到前端（推荐后续方案）

## 16. 第三方工具配置映射（预留接口）

### 16.1 metadata.json 预留字段

```json
{
  "id": "third_party_tool",
  "config_file": {
    "path": "tool.conf",
    "format": "json"
  },
  "config_mapping": [
    {"key": "model_path", "label": "模型路径", "type": "file"},
    {"key": "batch_size", "label": "批次大小", "type": "number"}
  ]
}
```

### 16.2 支持格式

| format | 解析                            |
| ------ | ----------------------------- |
| `json` | `json.load()` / `json.dump()` |
| `ini`  | `configparser`                |
| `yaml` | `pyyaml`                      |

### 16.3 后续实现要点

- 读取：框架解析 config\_file，根据 config\_mapping 生成 UI
- 保存：框架将用户修改回写到 config\_file（需备份原文件）
- 嵌套结构：`config_mapping.key` 支持点号路径如 `"model.options.threshold"`

## 17. 讨论记录

### Q: 插件之间数据怎么流转？

A: 统一通过临时文件传递，所有插件都遵循 input.json → 执行 → output.json 的模式。

### Q: exe 是命令行形式，python可以是函数，怎么统一？

A: 约定 Python 插件入口是 `main(input_path, output_path)` 函数，通过 subprocess 调用。

### Q: 后面可能接 MCP Server 怎么处理？

A: metadata.json 中 type 设为 `mcp`，后端通过 MCP SDK 调用。

### Q: 节点分组的 category 是后端返回还是前端定义？

A: **后端返回**。metadata.json 里定义 `category` 字段（如 `"process"`），后端扫描插件时读取，API 返回给前端。前端按 category 分组渲染工具箱。

### Q: configValues 是什么？和 node.config 有什么区别？

A: - `node.config`：工作流文件中的持久化配置
   - `configValues`：前端运行时 state，存储用户当前修改
   - 流程：加载工作流 → node.config → configValues → 用户修改 → 保存时 configValues → node.config

### Q: MVP 是否需要工作流列表加载 UI？

A: **先不做**，MVP 点击"加载"可以简单实现文件选择对话框（HTML input）。工作流列表弹窗移到待办。

### Q: 执行引擎的日志方案？

A: 两类日志：
   - **插件日志**：插件通过 print() 输出，捕获到 stdout，返回给前端用户可见
   - **框架日志**：通过 Python logging 模块输出，关键位置加 INFO/DEBUG/ERROR 日志，便于排查问题

### Q: 前端组件可测试性？

A: MVP 遵循不过度设计原则，**不做单元测试**。后续按需添加 jest + testing-library。

### Q: 节点类型如何扩展？

A: 前端手动维护 `nodeTypeMap` 映射表。metadata.json 的 `frontend_component` 字段预留，MVP 忽略。后续新增节点类型需前端手动添加映射。

---

*文档版本：v0.2*
*最后更新：2024-01-01*
