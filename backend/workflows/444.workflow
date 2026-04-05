{
  "name": "444",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775383699193",
      "type": "python",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 15.938905792116344,
        "y": 173.94609353267134
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
      "id": "node_1775383701377",
      "type": "python",
      "name": "数据日志",
      "icon": "📝",
      "category": "debug",
      "position": {
        "x": 303.8250226366367,
        "y": 272.81419540834304
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
    },
    {
      "id": "node_1775383703953",
      "type": "python",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 582.007799513688,
        "y": 183.67746437462148
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
      "id": "node_1775383766426",
      "type": "python",
      "name": "CSV转换器",
      "icon": "📊",
      "category": "process",
      "position": {
        "x": 296.1951459663875,
        "y": 18.661470859852088
      },
      "config": [
        {
          "key": "delimiter",
          "name": "分隔符",
          "type": "string",
          "default": ",",
          "options": null
        },
        {
          "key": "has_header",
          "name": "包含表头",
          "type": "boolean",
          "default": true,
          "options": null
        }
      ],
      "inputs": [
        {
          "key": "csv_data",
          "name": "CSV数据",
          "type": "string"
        }
      ],
      "outputs": [
        {
          "key": "json_data",
          "name": "JSON数据",
          "type": "json"
        }
      ],
      "configValues": {
        "delimiter": ",",
        "has_header": true
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1775383706008",
      "source": "node_1775383699193",
      "target": "node_1775383701377",
      "sourceHandle": "",
      "targetHandle": ""
    },
    {
      "id": "edge_1775383709424",
      "source": "node_1775383701377",
      "target": "node_1775383703953",
      "sourceHandle": "",
      "targetHandle": ""
    },
    {
      "id": "edge_1775383795200",
      "source": "node_1775383699193",
      "target": "node_1775383766426",
      "sourceHandle": "",
      "targetHandle": ""
    },
    {
      "id": "edge_1775383801232",
      "source": "node_1775383766426",
      "target": "node_1775383703953",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}