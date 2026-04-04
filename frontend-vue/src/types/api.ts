export interface ConfigField {
  key: string
  name: string
  type: 'string' | 'text' | 'number' | 'boolean' | 'file' | 'select'
  default: unknown
  options: string[] | null
}

export interface Port {
  key: string
  name: string
  type: 'file' | 'json' | 'string' | 'number'
}

export interface CategoryDefinition {
  id: string
  name: string
  icon: string
  order: number
}

export interface PluginDefinition {
  id: string
  name: string
  version: string
  description: string
  category: string
  icon: string
  type: 'python' | 'exe' | 'bat'
  entry: string
  config: ConfigField[]
  inputs: Port[]
  outputs: Port[]
}

export interface Position {
  x: number
  y: number
}

export interface NodeData extends PluginDefinition {
  configValues: Record<string, unknown>
  position?: Position
}

export interface EdgeData {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
}

export interface Workflow {
  name: string
  version: string
  nodes: NodeData[]
  edges: EdgeData[]
}

export interface LogEntry {
  id: string
  timestamp: string
  source: 'FE' | 'BE'
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  nodeId: string | null
}

export interface ExecutionState {
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
  taskId: string
  progress: {
    current: number
    total: number
    currentNode: string | null
  }
  logs: LogEntry[]
  result: Record<string, unknown> | null
  error: string | null
  failedNode: string | null
}
