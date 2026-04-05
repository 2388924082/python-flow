# AI 工作流编排工具 - API 接口文档

## 概述

- **Base URL**: `http://localhost:8000`
- **前端地址**: `http://localhost:3000`
- **跨域**: 后端已配置 CORS 允许前端访问

---

## 目录

- [插件管理](#1-插件管理)
- [工作流管理](#2-工作流管理)
- [执行](#3-执行)
- [通用说明](#4-通用说明)

---

## 1. 插件管理

### GET /api/nodes
获取所有可用节点

**响应**
```json
{
  "nodes": [
    {
      "id": "filter",
      "name": "数据过滤器",
      "category": "process",
      "version": "1.0",
      "description": "根据阈值过滤数据",
      "icon": "🔍",
      "type": "python",
      "config": [
        {"key": "threshold", "name": "阈值", "type": "number", "default": 0.5}
      ],
      "inputs": [
        {"key": "data", "name": "输入数据", "type": "file"}
      ],
      "outputs": [
        {"key": "result", "name": "过滤结果", "type": "file"}
      ]
    }
  ]
}
```

---

### POST /api/nodes/scan
重新扫描插件目录

**响应**
```json
{
  "message": "扫描完成",
  "loaded": 5,
  "failed": 1,
  "errors": [
    {"plugin": "broken", "error": "缺少 metadata.json"}
  ]
}
```

---

## 2. 工作流管理

### GET /api/workflows
列出所有工作流

**响应**
```json
{
  "workflows": [
    {"name": "数据分析流程", "file": "data_analysis.workflow", "updated_at": "2024-01-01T10:00:00Z"},
    {"name": "图片处理", "file": "image_process.workflow", "updated_at": "2024-01-02T15:30:00Z"}
  ]
}
```

---

### GET /api/workflows/{name}
获取单个工作流详情

**响应** `.workflow` 文件完整内容：

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

---

### POST /api/workflows
创建/保存工作流

**请求**
```json
{
  "name": "我的工作流",
  "nodes": [...],
  "edges": [...]
}
```

**响应**
```json
{
  "message": "保存成功",
  "file": "我的工作流.workflow"
}
```

---

### DELETE /api/workflows/{name}
删除工作流

**响应**
```json
{
  "message": "删除成功"
}
```

---

## 3. 执行

### POST /api/execute
启动工作流执行

**请求**
```json
{
  "workflow": {
    "name": "我的工作流",
    "nodes": [...],
    "edges": [...]
  }
}
```

**响应**
```json
{
  "task_id": "abc123",
  "status": "running"
}
```

---

### GET /api/execute/{task_id}
轮询执行状态

**响应（执行中）**
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
    {"node": "input", "type": "info", "message": "读取文件成功", "time": "10:00:01"},
    {"node": "filter", "type": "info", "message": "开始过滤...", "time": "10:00:02"}
  ]
}
```

**响应（执行完成）**
```json
{
  "task_id": "abc123",
  "status": "done",
  "progress": {
    "current_node": "output",
    "total_nodes": 5,
    "completed_nodes": 5
  },
  "logs": [...],
  "result": {
    "outputs": {
      "node_5": {"result": "path/to/output.csv"}
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
  "failed_node": "filter"
}
```

---

## 4. 通用说明

### 错误响应

```json
{
  "error": "错误描述",
  "code": 400
}
```

| code | 说明 |
|------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 任务状态

| status | 说明 |
|--------|------|
| `pending` | 任务已创建，等待执行 |
| `running` | 执行中 |
| `done` | 执行完成 |
| `failed` | 执行失败 |

### 前端轮询建议

```
POST /api/execute  →  拿到 task_id
       ↓
每 1-2 秒轮询一次 GET /api/execute/{task_id}
       ↓
status === "done" 或 "failed" 时停止轮询
```

---

*相关文档：[DESIGN.md](./DESIGN.md) - 总体设计*
