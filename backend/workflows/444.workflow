{
  "name": "444",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775369591004",
      "type": "input",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 134,
        "y": 209
      },
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
      }
    },
    {
      "id": "node_1775369593756",
      "type": "aggregator",
      "name": "数据聚合器",
      "icon": "🔗",
      "category": "process",
      "position": {
        "x": 428,
        "y": 232
      },
      "config": [
        {
          "key": "strategy",
          "name": "聚合策略",
          "type": "select",
          "default": "merge",
          "options": [
            "merge",
            "concat",
            "zip"
          ]
        }
      ],
      "inputs": [
        {
          "key": "data1",
          "name": "数据源1",
          "type": "json"
        },
        {
          "key": "data2",
          "name": "数据源2",
          "type": "json"
        }
      ],
      "outputs": [
        {
          "key": "result",
          "name": "聚合结果",
          "type": "json"
        }
      ],
      "configValues": {
        "strategy": "merge"
      }
    },
    {
      "id": "node_1775369598835",
      "type": "output",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 422,
        "y": 251
      },
      "config": [],
      "inputs": [
        {
          "key": "data",
          "name": "输入数据",
          "type": "json"
        }
      ],
      "outputs": [],
      "configValues": {}
    }
  ],
  "edges": [
    {
      "id": "edge_1775369596690",
      "source": "node_1775369591004",
      "target": "node_1775369593756",
      "sourceHandle": "",
      "targetHandle": ""
    },
    {
      "id": "edge_1775369602754",
      "source": "node_1775369593756",
      "target": "node_1775369598835",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}