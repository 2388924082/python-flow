{
  "name": "111",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775360822925",
      "type": "node_1775360822925",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 151,
        "y": 211
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
      "id": "node_1775382223105",
      "type": "node_1775382223105",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 606,
        "y": 227
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
    },
    {
      "id": "node_1775382785849",
      "type": "node_1775382785849",
      "name": "数据聚合器",
      "icon": "🔗",
      "category": "process",
      "position": {
        "x": 397,
        "y": 215
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
      "id": "node_1775382944993",
      "type": "input",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 352,
        "y": 96
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
    }
  ],
  "edges": [
    {
      "id": "edge_1775382829784",
      "source": "node_1775360822925",
      "target": "node_1775382785849",
      "sourceHandle": "",
      "targetHandle": ""
    },
    {
      "id": "edge_1775382831240",
      "source": "node_1775382785849",
      "target": "node_1775382223105",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}