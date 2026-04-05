# 插件设计文档

## 概述

工作流的节点以插件形式存在，每个插件是一个独立目录，放置在 `backend/nodes/{分类}/{插件名}/` 下。

## 目录结构

```
backend/nodes/
├── input/                    # 输入分类
│   ├── category.json         # 分类配置
│   └── input/               # 数据输入插件
│       ├── main.py          # 插件入口
│       └── metadata.json     # 插件元数据
├── output/                   # 输出分类
│   └── output/
│       ├── main.py
│       └── metadata.json
└── process/                  # 处理分类
    └── aggregator/
        ├── main.py
        └── metadata.json
```

## 分类配置 (category.json)

```json
{
  "name": "输入",
  "icon": "📥",
  "order": 1
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 分类显示名称 |
| icon | string | 分类图标（emoji） |
| order | int | 排序顺序，数字越小越靠前 |

## 插件元数据 (metadata.json)

```json
{
  "id": "input",
  "name": "数据输入",
  "version": "1.0",
  "description": "提供静态数据作为工作流的输入源",
  "icon": "📥",
  "type": "python",
  "entry": "main.py",
  "config": [
    {
      "key": "data",
      "name": "输入数据 (JSON)",
      "type": "string",
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
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 插件唯一标识（全局唯一） |
| name | string | 插件显示名称 |
| version | string | 版本号 |
| description | string | 插件描述 |
| icon | string | 插件图标（emoji） |
| type | string | 执行器类型：`python` / `exe` / `bat` |
| entry | string | 入口文件名 |
| config | array | 配置字段定义 |
| inputs | array | 输入端口定义 |
| outputs | array | 输出端口定义 |

### config 字段说明

```json
{
  "key": "data",
  "name": "输入数据 (JSON)",
  "type": "string",
  "default": "[]",
  "options": null
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| key | string | 配置项标识符 |
| name | string | 显示名称 |
| type | string | 类型：`string` / `number` / `boolean` / `select` |
| default | any | 默认值 |
| options | array | 当 type 为 select 时的选项列表 |

### inputs/outputs 端口说明

```json
{
  "key": "data",
  "name": "数据",
  "type": "json"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| key | string | 端口标识符 |
| name | string | 端口显示名称 |
| type | string | 数据类型：`json` / `string` / `number` |

## 插件入口 (main.py)

```python
import json
import sys

def main(input_path: str, output_path: str):
    """
    插件主函数

    参数:
        input_path: 输入数据文件路径（JSON）
        output_path: 输出数据文件路径（JSON）
    """
    # 1. 读取输入数据
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    # 2. 获取配置参数
    config = input_data.get("config", {})
    # config 中包含用户在 UI 上填写的配置值
    # 例如 config = {"data": "[1,2,3]", "format": "json"}

    # 3. 获取上游节点传来的输入数据
    upstream = input_data.get("inputs", {})
    # 例如 upstream = {"data": [1, 2, 3]}

    # 4. 执行核心逻辑
    result = process_data(config, upstream)

    # 5. 打印日志（会显示到前端日志面板）
    print("处理完成")
    print(f"输出结果: {len(result)} 条")

    # 6. 写入输出数据
    output_data = {
        "config": config,
        "inputs": upstream,
        "outputs": {
            "data": result
        }
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
```

## 日志输出

**重要：使用 `print()` 打印的每一行都会发送到前端日志面板。**

```python
def main(input_path: str, output_path: str):
    print("开始处理...")      # → 前端显示: 开始处理...
    print("处理中...")       # → 前端显示: 处理中...
    print("处理完成")        # → 前端显示: 处理完成
```

日志会通过以下流程发送到前端：
```
print() 输出
    ↓
PythonExecutor 捕获 stdout
    ↓
返回 logs 数组
    ↓
Executor 调用 add_log() 广播
    ↓
WebSocket /ws/logs 推送到前端
    ↓
前端日志面板显示
```

## 执行流程

1. **前端拖拽节点** → 创建工作流
2. **用户点击执行** → POST /api/execute
3. **后端解析工作流** → 按拓扑排序执行节点
4. **节点执行** → 调用 main.py，传入 input_path 和 output_path
5. **日志广播** → print() 输出通过 WebSocket 发送到前端
6. **完成** → 前端显示执行结果

## 创建新插件步骤

1. 在 `backend/nodes/{分类}/` 下创建插件目录
2. 编写 `metadata.json` 元数据
3. 编写 `main.py` 入口文件
4. 重启后端自动加载

## 支持的插件类型

| 类型 | 说明 | 入口示例 |
|------|------|----------|
| python | Python 脚本 | `python main.py` |
| exe | Windows 可执行文件 | `plugin.exe` |
| bat | Windows 批处理文件 | `cmd /c plugin.bat` |

## 完整示例

### 数据输入插件 (input)

```
backend/nodes/input/input/
├── main.py
└── metadata.json
```

**metadata.json:**
```json
{
  "id": "input",
  "name": "数据输入",
  "version": "1.0",
  "description": "提供静态数据作为工作流的输入源",
  "icon": "📥",
  "type": "python",
  "entry": "main.py",
  "config": [
    {
      "key": "data",
      "name": "输入数据 (JSON)",
      "type": "string",
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
```

**main.py:**
```python
import json

def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    config = input_data.get("config", {})
    input_data_str = config.get("data", "[]")

    try:
        data = json.loads(input_data_str) if isinstance(input_data_str, str) else input_data_str
    except:
        data = []

    print(f"Input: 提供 {len(data) if isinstance(data, list) else 1} 条数据")

    output_data = {
        "config": config,
        "inputs": {},
        "outputs": {"data": data}
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"Output: 输出 {len(data)} 条数据")
```

### 数据日志插件 (data_logger)

```
backend/nodes/debug/data_logger/
├── main.py
└── metadata.json
```

**main.py:**
```python
import json

def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    upstream = input_data.get("inputs", {})
    config = input_data.get("config", {})

    level = config.get("level", "info")
    message = config.get("message", "")

    if upstream:
        for key, value in upstream.items():
            print(f"[{key}]: {value}")

    output_data = {
        "config": config,
        "inputs": upstream,
        "outputs": {}
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"日志级别: {level}")
    print(f"日志消息: {message}")
```