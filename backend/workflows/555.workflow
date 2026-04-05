{
  "name": "555",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775370714469",
      "type": "input",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 246,
        "y": 183
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
      "id": "node_1775370716852",
      "type": "output",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 436,
        "y": 208
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
      "id": "edge_1775370719882",
      "source": "node_1775370714469",
      "target": "node_1775370716852",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}