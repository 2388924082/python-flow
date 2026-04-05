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
        "x": 472,
        "y": 243
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
        "x": 100,
        "y": 199
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
      "type": "node_1775383660753",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 305,
        "y": 71
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