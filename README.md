# python-flow

python自动化流程编排系统，后端是python，前端是基于vueflow的可视化流程编排界面。

可将任意 Python 自动化脚本（Python / Executable / Batch / MCP / API）封装为节点，进行灵活的工作流编排。

作者：昌攀 | 邮箱：<2240438628@qq.com>

[中文文档](docs/README.md) | [English Docs](docs/README.md)

## Features

- **可视化编排** - 拖拽节点、连接边构建工作流
- **多类型节点** - 支持 Python / Executable / Batch / MCP / API 等多种脚本类型 （需要自行封装成node插件）
- **插件系统** - 支持自定义节点插件，扩展数据处理能力
- **实时执行** - 在线执行工作流，实时查看执行日志
- **工作流管理** - 保存、加载、删除工作流
- **多主题** - 支持亮色/暗色/VSCode 主题

## Use Cases

- python自动化工作流编排
- 数据处理流水线编排
- 自动化任务流程
- ETL 数据抽取转换加载
- 定时批处理任务

## Roadmap

- [ ] **Node插件市场** - 社区共享的插件仓库
- [ ] **工具箱界面** - 每个Node可单独使用，像工具箱一样
- [ ] **CLI工具** - 命令行调用，支持绑定右键菜单
- [ ] **MCP Server** - 作为MCP服务，集成到其他AI对话软件
- [ ] **AI对话界面** - 接入AI API，增加AI对话功能
- [ ] **RPA框架** - 网页元素、桌面软件自动化操作
  - 元素拾取器获取界面元素
  - 对元素进行流程编排成RPA工作流
- [ ] **AI编排** - AI自动编排工作流或封装Node功能
- [ ] **可控AI** - AI实现目标的过程是可控的workflow，而不是每次过程都不一样
- [ ] **固化流程** - 常用流程固化workflow文件，不常用操作用Agent
- [ ] **AI监督** - AI监督workflow执行，自行改进workflow

## Tech Stack

| Layer         | Technology           |
| ------------- | -------------------- |
| Frontend      | Vue 3 + TypeScript   |
| Flow Chart    | Vue Flow             |
| Backend       | FastAPI (Python)     |
| Communication | REST API + WebSocket |

## Quick Start

### Requirements

- Node.js >= 18
- Python >= 3.10

### 1. Start Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend API: <http://localhost:8000>

### 2. Start Frontend

```bash
cd frontend-vue
npm install
npm run dev
```

Frontend: <http://localhost:5173>

## Project Structure

```
workflow3/
├── backend/                  # FastAPI backend
│   ├── engine/              # Workflow execution engine
│   ├── nodes/               # Built-in plugin nodes
│   │   ├── input/          # Input nodes
│   │   ├── output/         # Output nodes
│   │   ├── process/        # Process nodes
│   │   └── debug/          # Debug nodes
│   ├── workflows/           # Workflow storage
│   └── main.py              # API entry point
│
├── frontend-vue/            # Vue 3 frontend
│   └── src/
│       ├── components/      # Vue components
│       ├── composables/     # Vue composables
│       ├── services/        # API services
│       ├── styles/          # CSS styles
│       ├── types/           # TypeScript types
│       └── App.vue          # Main application
│
├── docs/                    # Documentation
│   ├── README.md            # Chinese documentation
│   ├── ARCHITECTURE.md     # System architecture
│   ├── API_REFERENCE.md     # API reference
│   └── PLUGIN_DEV.md       # Plugin development guide
│
└── .gitignore
```

## Development

### Create a Plugin Node

Plugin nodes are stored in `backend/nodes/` with the following structure:

```
nodes/
└── your_category/
    └── your_plugin/
        ├── main.py          # Plugin implementation
        └── metadata.json    # Plugin metadata
```

See [Plugin Development Guide](docs/PLUGIN_DEV.md) for details.

## License

MIT
