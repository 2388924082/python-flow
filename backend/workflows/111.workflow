{
  "name": "25",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775360822925",
      "type": "input",
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
      "id": "node_1775360825132",
      "type": "output",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 387,
        "y": 302
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
      "id": "edge_1775360827531",
      "source": "node_1775360822925",
      "target": "node_1775360825132",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}