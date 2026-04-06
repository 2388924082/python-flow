import type { PluginDefinition, Workflow, ExecutionState, CategoryDefinition } from '../types/api'

const API_BASE = '/api'

export async function getNodes(): Promise<PluginDefinition[]> {
  const res = await fetch(`${API_BASE}/nodes`)
  if (!res.ok) throw new Error('Failed to fetch nodes')
  return res.json()
}

export async function getCategories(): Promise<CategoryDefinition[]> {
  const res = await fetch(`${API_BASE}/categories`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

export async function listWorkflows(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/workflows`)
  if (!res.ok) throw new Error('Failed to fetch workflows')
  return res.json()
}

export async function loadWorkflow(name: string): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/workflows/${name}`)
  if (!res.ok) throw new Error(`Failed to load workflow: ${name}`)
  return res.json()
}

export async function saveWorkflow(name: string, workflow: Workflow): Promise<void> {
  const res = await fetch(`${API_BASE}/workflows/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow)
  })
  if (!res.ok) throw new Error(`Failed to save workflow: ${name}`)
}

export async function executeWorkflow(workflow: Workflow): Promise<{ taskId: string }> {
  const res = await fetch(`${API_BASE}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow)
  })
  if (!res.ok) throw new Error('Failed to execute workflow')
  const data = await res.json()
  return { taskId: data.taskId || data.task_id }
}

export async function getExecutionStatus(taskId: string): Promise<ExecutionState> {
  const res = await fetch(`${API_BASE}/execute/${taskId}`)
  if (!res.ok) throw new Error(`Failed to get execution status: ${taskId}`)
  return res.json()
}

export async function stopExecution(taskId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/execute/${taskId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error(`Failed to stop execution: ${taskId}`)
}

export async function renameWorkflow(oldName: string, newName: string): Promise<void> {
  const res = await fetch(`${API_BASE}/workflows/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldName, newName })
  })
  if (!res.ok) throw new Error(`Failed to rename workflow: ${oldName}`)
}

export async function deleteWorkflow(name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/workflows/${name}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error(`Failed to delete workflow: ${name}`)
}
