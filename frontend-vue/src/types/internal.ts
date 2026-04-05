import type { Position } from './api'

export interface NodeItem {
  id: string
  type: string
  position: Position
  data: {
    id: string
    name: string
    icon: string
    category: string
    type: string
    config: any[]
    inputs: any[]
    outputs: any[]
    configValues: Record<string, unknown>
  }
}

export interface EdgeItem {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

export interface WorkflowState {
  nodes: NodeItem[]
  edges: EdgeItem[]
  currentWorkflow: string | null
  selectedNodeId: string | null
}
