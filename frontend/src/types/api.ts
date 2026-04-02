export interface Position {
  x: number;
  y: number;
}

export interface ConfigField {
  key: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'select';
  default: unknown;
  options: string[] | null;
}

export interface Port {
  key: string;
  name: string;
  type: 'file' | 'json' | 'string' | 'number';
}

export interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  icon: string;
  type: 'python' | 'exe' | 'bat';
  entry: string;
  config: ConfigField[];
  inputs: Port[];
  outputs: Port[];
  config_mapping: Record<string, unknown>[] | null;
}

export interface NodeData extends PluginDefinition {
  configValues: Record<string, unknown>;
  position?: Position;
  [key: string]: unknown;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface Workflow {
  name: string;
  version: string;
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface Progress {
  current: number;
  total: number;
  currentNode: string | null;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  nodeId: string | null;
}

export interface ExecutionState {
  status: 'pending' | 'running' | 'done' | 'failed';
  taskId: string;
  progress: Progress;
  logs: LogEntry[];
  result: Record<string, unknown> | null;
  error: string | null;
  failedNode: string | null;
}

export interface WorkflowListItem {
  name: string;
  file: string;
  updated_at: string;
}
