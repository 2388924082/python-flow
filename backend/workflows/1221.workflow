{
  "name": "1221",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775314748632",
      "type": "dynamic",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 318,
        "y": 219
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
      "id": "node_1775316399088",
      "type": "dynamic",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 594,
        "y": 280
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
      "id": "edge_1775316401510",
      "source": "node_1775314748632",
      "target": "node_1775316399088",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}