{
  "name": "cc11",
  "version": "1.0",
  "nodes": [
    {
      "id": "input_1775172369772",
      "type": "input",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "config": [
        {
          "key": "data",
          "name": "输入数据 (JSON)",
          "type": "string",
          "default": "[]",
          "options": null
        }
      ],
      "inputs": [],
      "outputs": [
        {
          "key": "data",
          "name": "数据",
          "type": "json"
        }
      ],
      "configValues": {
        "data": "[]"
      },
      "position": {
        "x": 40,
        "y": 160
      }
    },
    {
      "id": "output_1775172371316",
      "type": "output",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "config": [],
      "inputs": [
        {
          "key": "data",
          "name": "输入数据",
          "type": "json"
        }
      ],
      "outputs": [],
      "configValues": {},
      "position": {
        "x": 235,
        "y": 232
      }
    },
    {
      "id": "filter_1775172402046",
      "type": "filter",
      "name": "数据过滤器",
      "icon": "🔍",
      "category": "process",
      "config": [
        {
          "key": "threshold",
          "name": "阈值",
          "type": "number",
          "default": 0.5,
          "options": null
        },
        {
          "key": "field",
          "name": "过滤字段",
          "type": "string",
          "default": "score",
          "options": null
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
      ],
      "configValues": {
        "threshold": 0.5,
        "field": "score"
      },
      "position": {
        "x": 232,
        "y": 104
      }
    },
    {
      "id": "output_1775172410869",
      "type": "output",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "config": [],
      "inputs": [
        {
          "key": "data",
          "name": "输入数据",
          "type": "json"
        }
      ],
      "outputs": [],
      "configValues": {},
      "position": {
        "x": 421,
        "y": 123
      }
    }
  ],
  "edges": [
    {
      "id": "e_1775172373506",
      "source": "input_1775172369772",
      "target": "output_1775172371316",
      "sourceHandle": "data",
      "targetHandle": "data"
    },
    {
      "id": "e_1775172414764",
      "source": "filter_1775172402046",
      "target": "output_1775172410869",
      "sourceHandle": "result",
      "targetHandle": "data"
    },
    {
      "id": "e_1775172418772",
      "source": "input_1775172369772",
      "target": "filter_1775172402046",
      "sourceHandle": "data",
      "targetHandle": "data"
    }
  ]
}