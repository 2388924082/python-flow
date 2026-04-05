# API 接口文档

## 概述

- **Base URL**: `http://localhost:8000`
- **前端地址**: `http://localhost:5173`
- **跨域**: 后端已配置 CORS 允许前端访问

---

## 目录

- [节点管理](#1-节点管理)
- [分类管理](#2-分类管理)
- [工作流管理](#3-工作流管理)
- [工作流执行](#4-工作流执行)
- [WebSocket 日志](#5-websocket-日志)

---

## 1. 节点管理

### GET /api/nodes

获取所有可用节点（插件）列表。

**响应**

```json
{
  "nodes": [
    {
      "id": "input",
      "name": "数据输入",
      "category": "input",
      "version": "1.0",
      "description": "提供静态数据作为工作流的输入源",
      "icon": "📥",
      "type": "python",
      "entry": "main.py",
      "config": [
        {
          "key": "data",
          "name": "输入数据 (JSON)",
          "type": "text",
          "default": "[]"
        }
      ],
      "inputs": [],
      "outputs": [
        {
          "key": "data",
          "name": "数据",
          "type": "json"
        }
      ]
    }
  ]
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 节点唯一标识 |
| name | string | 节点显示名称 |
| category | string | 所属分类 |
| version | string | 版本号 |
| description | string | 节点描述 |
| icon | string | 节点图标 (emoji) |
| type | string | 执行器类型：`python` / `exe` / `bat` |
| entry | string | 入口文件名 |
| config | array | 配置项定义 |
| inputs | array | 输入端口定义 |
| outputs | array | 输出端口定义 |

### POST /api/nodes/scan

重新扫描 `nodes/` 目录，加载所有插件。

**响应**

```json
{
  "message": "扫描完成",
  "loaded": 5,
  "failed": 1,
  "errors": [
    {
      "plugin": "broken_plugin",
      "error": "缺少 metadata.json"
    }
  ]
}
```

---

## 2. 分类管理

### GET /api/categories

获取所有节点分类列表。

**响应**

```json
{
  "categories": [
    {
      "id": "input",
      "name": "输入",
      "icon": "📥",
      "order": 1
    },
    {
      "id": "process",
      "name": "处理",
      "icon": "⚙️",
      "order": 2
    },
    {
      "id": "output",
      "name": "输出",
      "icon": "📤",
      "order": 3
    }
  ]
}
```

---

## 3. 工作流管理

### GET /api/workflows

列出所有已保存的工作流。

**响应**

```json
{
  "workflows": [
    {
      "name": "数据分析流程",
      "file": "数据分析流程.workflow",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### GET /api/workflows/{name}

获取指定工作流的完整定义。

**参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 工作流名称（URL 编码） |

**响应**

```json
{
  "name": "我的工作流",
  "version": "1.0",
  "created_at": "2024-01-01T00:00:00Z",
  "nodes": [
    {
      "id": "node_1",
      "type": "input",
      "position": {
        "x": 100,
        "y": 200
      },
      "config": {
        "data": "[1,2,3]"
      }
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

### POST /api/workflows/{name}

保存或更新工作流。

**参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 工作流名称（URL 编码） |

**请求体**

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "input",
      "position": {"x": 100, "y": 200},
      "config": {"data": "[1,2,3]"}
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

**响应**

```json
{
  "message": "保存成功",
  "file": "我的工作流.workflow"
}
```

### DELETE /api/workflows/{name}

删除指定工作流。

**参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 工作流名称（URL 编码） |

**响应**

```json
{
  "message": "删除成功"
}
```

### POST /api/workflows/{old_name}/rename

重命名工作流。

**参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| old_name | string | 原名称（URL 编码） |

**请求体**

```json
{
  "new_name": "新名称"
}
```

**响应**

```json
{
  "message": "重命名成功",
  "file": "新名称.workflow"
}
```

---

## 4. 工作流执行

### POST /api/execute

启动工作流执行。

**请求体**

```json
{
  "workflow": {
    "name": "我的工作流",
    "nodes": [
      {
        "id": "node_1",
        "type": "input",
        "position": {"x": 100, "y": 200},
        "config": {"data": "[1,2,3]"}
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
}
```

**响应（执行成功）**

```json
{
  "task_id": "abc123",
  "status": "done",
  "logs": [
    {
      "timestamp": "10:00:01",
      "source": "BE",
      "level": "INFO",
      "message": "Starting workflow",
      "nodeId": null
    }
  ],
  "result": {
    "outputs": {
      "node_2": {
        "result": [1, 2, 3]
      }
    }
  }
}
```

**响应（执行失败）**

```json
{
  "task_id": "abc123",
  "status": "failed",
  "error": "节点 filter 执行失败: 阈值必须大于 0",
  "failed_node": "filter",
  "logs": [...]
}
```

---

## 5. WebSocket 日志

### WS /ws/logs

实时日志推送通道。

**连接**

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/logs')
```

**服务器推送消息**

```json
{
  "timestamp": "10:00:01",
  "source": "BE",
  "level": "INFO",
  "message": "Executing node: 数据输入",
  "nodeId": "node_1"
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| timestamp | string | 时间戳 (HH:mm:ss) |
| source | string | 来源：`BE` (后端) |
| level | string | 级别：`DEBUG` / `INFO` / `WARN` / `ERROR` |
| message | string | 日志内容 |
| nodeId | string/null | 关联节点 ID |

---

## 通用说明

### 错误响应

所有 API 错误返回统一格式：

```json
{
  "error": "错误描述",
  "code": 400
}
```

**错误码说明**

| code | 说明 |
|------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在（如工作流不存在） |
| 500 | 服务器内部错误 |

### CORS

后端已配置允许前端跨域访问：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 数据类型参考

参见 [FRONTEND_ARCH.md](FRONTEND_ARCH.md#typesapi---api-类型) 中的类型定义。

---

## 下一步

- [快速启动](QUICK_START.md) - 本地运行项目
- [前端架构](FRONTEND_ARCH.md) - 前端架构详解
- [后端架构](BACKEND_ARCH.md) - 后端架构详解
- [插件开发](PLUGIN_DEV.md) - 开发自定义节点
