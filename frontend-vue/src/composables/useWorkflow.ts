import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { Workflow, NodeData, EdgeData, PluginDefinition, Position, ExecutionState } from '../types/api'
import { loadWorkflow as apiLoadWorkflow, saveWorkflow as apiSaveWorkflow, executeWorkflow as apiExecuteWorkflow, getExecutionStatus, stopExecution } from '../services/api'

export interface UseWorkflowReturn {
  workflow: Ref<Workflow | null>
  selectedNodeId: Ref<string | null>
  executionState: Ref<ExecutionState | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  selectedNode: ComputedRef<NodeData | null>
  load: (name: string) => Promise<void>
  save: () => Promise<void>
  execute: () => Promise<void>
  stop: () => Promise<void>
  selectNode: (nodeId: string | null) => void
  updateNodeConfig: (nodeId: string, configValues: Record<string, unknown>) => void
  addNode: (plugin: PluginDefinition, position: Position) => void
  removeNode: (nodeId: string) => void
  addEdge: (edge: EdgeData) => void
  removeEdge: (edgeId: string) => void
}

export function useWorkflow(): UseWorkflowReturn {
  const workflow = ref<Workflow | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const executionState = ref<ExecutionState | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let pollingInterval: ReturnType<typeof setInterval> | null = null

  const selectedNode = computed(() => {
    if (!workflow.value || !selectedNodeId.value) return null
    return workflow.value.nodes.find(n => n.id === selectedNodeId.value) || null
  })

  const load = async (name: string) => {
    isLoading.value = true
    error.value = null
    try {
      const data = await apiLoadWorkflow(name)
      workflow.value = data
      selectedNodeId.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load workflow'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const save = async () => {
    if (!workflow.value) return
    isLoading.value = true
    error.value = null
    try {
      await apiSaveWorkflow(workflow.value.name, workflow.value)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save workflow'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const execute = async () => {
    if (!workflow.value) return
    isLoading.value = true
    error.value = null
    try {
      const result = await apiExecuteWorkflow(workflow.value)
      executionState.value = {
        status: 'running',
        taskId: result.taskId,
        progress: { current: 0, total: workflow.value.nodes.length, currentNode: null },
        logs: [],
        result: null,
        error: null,
        failedNode: null
      }
      startPolling(result.taskId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to execute workflow'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const startPolling = (taskId: string) => {
    if (pollingInterval) clearInterval(pollingInterval)
    pollingInterval = setInterval(async () => {
      try {
        const state = await getExecutionStatus(taskId)
        executionState.value = state
        if (state.status === 'done' || state.status === 'failed') {
          stopPolling()
        }
      } catch {
        stopPolling()
      }
    }, 1000)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  const stop = async () => {
    if (!executionState.value?.taskId) return
    stopPolling()
    try {
      await stopExecution(executionState.value.taskId)
      executionState.value = { ...executionState.value, status: 'cancelled' }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to stop execution'
    }
  }

  const selectNode = (nodeId: string | null) => {
    selectedNodeId.value = nodeId
  }

  const updateNodeConfig = (nodeId: string, configValues: Record<string, unknown>) => {
    if (!workflow.value) return
    const node = workflow.value.nodes.find(n => n.id === nodeId)
    if (node) {
      node.configValues = { ...node.configValues, ...configValues }
    }
  }

  const addNode = (plugin: PluginDefinition, position: Position) => {
    if (!workflow.value) return
    const nodeId = `${plugin.id}_${Date.now()}`
    const newNode: NodeData = {
      ...plugin,
      id: nodeId,
      configValues: plugin.config.reduce((acc, field) => {
        acc[field.key] = field.default
        return acc
      }, {} as Record<string, unknown>),
      position
    }
    workflow.value.nodes.push(newNode)
  }

  const removeNode = (nodeId: string) => {
    if (!workflow.value) return
    workflow.value.nodes = workflow.value.nodes.filter(n => n.id !== nodeId)
    workflow.value.edges = workflow.value.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }
  }

  const addEdge = (edge: EdgeData) => {
    if (!workflow.value) return
    const exists = workflow.value.edges.some(
      e => e.source === edge.source && e.target === edge.target
    )
    if (!exists) {
      workflow.value.edges.push(edge)
    }
  }

  const removeEdge = (edgeId: string) => {
    if (!workflow.value) return
    workflow.value.edges = workflow.value.edges.filter(e => e.id !== edgeId)
  }

  return {
    workflow,
    selectedNodeId,
    executionState,
    isLoading,
    error,
    selectedNode,
    load,
    save,
    execute,
    stop,
    selectNode,
    updateNodeConfig,
    addNode,
    removeNode,
    addEdge,
    removeEdge
  }
}
