import type {
  PluginDefinition,
  Workflow,
  ExecutionState,
} from '../types/api';
import logger from '../utils/logger';

const API_BASE = 'http://localhost:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.text();
    logger.error(`API Error: ${res.status} ${res.statusText}`, error);
    throw new Error(error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getNodes(): Promise<PluginDefinition[]> {
  logger.debug('Fetching nodes from backend');
  const res = await fetch(`${API_BASE}/nodes`);
  const data = await handleResponse<PluginDefinition[]>(res);
  logger.info(`Loaded ${data.length} plugins`);
  return data;
}

export async function scanNodes(): Promise<{
  message: string;
  loaded: number;
  failed: number;
}> {
  logger.info('Scanning for plugins');
  const res = await fetch(`${API_BASE}/nodes/scan`, { method: 'POST' });
  const data = await handleResponse<{ message: string; loaded: number; failed: number }>(res);
  logger.info(`Scan complete: ${data.loaded} loaded, ${data.failed} failed`);
  return data;
}

export async function listWorkflows(): Promise<string[]> {
  logger.debug('Listing workflows');
  const res = await fetch(`${API_BASE}/workflows`);
  const data = await handleResponse<string[]>(res);
  logger.debug(`Found ${data.length} workflows`);
  return data;
}

export async function loadWorkflow(name: string): Promise<Workflow> {
  logger.info(`Loading workflow: ${name}`);
  const res = await fetch(`${API_BASE}/workflows/${name}`);
  const data = await handleResponse<Workflow>(res);
  logger.info(`Workflow loaded: ${name}, ${data.nodes.length} nodes, ${data.edges.length} edges`);
  return data;
}

export async function saveWorkflow(workflow: Workflow): Promise<void> {
  logger.info(`Saving workflow: ${workflow.name}`);
  const res = await fetch(`${API_BASE}/workflows/${workflow.name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  if (!res.ok) {
    logger.error(`Failed to save workflow: ${workflow.name}`);
    throw new Error('保存工作流失败');
  }
  logger.info(`Workflow saved: ${workflow.name}`);
}

export async function renameWorkflow(oldName: string, newName: string): Promise<void> {
  logger.info(`Renaming workflow: ${oldName} -> ${newName}`);
  const res = await fetch(`${API_BASE}/workflows/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldName, newName }),
  });
  if (!res.ok) {
    logger.error(`Failed to rename workflow: ${oldName}`);
    throw new Error('重命名工作流失败');
  }
  logger.info(`Workflow renamed: ${oldName} -> ${newName}`);
}

export async function deleteWorkflow(name: string): Promise<void> {
  logger.info(`Deleting workflow: ${name}`);
  const res = await fetch(`${API_BASE}/workflows/${name}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    logger.error(`Failed to delete workflow: ${name}`);
    throw new Error('删除工作流失败');
  }
  logger.info(`Workflow deleted: ${name}`);
}

export async function executeWorkflow(
  workflow: Workflow
): Promise<{ taskId: string }> {
  logger.info(`Executing workflow: ${workflow.name}, ${workflow.nodes.length} nodes`);
  const res = await fetch(`${API_BASE}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  const data = await handleResponse<{ taskId: string }>(res);
  logger.info(`Workflow execution started, taskId: ${data.taskId}`);
  return data;
}

export async function getExecutionStatus(
  taskId: string
): Promise<ExecutionState> {
  logger.debug(`Polling execution status: ${taskId}`);
  const res = await fetch(`${API_BASE}/execute/${taskId}`);
  return handleResponse<ExecutionState>(res);
}

export async function stopExecution(taskId: string): Promise<void> {
  logger.info(`Stopping execution: ${taskId}`);
  const res = await fetch(`${API_BASE}/execute/${taskId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    logger.error(`Failed to stop execution: ${taskId}`);
    throw new Error('停止执行失败');
  }
  logger.info(`Execution stopped: ${taskId}`);
}
