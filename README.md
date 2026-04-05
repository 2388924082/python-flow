# python-flow

python自动化流程编排系统，后端是python，前端是基于vueflow的可视化流程编排web界面。

可将任意 Python 自动化脚本（Python / Executable / Batch / MCP / API）封装为节点，进行灵活的工作流编排。

作者：昌攀 | 邮箱：<2240438628@qq.com>

## 功能特性

- **可视化编排** - 拖拽节点、连接边构建工作流
- **多类型节点** - 支持 Python / Executable / Batch / MCP / API 等多种脚本类型 （需要自行封装成node插件）
- **插件系统** - 支持自定义节点插件，扩展数据处理能力
- **实时执行** - 在线执行工作流，实时查看执行日志
- **工作流管理** - 保存、加载、删除工作流
- **多主题** - 支持亮色/暗色/VSCode 主题

## 应用场景

- python自动化工作流编排
- 数据处理流水线编排
- 自动化任务流程
- 定时批处理任务

## 规划路线

- [ ] **Node插件市场** - 社区共享的插件仓库
- [ ] **工具箱界面** - 每个Node可单独使用，像工具箱一样
- [ ] **CLI工具** - 命令行调用，支持绑定右键菜单
- [ ] **MCP Server** - 作为MCP服务，集成到其他AI对话软件
- [ ] **AI对话界面** - 接入AI API，增加AI对话功能
- [ ] **RPA框架** - 网页元素、桌面软件自动化操作
- [ ] **AI编排** - AI自动编排工作流或封装Node功能
- [ ] **可控AI** - AI实现目标的过程是可控的workflow
- [ ] **固化流程** - 常用流程固化workflow文件，不常用操作用Agent
- [ ] **AI监督** - AI监督workflow执行，自行改进workflow

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript |
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
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

后端地址：http://localhost:8000

### 启动前端

```bash
cd frontend-vue
npm install
npm run dev
```

前端地址：http://localhost:5173

## 项目结构

```
workflow3/
├── backend/                 # 后端服务
│   ├── engine/             # 工作流引擎核心
│   │   ├── executor.py    # 执行器
│   │   ├── graph.py        # 图结构
│   │   ├── parser.py      # 工作流解析
│   │   └── plugin_loader.py # 插件加载器
│   ├── nodes/              # 内置节点插件
│   │   ├── input/         # 输入节点
│   │   ├── output/        # 输出节点
│   │   ├── process/       # 处理节点
│   │   └── debug/         # 调试节点
│   ├── workflows/          # 工作流文件存储
│   └── main.py             # FastAPI 入口
├── frontend-vue/           # 前端 (Vue 3)
│   └── src/
│       ├── components/     # UI 组件
│       ├── composables/   # 组合式函数
│       ├── services/      # API 服务
│       ├── styles/        # 样式文件
│       ├── types/         # 类型定义
│       └── App.vue        # 主应用
└── docs/                   # 文档
    ├── ARCHITECTURE.md     # 系统架构
    ├── API_REFERENCE.md    # API 文档
    └── PLUGIN_DEV.md      # 插件开发
```

## 文档导航

### 核心文档
- [架构设计](docs/ARCHITECTURE.md) - 系统整体架构
- [API 参考](docs/API_REFERENCE.md) - 前后端接口定义
- [插件开发](docs/PLUGIN_DEV.md) - 如何开发自定义节点

### 快速入门
- [快速启动指南](docs/QUICK_START.md) - 环境配置、项目启动

### 详细文档
- [前端架构](docs/FRONTEND_ARCH.md) - 前端代码结构、组件设计
- [后端架构](docs/BACKEND_ARCH.md) - 后端模块、引擎原理
- [常见问题](docs/FAQ.md) - 常见问题与解决方案

### 前端开发
- [Vue Flow API](frontend-vue/VUE_FLOW_API.md) - Vue Flow 官方 API 整理
- [Vue Flow 特性](frontend-vue/VUE_FLOW_FEATURES.md) - Vue Flow 功能特性
- [重构设计](frontend-vue/REFACTOR_DESIGN.md) - 前端重构设计方案

### 历史文档
- [旧版设计](docs/legacy/DESIGN.md) - 早期版本设计
- [旧版 API](docs/legacy/API.md) - 早期版本 API
- [旧版插件开发](docs/legacy/PLUGIN.md) - 早期插件开发文档
- [回顾总结](docs/legacy/RETROSPECTIVE.md) - 开发回顾与总结

## License

MIT
