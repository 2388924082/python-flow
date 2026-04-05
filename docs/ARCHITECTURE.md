# 系统架构设计

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3)                          │
│  ┌─────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │ TopBar  │  │ FileList    │  │   WorkflowCanvas     │   │
│  │ 工具栏   │  │ 文件列表    │  │   工作流画布          │   │
│  └─────────┘  └─────────────┘  └──────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              BottomPanel (日志面板)                    │   │
│  │  [全部] [前端] [后端]  │  实时日志显示                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    REST API + WebSocket
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        后端 (FastAPI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  REST API    │  │  工作流引擎   │  │  WebSocket   │    │
│  │  路由管理     │  │  Executor    │  │  日志推送     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Plugin Loader                      │   │
│  │              动态加载节点插件                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   节点插件       │
                    │ nodes/*/        │
                    └─────────────────┘
```

## 技术栈

### 前端

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3 | 组合式 API |
| 语言 | TypeScript | 类型安全 |
| 状态管理 | Composables | provide/inject |
| UI 布局 | CSS Flexbox | 响应式布局 |
| 工作流画布 | Vue Flow | 节点拖拽连线 |
| 构建工具 | Vite | 快速构建 |

### 后端

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | FastAPI | 高性能 API 框架 |
| 语言 | Python 3.10+ | 简洁高效 |
| 执行引擎 | 自研 | 拓扑排序执行 |
| 插件系统 | 动态加载 | 无需重启 |
| 通信 | Uvicorn | ASGI 服务器 |

## 模块设计

### 前端模块

```
前端
├── 组件层 (components/)
│   ├── TopToolbar.vue      # 工具栏：新建/保存/执行
│   ├── FileList.vue        # 工作流文件管理
│   ├── WorkflowCanvas.vue  # 画布：节点渲染+连线
│   ├── FloatingToolbar.vue  # 缩放控制
│   └── BottomPanel.vue     # 日志面板
│
├── 逻辑层 (composables/)
│   ├── useLog.ts          # 日志管理
│   ├── useToast.ts        # 通知提示
│   └── useWorkflow.ts     # 工作流状态
│
├── 服务层 (services/)
│   └── api.ts             # API 调用封装
│
└── 类型层 (types/)
    ├── api.ts             # API 类型（与后端交互）
    └── internal.ts        # 内部类型
```

### 后端模块

```
后端
├── API 层 (main.py)
│   ├── /api/nodes         # 节点管理
│   ├── /api/workflows     # 工作流 CRUD
│   ├── /api/execute       # 执行控制
│   └── /ws/logs           # 日志推送
│
├── 引擎层 (engine/)
│   ├── executor.py         # 节点执行器
│   ├── graph.py           # 图结构/拓扑排序
│   ├── parser.py          # 工作流解析
│   ├── plugin_loader.py    # 插件加载
│   └── state.py           # 执行状态
│
└── 插件层 (nodes/)
    ├── input/             # 输入节点
    ├── output/           # 输出节点
    └── process/          # 处理节点
```

## 数据流设计

### 工作流保存流程

```
用户点击保存
    ↓
前端收集 nodes/edges
    ↓
POST /api/workflows/{name}
    ↓
后端解析并保存 .workflow 文件
    ↓
返回成功
```

### 工作流执行流程

```
用户点击执行
    ↓
POST /api/execute
    ↓
Engine 解析工作流
    ↓
Graph 拓扑排序
    ↓
按顺序执行节点
    ↓
捕获 print() 日志
    ↓
WebSocket 推送日志
    ↓
前端显示日志
    ↓
完成后返回结果
```

### 节点数据流

```
上游节点
    ↓ (输出 JSON)
文件 /tmp/xxx_input.json
    ↓
插件 main.py 读取
    ↓ (处理)
文件 /tmp/xxx_output.json
    ↓
下游节点读取
```

## 关键设计决策

### 1. 为什么用 Plugin 架构？

**优点**：
- 独立开发，易于维护
- 无需修改核心代码即可扩展
- 支持 python/exe/bat 多类型

**实现**：
- `plugin_loader.py` 动态加载
- `metadata.json` 声明式定义
- `main.py` 标准化入口

### 2. 为什么用 .workflow 文件？

**优点**：
- 纯 JSON，人类可读
- 易于版本控制
- 可手动编辑/备份

**格式**：
```json
{
  "name": "工作流名",
  "nodes": [...],
  "edges": [...]
}
```

### 3. 为什么用 print() 做日志？

**优点**：
- 插件开发简单，无需学习日志 API
- 所有语言都支持
- 自动捕获 stdout，无需复杂集成

**实现**：
```python
print("日志内容")  # → WebSocket → 前端
```

### 4. 为什么前端不用 Vuex/Pinia？

**决策**：使用 Composition API + provide/inject

**原因**：
- 项目规模较小，不需要复杂状态管理
- 避免额外依赖
- App.vue 作为状态中心，逻辑清晰

## 部署架构

### 开发环境

```
前端: npm run dev     → http://localhost:5173
后端: uvicorn main    → http://localhost:8000
```

### 生产环境

```
前端: npm run build   → dist/
后端: uvicorn main    → 端口 8000
nginx → 反向代理
```

### CORS 配置

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 扩展点

### 新增节点类型

1. 创建 `backend/nodes/{分类}/{插件}/`
2. 添加 `metadata.json`
3. 添加 `main.py`
4. 重启后端（自动加载）

### 新增 API

1. 在 `main.py` 添加路由
2. 调用 Engine 层方法
3. 返回标准化响应

### 前端新功能

1. 在 `composables/` 添加逻辑
2. 在 `components/` 添加组件
3. App.vue 引入使用

## 下一步

- [快速启动](QUICK_START.md) - 本地运行
- [前端架构](FRONTEND_ARCH.md) - 详细前端文档
- [后端架构](BACKEND_ARCH.md) - 详细后端文档
- [插件开发](PLUGIN_DEV.md) - 开发新节点
