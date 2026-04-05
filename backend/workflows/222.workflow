{
  "name": "222",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775360889997",
      "type": "input",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 145,
        "y": 221
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
      "id": "node_1775360892004",
      "type": "data_logger",
      "name": "数据日志",
      "icon": "📝",
      "category": "debug",
      "position": {
        "x": 360,
        "y": 305
      },
      "config": [
        {
          "key": "level",
          "name": "日志级别",
          "type": "select",
          "default": "info",
          "options": [
            "debug",
            "info",
            "warn",
            "error"
          ]
        },
        {
          "key": "message",
          "name": "自定义消息",
          "type": "string",
          "default": "",
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
          "key": "passthrough",
          "name": "透传数据",
          "type": "json"
        }
      ],
      "configValues": {
        "level": "info",
        "message": ""
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1775360893851",
      "source": "node_1775360889997",
      "target": "node_1775360892004",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}