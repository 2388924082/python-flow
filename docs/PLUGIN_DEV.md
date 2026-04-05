# 插件开发指南

本文档介绍如何开发自定义节点插件。

## 概述

工作流的每个节点都是一个独立插件，放置在 `backend/nodes/{分类}/{插件名}/` 目录下。

## 目录结构

```
backend/nodes/
├── input/                      # 输入分类
│   ├── category.json           # 分类配置
│   └── input/                 # 插件目录
│       ├── main.py            # 插件入口
│       └── metadata.json      # 插件元数据
├── output/                     # 输出分类
├── process/                    # 处理分类
│   ├── category.json
│   ├── filter/
│   │   ├── main.py
│   │   └── metadata.json
│   └── aggregator/
│       ├── main.py
│       └── metadata.json
└── debug/                      # 调试分类
    └── data_logger/
        ├── main.py
        └── metadata.json
```

## 创建插件步骤

### 1. 创建插件目录

```
backend/nodes/{分类}/{插件名}/
```

例如，创建一个"数据转换"插件：

```
backend/nodes/process/data_transformer/
├── main.py
└── metadata.json
```

### 2. 编写 metadata.json

```json
{
  "id": "data_transformer",
  "name": "数据转换",
  "version": "1.0",
  "description": "对输入数据进行格式转换和处理",
  "icon": "🔄",
  "type": "python",
  "entry": "main.py",
  "config": [
    {
      "key": "operation",
      "name": "操作类型",
      "type": "select",
      "default": "uppercase",
      "options": ["uppercase", "lowercase", "reverse"]
    }
  ],
  "inputs": [
    {
      "key": "data",
      "name": "输入数据",
      "type": "json"
    }
  ],
  "outputs": [
    {
      "key": "result",
      "name": "转换结果",
      "type": "json"
    }
  ]
}
```

### metadata.json 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 插件唯一标识，全局唯一 |
| name | string | 是 | 插件显示名称 |
| version | string | 是 | 版本号 |
| description | string | 否 | 插件描述 |
| icon | string | 否 | 图标（emoji），默认 📦 |
| type | string | 是 | 执行器类型：`python` / `exe` / `bat` |
| entry | string | 是 | 入口文件名 |
| config | array | 否 | 配置项定义 |
| inputs | array | 否 | 输入端口定义 |
| outputs | array | 是 | 输出端口定义 |

### config 配置项类型

```json
{
  "key": "threshold",
  "name": "阈值",
  "type": "number",
  "default": 0.5
}
```

| type 值 | 说明 | default 类型 |
|---------|------|--------------|
| string | 字符串 | string |
| text | 多行文本 | string |
| number | 数字 | number |
| boolean | 布尔值 | boolean |
| select | 下拉选择 | string |
| file | 文件选择 | string |

### inputs/outputs 端口类型

```json
{
  "key": "data",
  "name": "输入数据",
  "type": "json"
}
```

| type 值 | 说明 |
|---------|------|
| json | JSON 数据 |
| string | 字符串 |
| number | 数字 |
| file | 文件路径 |

### 3. 编写 main.py

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

    # 2. 获取配置参数（用户在 UI 上填写的值）
    config = input_data.get("config", {})
    operation = config.get("operation", "uppercase")

    # 3. 获取上游节点传来的输入数据
    upstream = input_data.get("inputs", {})
    input_value = upstream.get("data", "")

    # 4. 执行核心逻辑
    if operation == "uppercase":
        result = str(input_value).upper()
    elif operation == "lowercase":
        result = str(input_value).lower()
    elif operation == "reverse":
        result = str(input_value)[::-1]
    else:
        result = input_value

    # 5. 打印日志（会显示到前端日志面板）
    print(f"执行操作: {operation}")
    print(f"输入: {input_value}")
    print(f"输出: {result}")

    # 6. 写入输出数据
    output_data = {
        "config": config,
        "inputs": upstream,
        "outputs": {
            "result": result
        }
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
```

## 插件入口规范

### 函数签名

```python
def main(input_path: str, output_path: str):
    """
    插件入口函数

    参数:
        input_path: JSON 文件路径，包含输入数据和配置
        output_path: JSON 文件路径，插件需要写入输出数据
    """
    pass
```

### 输入数据格式 (input_path)

```json
{
  "config": {
    "key1": "value1",
    "key2": "value2"
  },
  "inputs": {
    "port_key": <上游数据>
  }
}
```

### 输出数据格式 (output_path)

```json
{
  "config": {},
  "inputs": {},
  "outputs": {
    "port_key": <输出数据>
  }
}
```

## 日志输出

**重要：使用 `print()` 打印的内容会发送到前端日志面板。**

```python
def main(input_path: str, output_path: str):
    print("开始处理...")      # → 前端显示
    print("处理中...")       # → 前端显示
    print("处理完成")        # → 前端显示
```

日志流向：
```
print() 输出
    ↓
Executor 捕获 stdout
    ↓
WebSocket /ws/logs 推送到前端
    ↓
前端日志面板显示
```

## 分类配置 (category.json)

可选，在 `nodes/{分类}/category.json` 中定义：

```json
{
  "name": "处理",
  "icon": "⚙️",
  "order": 2
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 分类显示名称 |
| icon | string | 分类图标（emoji） |
| order | int | 排序顺序，数字越小越靠前 |

## 完整示例

### 示例：数据过滤插件

#### 目录结构

```
backend/nodes/process/filter/
├── main.py
└── metadata.json
```

#### metadata.json

```json
{
  "id": "filter",
  "name": "数据过滤器",
  "version": "1.0",
  "description": "根据阈值过滤数据",
  "icon": "🔍",
  "type": "python",
  "entry": "main.py",
  "config": [
    {
      "key": "threshold",
      "name": "阈值",
      "type": "number",
      "default": 0.5
    },
    {
      "key": "condition",
      "name": "条件",
      "type": "select",
      "default": "greater",
      "options": ["greater", "less", "equal"]
    }
  ],
  "inputs": [
    {
      "key": "data",
      "name": "输入数据",
      "type": "json"
    }
  ],
  "outputs": [
    {
      "key": "result",
      "name": "过滤结果",
      "type": "json"
    }
  ]
}
```

#### main.py

```python
import json

def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    config = input_data.get("config", {})
    threshold = float(config.get("threshold", 0.5))
    condition = config.get("condition", "greater")

    upstream = input_data.get("inputs", {})
    data = upstream.get("data", [])

    if not isinstance(data, list):
        data = [data]

    if condition == "greater":
        result = [x for x in data if float(x) > threshold]
    elif condition == "less":
        result = [x for x in data if float(x) < threshold]
    elif condition == "equal":
        result = [x for x in data if float(x) == threshold]
    else:
        result = data

    print(f"过滤条件: {condition} {threshold}")
    print(f"输入数据: {len(data)} 条")
    print(f"输出数据: {len(result)} 条")

    output_data = {
        "config": config,
        "inputs": upstream,
        "outputs": {
            "result": result
        }
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
```

## 测试插件

### 1. 手动测试

创建测试 JSON 文件：

```json
{
  "config": {"threshold": 0.5},
  "inputs": {"data": [1, 2, 3, 0.3, 0.6]}
}
```

运行插件：

```bash
cd backend
python -c "
import json
import sys
sys.path.insert(0, 'nodes/process/filter')
from main import main
main('test_input.json', 'test_output.json')
"
```

### 2. 在 UI 中测试

1. 重启后端（加载新插件）
2. 刷新前端页面
3. 在工具栏找到新插件并添加到画布
4. 配置参数并连接执行

## 常见问题

### 插件不显示

1. 检查 `metadata.json` 格式是否正确
2. 检查 `main.py` 是否有语法错误
3. 重启后端服务

### 执行报错

1. 检查 `input_path` 和 `output_path` 是否正确
2. 确保使用 `utf-8` 编码读取/写入
3. 查看后端日志的错误信息

### 数据类型不匹配

确保 inputs/outputs 的 type 与实际数据匹配：
- JSON 数据用 `"type": "json"`
- 字符串用 `"type": "string"`
- 数字用 `"type": "number"`

## 下一步

- [API 文档](API_REFERENCE.md) - 了解 API 接口
- [后端架构](BACKEND_ARCH.md) - 深入了解引擎
