# AI 工作流编排工具

可视化的工作流编排系统，通过拖拽节点、连接边来构建数据处理流程。

## 功能特性

- **可视化编排**：通过拖拽节点、连接边来构建工作流
- **插件系统**：支持自定义节点插件，扩展数据处理能力
- **实时执行**：支持在线执行工作流，实时查看执行日志
- **工作流管理**：保存、加载、删除工作流
- **日志系统**：前端/后端日志分离，支持日志级别过滤

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript |
| UI 框架 | 原生 CSS + Flexbox |
| 工作流引擎 | Vue Flow |
| 后端框架 | FastAPI (Python) |
| 通信方式 | REST API + WebSocket |

## 快速启动

### 环境要求

- Node.js >= 18
- Python >= 3.10

### 启动后端

```bash
cd backend
pip install -r requirements.txt  # 如有需要
python -m uvicorn main:app --reload --port 8000
```

后端地址：`http://localhost:8000`

### 启动前端

```bash
cd frontend-vue
npm install
npm run dev
```

前端地址：`http://localhost:5173`

## 项目结构

```
workflow3/
├── backend/                 # 后端服务
│   ├── main.py             # FastAPI 入口
│   ├── engine/             # 工作流引擎核心
│   │   ├── executor.py    # 执行器
│   │   ├── graph.py        # 图结构
│   │   ├── parser.py      # 工作流解析
│   │   └── plugin_loader.py # 插件加载器
│   ├── nodes/              # 内置节点插件
│   │   ├── input/         # 输入节点
│   │   ├── output/        # 输出节点
│   │   └── process/       # 处理节点
│   └── workflows/          # 工作流文件存储
├── frontend-vue/           # 前端 (Vue 3)
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── composables/   # 组合式函数
│   │   ├── services/      # API 服务
│   │   ├── types/          # 类型定义
│   │   └── utils/          # 工具函数
│   └── package.json
└── docs/                   # 文档
    ├── QUICK_START.md      # 快速启动
    ├── FRONTEND_ARCH.md    # 前端架构
    ├── BACKEND_ARCH.md     # 后端架构
    ├── PLUGIN_DEV.md       # 插件开发
    ├── API_REFERENCE.md    # API 文档
    └── FAQ.md              # 常见问题
```

## 文档导航

- [快速启动指南](QUICK_START.md) - 环境配置、项目启动
- [前端架构详解](FRONTEND_ARCH.md) - 前端代码结构、组件设计
- [后端架构详解](BACKEND_ARCH.md) - 后端模块、引擎原理
- [插件开发指南](PLUGIN_DEV.md) - 如何开发自定义节点
- [API 接口文档](API_REFERENCE.md) - 前后端接口定义
- [常见问题](FAQ.md) - 常见问题与解决方案

## 维护团队

如有疑问请联系当前维护者。
