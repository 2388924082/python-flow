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
        "x": 137,
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
      "id": "node_1775382223105",
      "type": "node_1775382223105",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 579,
        "y": 91
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
      "id": "edge_1775383989048",
      "source": "node_1775360822925",
      "target": "node_1775382223105",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}