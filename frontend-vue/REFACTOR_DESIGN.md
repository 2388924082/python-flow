# 前端重构设计方案 (Vue Flow)

## 1. 重构目标

- 前端框架：React → Vue3
- 流程图库：`@xyflow/react` → **Vue Flow**
- 交互优化：节点即配置页面，去除右侧面板

## 2. 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│                      TopToolbar                              │
├────────┬────────────────────────────────────────────────────┤
│ 文件   │ 悬浮  │                                             │
│ 列表   │ 工具  │                                             │
│ 200px  │ 栏   │              Vue Flow Canvas                 │
│ (可折叠)│ 48px │                                             │
│       │(悬浮)│                                             │
├────────┴──────┴────────────────────────────────────────────┤
│  BottomPanel / 日志 (高度可调)                               │
└─────────────────────────────────────────────────────────────┘
```

### 区域说明

| 区域 | 尺寸 | 功能 |
|------|------|------|
| TopToolbar | 固定高度 | 新建/保存/执行等操作 |
| 文件列表 | 200px (可折叠) | 显示 .workflow 文件，双击打开 |
| 悬浮工具栏 | 48px 宽 (悬浮) | 插件节点拖拽到画布 |
| 画布 | 自适应 | Vue Flow 主区域 |
| 底部日志 | 80-400px (可调) | 执行日志 |

## 3. 文件列表组件

### 功能需求
- 显示 `backend/workflows/` 目录下的 `.workflow` 文件
- 双击文件打开工作流（直接加载，替换当前）
- 可折叠收起，仅显示图标

### 交互
- 单击选中文件
- 双击打开文件（如有未保存更改则弹窗确认）
- 右键菜单（可选）：重命名、删除

## 4. 悬浮工具栏组件

### 功能需求
- 显示所有插件节点（来自 `/api/nodes`）
- 节点可拖拽到画布
- 悬浮定位，不影响画布操作

### 交互
- 拖拽节点到画布创建实例
- 悬停显示节点名称 tooltip

## 5. 节点组件设计

### 节点结构（动态渲染）

```
┌────────────────────────────────┐
│  [图标] NodeName    [⋮菜单]   │  ← Header: icon + name 来自 metadata
├────────────────────────────────┤
│  field1: [___________]        │  ← config 动态渲染
│  field2: [___________]        │
│  field3: [dropdown▼]          │
├────────────────────────────────┤
│     [▶ 执行]  [🗑 删除]        │  ← Footer: 操作按钮
└────────────────────────────────┘
```

### 节点元数据 (metadata.json)

```json
{
  "id": "input",
  "name": "数据输入",
  "icon": "📥",
  "category": "input",
  "config": [
    { "key": "data", "name": "输入数据 (JSON)", "type": "string", "default": "[]" },
    { "key": "format", "name": "格式", "type": "select", "options": ["json", "csv"], "default": "json" }
  ],
  "inputs": [{ "key": "data", "name": "数据" }],
  "outputs": [{ "key": "data", "name": "数据" }]
}
```

### 支持的配置类型

| type | 渲染组件 |
|------|----------|
| `string` | 单行输入框 |
| `text` | 多行文本框 |
| `number` | 数字输入框 |
| `boolean` | 复选框 |
| `select` | 下拉选择 |

### 节点状态

| 状态 | 外观 | 交互 |
|------|------|------|
| 默认 | 显示配置名/关键值 | 单击选中，连线操作 |
| 编辑态 | 所有输入框可编辑 | 直接修改，实时保存 |
| 执行中 | 显示进度/结果 | 禁用编辑 |

## 6. 技术实现要点

### Vue Flow 集成
- 使用 `vue-flow` 包
- 自定义节点类型
- 边/连线样式定制

### 状态管理
- Vue3 Composition API + Pinia（可选）
- 工作流状态：节点、边、配置值
- 文件列表状态

### API 交互（保持不变）
- `GET /api/nodes` - 获取插件列表
- `GET /api/workflows` - 获取工作流列表
- `GET /api/workflows/{name}` - 加载工作流
- `POST /api/workflows/{name}` - 保存工作流
- `POST /api/execute` - 执行工作流
- `GET /api/execute/{taskId}` - 查询执行状态

## 7. 重构阶段

### Phase 1: 基础搭建
- 创建 Vue3 + Vite 项目
- 安装 vue-flow
- 配置基础布局框架

### Phase 2: 核心组件
- 实现文件列表组件
- 实现悬浮工具栏
- 实现动态节点组件

### Phase 3: 画布集成
- Vue Flow 画布集成
- 拖拽创建节点
- 节点连线

### Phase 4: 功能完善
- 工作流保存/加载
- 执行功能对接
- 日志面板对接

## 8. 文件结构 (规划)

```
frontend/
├── src/
│   ├── components/
│   │   ├── TopToolbar.vue
│   │   ├── FileList.vue          # 新增
│   │   ├── FloatingToolbar.vue   # 新增
│   │   ├── WorkflowCanvas.vue
│   │   ├── BottomPanel.vue
│   │   └── nodes/
│   │       └── DynamicNode.vue    # 新增
│   ├── composables/
│   │   ├── useWorkflow.ts
│   │   └── useResize.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── api.ts
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 9. 原始设计保留要点

### 9.1 动态节点渲染

- **一个通用节点组件**，根据 `metadata.json` 动态渲染
- **新增插件无需修改前端代码**

### 9.2 动态表单映射

| metadata type | 渲染组件 |
|--------------|---------|
| `string` | 单行输入框 |
| `text` | 多行文本框 |
| `number` | 数字输入框 |
| `boolean` | 复选框 |
| `file` | 文件选择框 |
| `select` | 下拉选择 |

### 9.3 动态端口渲染

| metadata 字段 | 渲染内容 |
|-------------|---------|
| `inputs[]` | 左侧 Handle（连接点），数量和名称来自数组 |
| `outputs[]` | 右侧 Handle（连接点），数量和名称来自数组 |

### 9.4 configValues 流转机制

```
加载工作流 → node.config → configValues
用户修改 → configValues 更新
保存工作流 → configValues → node.config (写回文件)
```

### 9.5 状态管理 (useWorkflow)

```typescript
// state
workflow: Workflow;              // 当前工作流
selectedNodeId: string | null;   // 选中的节点 ID
executionState: ExecutionState | null;  // 执行状态
isLoading: boolean;              // 加载状态
error: string | null;            // 错误信息

// methods
loadWorkflow(name: string): Promise<void>;
saveWorkflow(): Promise<void>;
executeWorkflow(): Promise<void>;
stopExecution(): Promise<void>;
selectNode(nodeId: string | null): void;
updateNodeConfig(nodeId: string, configValues: Record<string, any>): void;
addNode(plugin: PluginDefinition, position: Position): void;
removeNode(nodeId: string): void;
addEdge(edge: EdgeData): void;
removeEdge(edgeId: string): void;
```

### 9.6 API 服务（保持不变）

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/nodes` | 获取插件列表 |
| GET | `/api/workflows` | 获取工作流列表 |
| GET | `/api/workflows/{name}` | 加载工作流 |
| POST | `/api/workflows/{name}` | 保存工作流 |
| POST | `/api/execute` | 执行工作流 |
| GET | `/api/execute/{taskId}` | 查询执行状态（轮询） |
| DELETE | `/api/execute/{taskId}` | 停止执行 |

### 9.7 错误处理机制

```
API 请求失败
     ↓
抛出异常 / 返回错误状态
     ↓
error 存储错误信息
     ↓
StatusBar / BottomPanel 显示错误提示
     ↓
用户可关闭错误提示，继续操作
```

### 9.8 数据类型定义

```typescript
// 插件元数据（来自 backend metadata.json）
interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  icon: string;
  type: 'python' | 'exe' | 'bat';
  entry: string;
  config: ConfigField[];
  inputs: Port[];
  outputs: Port[];
}

// 配置项
interface ConfigField {
  key: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'select';
  default: unknown;
  options: string[] | null;
}

// 端口定义
interface Port {
  key: string;
  name: string;
  type: 'file' | 'json' | 'string' | 'number';
}

// 节点数据
interface NodeData extends PluginDefinition {
  configValues: Record<string, unknown>;
  position?: Position;
}

// 工作流数据
interface Workflow {
  name: string;
  version: string;
  nodes: NodeData[];
  edges: EdgeData[];
}

// 执行状态
interface ExecutionState {
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
```

## 10. 设计决策

### 10.1 拖拽实现

- **采用 Vue Flow 内置拖拽机制**
- FloatingToolbar 仅作为节点展示区，不负责拖拽逻辑
- 拖拽创建节点流程：
  1. 用户从工具栏拖动节点
  2. Vue Flow `onDragOver` 事件阻止默认行为
  3. `onDrop` 事件触发，创建实际节点
  4. 节点位置 = 鼠标释放位置

```typescript
// Vue Flow 拖拽配置
const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'move';
};

const onDrop = (event: DragEvent, position: Position) => {
  const pluginId = event.dataTransfer?.getData('application/vueflow');
  const plugin = plugins.find(p => p.id === pluginId);
  if (plugin) {
    addNode(plugin, position);
  }
};
```

### 10.2 编辑模式

- **单文件编辑**（无多 Tab）
- 双击文件列表中的文件 → 直接加载并替换当前工作流
- 如有未保存更改 → 弹窗确认是否放弃

### 10.3 节点高度限制

- 节点最大高度 **300px**
- 超出最大高度时，内部配置区域 **纵向滚动**
- 避免节点过大遮挡画布和连线

### 10.4 状态管理策略

- **优先使用 Vue3 Composition API** (`reactive` / `ref`)
- 如项目复杂度上升，再引入 **Pinia**
- 避免过早优化

### 10.5 节点状态与交互

| 状态 | 配置项 | 操作按钮 | 连线 |
|------|--------|----------|------|
| 默认 | 可编辑 | 显示 | 可连接 |
| 执行中 | 禁用 | 禁用 | 禁用 |
| 完成 | 可编辑 | 显示 | 可连接 |
| 失败 | 可编辑 | 显示 | 可连接 |

### 10.6 节点菜单操作

| 操作 | 说明 |
|------|------|
| 删除节点 | 移除节点及其所有连线 |
| 复制节点 | 复制节点及其配置，位置偏移 |
| 执行单个节点 | 独立运行该节点（不考虑连线） |

### 10.7 关键功能优先级

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 基础拖拽连线 | P0 | MVP 必须 |
| 工作流保存/加载 | P0 | MVP 必须 |
| 动态节点渲染 | P0 | MVP 必须 |
| 执行与状态轮询 | P0 | MVP 必须 |
| 日志面板 | P1 | 重要但可简化 |
| Undo/Redo | P2 | 建议实现 |
| 自动保存 | P2 | 防止意外丢失 |
| 键盘快捷键 | P2 | 提升效率 |
| 节点复制粘贴 | P3 | 可后续补充 |
| 右键菜单 | P3 | 可后续补充 |

### 10.8 测试策略

| 层级 | 工具 | 说明 |
|------|------|------|
| 组件测试 | Vitest + Vue Test Utils | 测试组件渲染和交互 |
| 集成测试 | Playwright | E2E 测试关键流程 |
| API 测试 | 复用后端测试 | 不重复造轮子 |

### 10.9 样式与主题

- **CSS 变量**：统一管理颜色、间距等
- **深色/浅色主题**：预留支持（可选）
- **响应式**：优先桌面端，最小宽度 1024px

### 10.10 目录结构（最终版）

```
frontend-vue/
├── src/
│   ├── components/
│   │   ├── TopToolbar.vue
│   │   ├── FileList.vue
│   │   ├── FloatingToolbar.vue
│   │   ├── WorkflowCanvas.vue
│   │   ├── BottomPanel.vue
│   │   └── nodes/
│   │       └── DynamicNode.vue
│   ├── composables/
│   │   ├── useWorkflow.ts
│   │   ├── useResize.ts
│   │   └── useExecution.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── api.ts
│   ├── utils/
│   │   └── logger.ts
│   ├── styles/
│   │   ├── variables.css
│   │   └── main.css
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── vitest.config.ts
```

### 10.11 文件职责

| 文件 | 职责 |
|------|------|
| `App.vue` | 根组件，布局组合 |
| `TopToolbar.vue` | 新建/保存/执行按钮 |
| `FileList.vue` | 左侧文件列表 |
| `FloatingToolbar.vue` | 悬浮工具栏（节点展示） |
| `WorkflowCanvas.vue` | Vue Flow 画布封装 |
| `BottomPanel.vue` | 日志面板 |
| `nodes/DynamicNode.vue` | 动态节点组件 |
| `composables/useWorkflow.ts` | 工作流状态管理 |
| `composables/useResize.ts` | 面板拖拽 resize 逻辑 |
| `composables/useExecution.ts` | 执行状态轮询逻辑 |
| `services/api.ts` | API 请求封装 |
| `types/api.ts` | TypeScript 类型定义 |
| `utils/logger.ts` | 日志工具 |
| `styles/variables.css` | CSS 变量（颜色/间距） |
| `styles/main.css` | 全局样式/重置 |

## 11. 前端扩展性预留

### 11.1 节点组件注册表

```typescript
// 节点类型映射表，支持未来扩展
const nodeTypeMap: Record<string, Component> = {
  dynamicNode: DynamicNode,    // 通用动态节点（当前）
  // rpaNode: RPATaskNode,    // RPA 任务节点（预留）
  // mcpNode: MCPNode,        // MCP Server 节点（预留）
  // httpNode: HTTPNode,      // HTTP 请求节点（预留）
};

// 根据 metadata.frontend_component 获取对应组件
function getNodeComponent(frontendComponent?: string) {
  return nodeTypeMap[frontendComponent || 'dynamicNode'];
}
```

### 11.2 metadata.json 扩展字段

```json
{
  "id": "rpa_task",
  "name": "RPA 任务",
  "type": "rpa",
  "frontend_component": "rpaNode",
  "runtime": "uipath",
  "config": [
    { "key": "workflow", "name": "工作流文件", "type": "file" },
    { "key": "app", "name": "目标应用", "type": "select", "options": ["Chrome", "Excel", "Outlook"] }
  ],
  "inputs": [...],
  "outputs": [...]
}
```

### 11.3 节点类型分类

| type | 说明 | 组件 | 状态 |
|------|------|------|------|
| `python` | Python 脚本 | dynamicNode | 当前 |
| `exe` | Windows 可执行 | dynamicNode | 当前 |
| `bat` | 批处理脚本 | dynamicNode | 当前 |
| `rpa` | RPA 流程 | rpaNode | 预留 |
| `mcp` | MCP Server | mcpNode | 预留 |
| `http` | HTTP 请求 | httpNode | 预留 |

### 11.4 RPA 节点特殊 UI

```
┌────────────────────────────────────┐
│  🤖 RPA 任务          [⋮菜单]     │
├────────────────────────────────────┤
│  应用: [Chrome ▼]                  │
│  工作流: [📁 process.json]        │
│  ──────────────────────────────   │
│  运行状态: ● 空闲                   │
│  ──────────────────────────────   │
│  [📷 截图预览]  [📋 日志]          │  ← RPA 特有功能
├────────────────────────────────────┤
│     [▶ 执行]  [⏹ 停止]  [🗑 删除] │
└────────────────────────────────────┘
```

### 11.5 工具栏分组预留

```
📥 输入类 (category: input)
  └─ 数据输入、文件读取、API 获取

🔍 处理类 (category: process)
  └─ 数据过滤、转换、聚合

📤 输出类 (category: output)
  └─ 文件保存、API 推送

🤖 RPA 类 (category: rpa)          ← 预留
  └─ UiPath 任务、Automation Anywhere

🔌 MCP 类 (category: mcp)          ← 预留
  └─ MCP Server 调用

🌐 HTTP 类 (category: http)        ← 预留
  └─ REST API 调用
```

### 11.6 扩展流程

新增节点类型时，前端改动最小化：

1. **定义 metadata.json** - 设置 `frontend_component` 字段
2. **注册节点组件** - 如需特殊 UI，注册到 `nodeTypeMap`
3. **如使用 dynamicNode** - 无需任何前端改动，自动支持
