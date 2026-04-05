import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { NodeItem, EdgeItem } from '../types/internal'
import type { PluginDefinition, Position } from '../types/api'
import { createNodeFromPlugin, edgeDataToEdgeItem, nodeDataToNodeItem, nodeItemToNodeData, edgeItemToEdgeData } from '../utils/transform'
import { saveWorkflow, loadWorkflow as loadWorkflowApi, executeWorkflow } from '../services/api'

export interface UseWorkflowOptions {
  onLog?: (message: string, level: 'debug' | 'info' | 'warn' | 'error') => void
}

export interface UseWorkflowReturn {
  nodes: Ref<NodeItem[]>
  edges: Ref<EdgeItem[]>
  currentWorkflow: Ref<string | null>
  selectedNodeId: Ref<string | null>
  selectedNode: ComputedRef<NodeItem | null>
  isDirty: Ref<boolean>
  addNode: (plugin: PluginDefinition, position: Position) => void
  removeNode: (nodeId: string) => void
  updateNodeConfig: (nodeId: string, key: string, value: unknown) => void
  updateNodePosition: (nodeId: string, position: Position) => void
  selectNode: (nodeId: string | null) => void
  addEdge: (source: string, target: string, sourceHandle?: string | null, targetHandle?: string | null) => void
  removeEdge: (edgeId: string) => void
  removeEdgesByNode: (nodeId: string) => void
  newWorkflow: () => void
  save: (plugins: PluginDefinition[]) => Promise<void>
  load: (name: string, plugins: PluginDefinition[]) => Promise<void>
  execute: () => Promise<{ taskId: string }>
}

export function useWorkflow(options: UseWorkflowOptions = {}): UseWorkflowReturn {
  const nodes = ref<NodeItem[]>([])
  const edges = ref<EdgeItem[]>([])
  const currentWorkflow = ref<string | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const isDirty = ref(false)

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return nodes.value.find(n => n.id === selectedNodeId.value) || null
  })

  const log = (message: string, level: 'debug' | 'info' | 'warn' | 'error') => {
    options.onLog?.(message, level)
  }

  const addNode = (plugin: PluginDefinition, position: Position) => {
    const newNode = createNodeFromPlugin(plugin, position)
    nodes.value.push(newNode)
    isDirty.value = true
    log(`Added node: ${plugin.name}`, 'info')
  }

  const removeNode = (nodeId: string) => {
    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }
    isDirty.value = true
    log(`Deleted node: ${nodeId}`, 'info')
  }

  const updateNodeConfig = (nodeId: string, key: string, value: unknown) => {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node) {
      node.data.configValues[key] = value
      isDirty.value = true
      log(`Updated ${node.data.name}: ${key} = ${value}`, 'debug')
    }
  }

  const updateNodePosition = (nodeId: string, position: Position) => {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node) {
      node.position = position
      isDirty.value = true
    }
  }

  const selectNode = (nodeId: string | null) => {
    selectedNodeId.value = nodeId
  }

  const addEdge = (source: string, target: string, sourceHandle?: string | null, targetHandle?: string | null) => {
    const id = `edge_${Date.now()}`
    edges.value.push({
      id,
      source,
      target,
      sourceHandle,
      targetHandle
    })
    isDirty.value = true
    log(`Connected ${source} -> ${target}`, 'info')
  }

  const removeEdge = (edgeId: string) => {
    edges.value = edges.value.filter(e => e.id !== edgeId)
    isDirty.value = true
  }

  const removeEdgesByNode = (nodeId: string) => {
    edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
    isDirty.value = true
  }

  const newWorkflow = () => {
    currentWorkflow.value = null
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    isDirty.value = false
    log('Created new workflow', 'info')
  }

  const save = async (plugins: PluginDefinition[]) => {
    if (!currentWorkflow.value) {
      throw new Error('No workflow name')
    }
    const workflowData = {
      name: currentWorkflow.value,
      version: '1.0',
      nodes: nodes.value.map(n => nodeItemToNodeData(n, plugins)),
      edges: edges.value.map(e => edgeItemToEdgeData(e))
    }
    await saveWorkflow(currentWorkflow.value, workflowData as any)
    isDirty.value = false
    log(`Saved workflow: ${currentWorkflow.value}`, 'info')
  }

  const load = async (name: string, plugins: PluginDefinition[]) => {
    const workflow = await loadWorkflowApi(name)
    currentWorkflow.value = name

    const loadedNodes = (workflow.nodes || []).map((n: any) =>
      nodeDataToNodeItem(n, plugins)
    )
    const loadedEdges = (workflow.edges || []).map((e: any) =>
      edgeDataToEdgeItem(e)
    )

    nodes.value = loadedNodes
    edges.value = loadedEdges
    selectedNodeId.value = null
    isDirty.value = false
    log(`Loaded workflow: ${name}`, 'info')
  }

  const execute = async () => {
    const workflowData = {
      name: currentWorkflow.value || 'unnamed',
      version: '1.0',
      nodes: nodes.value.map(n => ({
        id: n.id,
        type: n.data.type || n.data.id || n.type,
        name: n.data.name,
        configValues: n.data.configValues,
        position: n.position
      })),
      edges: edges.value.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
    }
    const result = await executeWorkflow(workflowData as any)
    log(`Execution started: ${result.taskId}`, 'info')
    return result
  }

  return {
    nodes,
    edges,
    currentWorkflow,
    selectedNodeId,
    selectedNode,
    isDirty,
    addNode,
    removeNode,
    updateNodeConfig,
    updateNodePosition,
    selectNode,
    addEdge,
    removeEdge,
    removeEdgesByNode,
    newWorkflow,
    save,
    load,
    execute
  }
}
