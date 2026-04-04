{
  "name": "222",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775314778017",
      "type": "dynamic",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 183,
        "y": 189
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
      "id": "node_1775314779944",
      "type": "dynamic",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 457,
        "y": 269
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
      "id": "edge_1775314782056",
      "source": "node_1775314778017",
      "target": "node_1775314779944",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}