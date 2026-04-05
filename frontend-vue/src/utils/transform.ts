import type { NodeItem, EdgeItem } from '../types/internal'
import type { NodeData, EdgeData, PluginDefinition, ConfigField } from '../types/api'

export function nodeItemToNodeData(node: NodeItem, plugins: PluginDefinition[]): NodeData {
  const plugin = plugins.find(p => p.id === node.data.type || p.name === node.data.name)
  return {
    id: node.id,
    name: node.data.name,
    category: node.data.category || plugin?.category || '',
    icon: node.data.icon || plugin?.icon || '📦',
    version: plugin?.version || '1.0',
    description: plugin?.description || '',
    entry: plugin?.entry || '',
    type: plugin?.type || 'exe',
    config: node.data.config || plugin?.config || [],
    inputs: node.data.inputs || plugin?.inputs || [],
    outputs: node.data.outputs || plugin?.outputs || [],
    position: node.position,
    configValues: node.data.configValues
  }
}

export function nodeDataToNodeItem(nodeData: NodeData, plugins: PluginDefinition[]): NodeItem {
  const configValues = nodeData.configValues || {}
  const plugin = plugins.find(p => p.id === nodeData.type || p.name === nodeData.name)

  return {
    id: nodeData.id || `node_${Date.now()}`,
    type: 'dynamic',
    position: nodeData.position || { x: 0, y: 0 },
    data: {
      id: nodeData.id,
      name: nodeData.name,
      icon: nodeData.icon || plugin?.icon || '📦',
      category: nodeData.category || plugin?.category || '',
      type: nodeData.type,
      config: nodeData.config || plugin?.config || [],
      inputs: nodeData.inputs || plugin?.inputs || [],
      outputs: nodeData.outputs || plugin?.outputs || [],
      configValues
    }
  }
}

export function edgeItemToEdgeData(edge: EdgeItem): EdgeData {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || '',
    targetHandle: edge.targetHandle || ''
  }
}

export function edgeDataToEdgeItem(edgeData: EdgeData): EdgeItem {
  return {
    id: edgeData.id || `edge_${Date.now()}`,
    source: edgeData.source,
    target: edgeData.target,
    sourceHandle: edgeData.sourceHandle || null,
    targetHandle: edgeData.targetHandle || null
  }
}

export function createNodeFromPlugin(plugin: PluginDefinition, position: { x: number; y: number }): NodeItem {
  const id = `node_${Date.now()}`
  return {
    id,
    type: 'dynamic',
    position,
    data: {
      id,
      name: plugin.name,
      icon: plugin.icon,
      category: plugin.category,
      type: plugin.id,
      config: plugin.config,
      inputs: plugin.inputs,
      outputs: plugin.outputs,
      configValues: plugin.config.reduce((acc: Record<string, unknown>, field: ConfigField) => {
        acc[field.key] = field.default
        return acc
      }, {})
    }
  }
}
