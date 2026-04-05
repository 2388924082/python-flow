# 前端架构详解

## 目录结构

```
frontend-vue/src/
├── components/              # UI 组件
│   ├── nodes/               # 节点相关组件
│   │   ├── DynamicNode.vue  # 动态节点渲染
│   │   └── DynamicNode.ts   # 节点逻辑
│   ├── BottomPanel.vue     # 底部日志面板
│   ├── FileList.vue        # 文件列表（工作流管理）
│   ├── FloatingToolbar.vue  # 画布浮动工具栏
│   ├── SaveDialog.vue       # 保存对话框
│   ├── Toast.vue            # Toast 通知单个组件
│   ├── ToastContainer.vue   # Toast 通知容器
│   ├── TopToolbar.vue       # 顶部工具栏
│   └── WorkflowCanvas.vue   # 工作流画布
├── composables/             # 组合式函数（核心业务逻辑）
│   ├── useLog.ts           # 日志系统
│   ├── useToast.ts         # Toast 通知系统
│   └── useWorkflow.ts      # 工作流状态管理
├── services/               # API 服务
│   └── api.ts              # API 调用封装
├── styles/                  # 全局样式
│   ├── main.css            # 主样式
│   └── variables.css       # CSS 变量
├── types/                   # TypeScript 类型定义
│   ├── api.ts              # API 类型（与后端交互）
│   └── internal.ts         # 内部类型（前端使用）
├── utils/                   # 工具函数
│   └── transform.ts        # 数据转换函数
├── App.vue                  # 根组件（状态中心）
└── main.ts                 # 入口文件
```

## 组件层级

```
App.vue (根组件，状态中心)
├── TopToolbar.vue           # 顶部工具栏
│   └── 提供：新建、保存、执行按钮
├── FileList.vue            # 文件列表（左侧面板）
│   └── 提供：工作流文件浏览、创建、删除、重命名
├── WorkflowCanvas.vue      # 工作流画布（中心区域）
│   ├── FloatingToolbar.vue  # 浮动工具栏（缩放、适应屏幕）
│   └── 渲染节点和边
├── BottomPanel.vue         # 底部日志面板
│   ├── Tab: 全部 / 前端 / 后端
│   └── 提供：日志显示、复制、清空
└── ToastContainer.vue      # Toast 通知容器
    └── Toast.vue           # 单个 Toast
```

## 状态管理

### App.vue 作为状态中心

采用 **provide/inject + props/emits** 模式，无需 Vuex/Pinia：

```
App.vue (状态持有者)
    │
    ├── provide('toast', toast)  → 子组件 inject 使用
    │
    ├── props 传递
    │   └── WorkflowCanvas.vue
    │       └── 节点数据
    │
    └── emit 接收事件
        └── FileList.vue (工作流操作)
```

### 状态定义（App.vue）

```typescript
// 工作流相关
const nodes = ref<NodeItem[]>([])           // 节点列表
const edges = ref<EdgeItem[]>([])           // 边列表
const currentWorkflow = ref<string | null>(null)  // 当前工作流名
const selectedNodeId = ref<string | null>(null)    // 选中节点

// UI 状态
const fileListWidth = ref(200)              // 文件列表宽度
const fileListCollapsed = ref(false)        // 文件列表收起
const bottomPanelHeight = ref(150)          // 日志面板高度
const bottomPanelCollapsed = ref(false)     // 日志面板收起
const isResizingH = ref(false)               // 水平拖动中
const isResizingV = ref(false)               // 垂直拖动中

// 日志
const { logs, addLog, clearLogs } = useLog()
```

## Composables

### useLog.ts - 日志系统

统一管理前端和后端日志：

```typescript
// 使用
const { logs, addLog, clearLogs } = useLog()

// 添加前端日志
addLog('工作流加载成功', 'info', 'FE')

// 添加后端日志（WebSocket 接收）
addLog('节点执行中', 'info', 'BE')
```

**日志同时输出到**：
1. 界面日志面板（BottomPanel）
2. 浏览器控制台（F12）

### useToast.ts - 通知系统

轻量级 Toast 通知：

```typescript
// 使用
const toast = useToast()
toast.success('保存成功')
toast.error('保存失败')
toast.info('提示信息')
```

**特性**：
- 自动消失（2秒）
- 无需手动关闭
- 支持 success/error/info 类型

### useWorkflow.ts - 工作流状态

管理节点的增删改查：

```typescript
const {
  nodes, edges, currentWorkflow, selectedNodeId,
  addNode, removeNode, updateNodeConfig,
  selectNode, addEdge, removeEdge,
  save, load, execute
} = useWorkflow()
```

## 类型系统

### types/api.ts - API 类型

与后端交互的类型定义：

```typescript
interface PluginDefinition {
  id: string
  name: string
  category: string
  icon: string
  config: ConfigField[]      // 配置项
  inputs: Port[]            // 输入端口
  outputs: Port[]           // 输出端口
}

interface LogEntry {
  id: string
  timestamp: string
  source: 'FE' | 'BE'       // 日志来源
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
}
```

### types/internal.ts - 内部类型

前端内部使用的类型：

```typescript
interface NodeItem {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    id: string
    name: string
    icon: string
    configValues: Record<string, unknown>
    // ... 其他数据
  }
}

interface EdgeItem {
  id: string
  source: string            // 源节点 ID
  target: string            // 目标节点 ID
  sourceHandle?: string | null
  targetHandle?: string | null
}
```

## 工具函数

### utils/transform.ts - 数据转换

负责 NodeItem 与 NodeData 之间的转换：

```typescript
// NodeItem → NodeData（内部 → API）
nodeItemToNodeData(node: NodeItem, plugins: PluginDefinition[]): NodeData

// NodeData → NodeItem（API → 内部）
nodeDataToNodeItem(nodeData: NodeData, plugins: PluginDefinition[]): NodeItem

// 创建节点
createNodeFromPlugin(plugin: PluginDefinition, position: Position): NodeItem
```

## API 服务

### services/api.ts

封装所有与后端的 API 调用：

```typescript
// 节点
getNodes(): Promise<PluginDefinition[]>
getCategories(): Promise<CategoryDefinition[]>

// 工作流
listWorkflows(): Promise<string[]>
saveWorkflow(name: string, nodes: NodeItem[], edges: EdgeItem[]): Promise<void>
loadWorkflow(name: string): Promise<Workflow>
deleteWorkflow(name: string): Promise<void>
renameWorkflow(oldName: string, newName: string): Promise<void>

// 执行
executeWorkflow(workflow: Workflow): Promise<ExecutionState>
```

## 通信机制

### REST API

所有 CRUD 操作通过 REST API：

```
GET    /api/nodes              # 获取节点列表
GET    /api/categories         # 获取分类
GET    /api/workflows          # 获取工作流列表
GET    /api/workflows/{name}   # 加载工作流
POST   /api/workflows/{name}   # 保存工作流
DELETE /api/workflows/{name}   # 删除工作流
POST   /api/execute            # 执行工作流
```

### WebSocket

日志实时推送：

```
WebSocket /ws/logs
    ↓
后端 executor 实时发送日志
    ↓
前端 useLog 接收并显示
```

## 样式系统

### CSS 变量（variables.css）

```css
:root {
  --color-primary: #4a90d9;
  --color-bg: #1e1e1e;
  --color-panel: #252526;
  --color-border: #3c3c3c;
  --color-text: #cccccc;
}
```

### 布局

采用 Flexbox 布局：
- 整体：水平三栏（文件列表 | 画布 | 配置）
- 上下：工具栏 + 画布 + 日志面板

## 下一步

- [后端架构](BACKEND_ARCH.md) - 了解工作流引擎
- [插件开发](PLUGIN_DEV.md) - 开发自定义节点
- [API 文档](API_REFERENCE.md) - 接口详细说明
