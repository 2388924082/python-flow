{
  "name": "333",
  "version": "1.0",
  "nodes": [
    {
      "id": "node_1775403864693",
      "type": "csv_converter",
      "name": "CSV转换器",
      "icon": "📊",
      "category": "process",
      "position": {
        "x": 384,
        "y": 232
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
    },
    {
      "id": "node_1775403867484",
      "type": "input",
      "name": "数据输入",
      "icon": "📥",
      "category": "input",
      "position": {
        "x": 206,
        "y": 184
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
      "id": "node_1775403870916",
      "type": "output",
      "name": "数据输出",
      "icon": "📤",
      "category": "output",
      "position": {
        "x": 689,
        "y": 257
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
      "id": "edge_1775403872948",
      "source": "node_1775403867484",
      "target": "node_1775403864693",
      "sourceHandle": "",
      "targetHandle": ""
    },
    {
      "id": "edge_1775403877908",
      "source": "node_1775403864693",
      "target": "node_1775403870916",
      "sourceHandle": "",
      "targetHandle": ""
    }
  ]
}