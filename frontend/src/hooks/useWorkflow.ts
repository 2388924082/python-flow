import { useState, useCallback } from 'react';
import type {
  Workflow,
  NodeData,
  EdgeData,
  ExecutionState,
  PluginDefinition,
} from '../types/api';
import * as api from '../services/api';
import logger from '../utils/logger';

export function useWorkflow() {
  const [workflow, setWorkflow] = useState<Workflow>({
    name: 'untitled',
    version: '1.0',
    nodes: [],
    edges: [],
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  const selectedNode: NodeData | null =
    workflow.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const loadWorkflow = useCallback(async (name: string) => {
    setIsLoading(true);
    setError(null);
    logger.debug(`Loading workflow: ${name}`);
    try {
      const wf = await api.loadWorkflow(name);
      setWorkflow(wf);
      setSelectedNodeId(null);
      logger.info(`Workflow loaded: ${name}`);
    } catch (e) {
      logger.error(`Failed to load workflow: ${name}`, e);
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveWorkflow = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    logger.info(`Saving workflow: ${workflow.name}`);
    try {
      await api.saveWorkflow(workflow);
      logger.info(`Workflow saved: ${workflow.name}`);
    } catch (e) {
      logger.error(`Failed to save workflow: ${workflow.name}`, e);
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setIsLoading(false);
    }
  }, [workflow]);

  const executeWorkflow = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setExecutionState(null);
    logger.info(`Starting workflow execution: ${workflow.name}`);
    try {
      const { taskId } = await api.executeWorkflow(workflow);
      logger.info(`Execution started, taskId: ${taskId}`);

      const interval = window.setInterval(async () => {
        try {
          const state = await api.getExecutionStatus(taskId);
          setExecutionState(state);
          if (state.status === 'done' || state.status === 'failed') {
            clearInterval(interval);
            setPollInterval(null);
            logger.info(`Workflow execution ${state.status}: ${workflow.name}`);
          }
        } catch (e) {
          logger.error(`Failed to poll execution status: ${taskId}`, e);
        }
      }, 1000);
      setPollInterval(interval);
    } catch (e) {
      logger.error(`Failed to execute workflow: ${workflow.name}`, e);
      setError(e instanceof Error ? e.message : '执行失败');
    } finally {
      setIsLoading(false);
    }
  }, [workflow]);

  const stopExecution = useCallback(async () => {
    if (!executionState) return;
    logger.info(`Stopping execution: ${executionState.taskId}`);
    try {
      await api.stopExecution(executionState.taskId);
      if (pollInterval) clearInterval(pollInterval);
      setPollInterval(null);
      logger.info(`Execution stopped: ${executionState.taskId}`);
    } catch (e) {
      logger.error(`Failed to stop execution: ${executionState.taskId}`, e);
      setError(e instanceof Error ? e.message : '停止失败');
    }
  }, [executionState, pollInterval]);

  const selectNode = useCallback((nodeId: string | null) => {
    logger.debug(`Node selected: ${nodeId}`);
    setSelectedNodeId(nodeId);
  }, []);

  const updateNodeConfig = useCallback(
    (nodeId: string, configValues: Record<string, unknown>) => {
      logger.debug(`Updating node config: ${nodeId}`);
      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, configValues } : n
        ),
      }));
    },
    []
  );

  const addNode = useCallback(
    (plugin: PluginDefinition, position: { x: number; y: number }, nodeId?: string) => {
      const id = nodeId || `${plugin.id}_${Date.now()}`;
      logger.debug(`Adding node: ${id} (${plugin.name}) at (${position.x}, ${position.y})`);
      const newNode: NodeData = {
        ...plugin,
        configValues: plugin.config.reduce(
          (acc, c) => ({ ...acc, [c.key]: c.default }),
          {}
        ),
      };
      setWorkflow((prev) => ({
        ...prev,
        nodes: [
          ...prev.nodes,
          { ...newNode, id, position },
        ] as NodeData[],
      }));
      setSelectedNodeId(id);
      logger.info(`Node added: ${id} (${plugin.name})`);
    },
    []
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      logger.debug(`Removing node: ${nodeId}`);
      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        edges: prev.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
      }));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      logger.info(`Node removed: ${nodeId}`);
    },
    [selectedNodeId]
  );

  const addEdge = useCallback((edge: EdgeData) => {
    logger.debug(`Adding edge: ${edge.id} (${edge.source} -> ${edge.target})`);
    setWorkflow((prev) => ({
      ...prev,
      edges: [...prev.edges, edge],
    }));
    logger.info(`Edge added: ${edge.id}`);
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    logger.debug(`Removing edge: ${edgeId}`);
    setWorkflow((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
    }));
    logger.info(`Edge removed: ${edgeId}`);
  }, []);

  const updateNodePosition = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      logger.debug(`Node position updated: ${nodeId} at (${position.x}, ${position.y})`);
      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, position } : n
        ),
      }));
    },
    []
  );

  const resetWorkflow = useCallback(() => {
    logger.info('Resetting workflow to empty state');
    setWorkflow({
      name: 'untitled',
      version: '1.0',
      nodes: [],
      edges: [],
    });
    setSelectedNodeId(null);
    setExecutionState(null);
    setError(null);
  }, []);

  return {
    workflow,
    selectedNode,
    selectedNodeId,
    executionState,
    isLoading,
    error,
    loadWorkflow,
    saveWorkflow,
    executeWorkflow,
    stopExecution,
    selectNode,
    updateNodeConfig,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    updateNodePosition,
    resetWorkflow,
    setError,
  };
}
