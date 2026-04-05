{
  "name": "333",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775365813716",
      "type": "node_1775365813716",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 146,
        "y": 191
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
      "id": "node_1775365815781",
      "type": "node_1775365815781",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 96,
        "y": 168
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
      "id": "node_1775383660753",
      "type": "input",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 469,
        "y": 196
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
      "id": "edge_1775365818699",
      "source": "node_1775365815781",
      "target": "node_1775365813716",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}