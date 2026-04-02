import { useState, useCallback, useRef } from 'react';
import type { Workflow, NodeData, EdgeData, ExecutionState, PluginDefinition } from '../types/api';
import * as api from '../services/api';
import logger from '../utils/logger';

interface WorkflowTab {
  id: string;
  name: string;
  originalName: string | null;
  workflow: Workflow;
  selectedNodeId: string | null;
  executionState: ExecutionState | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
}

interface UseWorkflowTabsReturn {
  tabs: WorkflowTab[];
  activeTabId: string | null;
  activeWorkflow: Workflow | null;
  activeSelectedNode: NodeData | null;
  createNewTab: () => void;
  openTab: (name: string) => void;
  closeTab: (tabId: string) => void;
  selectTab: (tabId: string) => void;
  renameTab: (tabId: string, newName: string) => void;
  renameTabByName: (originalName: string, newName: string) => void;
  updateWorkflowName: (name: string) => void;
  saveWorkflow: () => Promise<void>;
  executeWorkflow: () => Promise<void>;
  stopExecution: () => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  updateNodeConfig: (nodeId: string, configValues: Record<string, unknown>) => void;
  addNode: (plugin: PluginDefinition, position: { x: number; y: number }, nodeId?: string) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: EdgeData) => void;
  removeEdge: (edgeId: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  markDirty: () => void;
  setOnSaveCallback: (callback: () => void) => void;
  setOnRenameCallback: (callback: (oldName: string, newName: string) => void) => void;
}

export function useWorkflowTabs(): UseWorkflowTabsReturn {
  const [tabs, setTabs] = useState<WorkflowTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const onSaveCallbackRef = useRef<(() => void) | null>(null);
  const onRenameCallbackRef = useRef<((oldName: string, newName: string) => void) | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;
  const activeWorkflow = activeTab?.workflow || null;
  const activeSelectedNode = activeWorkflow?.nodes.find((n) => n.id === activeTab?.selectedNodeId) || null;

  const createNewTab = useCallback(() => {
    const id = `tab_${Date.now()}`;
    const existingNames = tabs.map(t => t.name);
    let baseName = 'untitled';
    let counter = 0;
    for (const name of existingNames) {
      if (name === 'untitled') {
        counter = Math.max(counter, 0);
      } else {
        const match = name.match(/^untitled-(\d+)$/);
        if (match) {
          counter = Math.max(counter, parseInt(match[1]));
        }
      }
    }
    if (counter > 0 || existingNames.includes('untitled')) {
      baseName = `untitled-${counter + 1}`;
    }
    const newTab: WorkflowTab = {
      id,
      name: baseName,
      originalName: null,
      workflow: {
        name: baseName,
        version: '1.0',
        nodes: [],
        edges: [],
      },
      selectedNodeId: null,
      executionState: null,
      isLoading: false,
      error: null,
      isDirty: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
    logger.info(`New tab created: ${id}`);
  }, [tabs]);

  const openTab = useCallback(async (name: string) => {
    const existingTab = tabs.find((t) => t.name === name);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      logger.info(`Switched to existing tab: ${existingTab.id}`);
      return;
    }

    const id = `tab_${Date.now()}`;
    const newTab: WorkflowTab = {
      id,
      name,
      originalName: name,
      workflow: {
        name,
        version: '1.0',
        nodes: [],
        edges: [],
      },
      selectedNodeId: null,
      executionState: null,
      isLoading: true,
      error: null,
      isDirty: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);

    try {
      const wf = await api.loadWorkflow(name);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, workflow: wf, isLoading: false, isDirty: false }
            : t
        )
      );
      logger.info(`Workflow loaded in tab: ${name}`);
    } catch (e) {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, isLoading: false, error: e instanceof Error ? e.message : '加载失败' }
            : t
        )
      );
      logger.error(`Failed to load workflow: ${name}`, e);
    }
  }, [tabs]);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      logger.info(`Tab closed: ${tabId}`);
      return newTabs;
    });
  }, [activeTabId]);

  const selectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    logger.debug(`Tab selected: ${tabId}`);
  }, []);

  const renameTab = useCallback((tabId: string, newName: string) => {
    setTabs((prev) => {
      const tab = prev.find(t => t.id === tabId);
      if (tab && tab.originalName && tab.name !== newName && tab.originalName !== newName) {
        api.renameWorkflow(tab.originalName, newName).catch(e => logger.error('Rename failed', e));
        onRenameCallbackRef.current?.(tab.originalName, newName);
      }
      return prev.map((t) =>
        t.id === tabId
          ? { ...t, name: newName, workflow: { ...t.workflow, name: newName }, originalName: t.originalName || newName }
          : t
      );
    });
    logger.info(`Tab renamed: ${tabId} -> ${newName}`);
  }, []);

  const renameTabByName = useCallback((oldName: string, newName: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.name === oldName || t.originalName === oldName
          ? { ...t, name: newName, workflow: { ...t.workflow, name: newName }, originalName: t.originalName === oldName ? newName : t.originalName }
          : t
      )
    );
    logger.info(`Tab renamed by original name: ${oldName} -> ${newName}`);
  }, []);

  const updateWorkflowName = useCallback((name: string) => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, name, workflow: { ...t.workflow, name }, isDirty: true }
          : t
      )
    );
  }, [activeTabId]);

  const markDirty = useCallback(() => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, isDirty: true } : t
      )
    );
  }, [activeTabId]);

  const saveWorkflow = useCallback(async () => {
    if (!activeTab) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, isLoading: true } : t
      )
    );
    try {
      if (activeTab.originalName && activeTab.name !== activeTab.originalName) {
        await api.renameWorkflow(activeTab.originalName, activeTab.name);
      }
      await api.saveWorkflow(activeTab.workflow);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, isLoading: false, isDirty: false, originalName: t.name } : t
        )
      );
      onSaveCallbackRef.current?.();
      logger.info(`Workflow saved: ${activeTab.workflow.name}`);
    } catch (e) {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, isLoading: false, error: e instanceof Error ? e.message : '保存失败' }
            : t
        )
      );
      logger.error(`Failed to save workflow: ${activeTab.workflow.name}`, e);
    }
  }, [activeTab, activeTabId]);

  const executeWorkflow = useCallback(async () => {
    if (!activeTab) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, isLoading: true, error: null } : t
      )
    );
    try {
      const { taskId } = await api.executeWorkflow(activeTab.workflow);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, isLoading: false, executionState: { taskId, status: 'running' as const, progress: { current: 0, total: 0, currentNode: null }, logs: [], result: null, error: null, failedNode: null } }
            : t
        )
      );
      logger.info(`Execution started, taskId: ${taskId}`);

      const pollInterval = setInterval(async () => {
        try {
          const state = await api.getExecutionStatus(taskId);
          setTabs((prev) =>
            prev.map((t) =>
              t.id === activeTabId && t.executionState?.taskId === taskId
                ? { ...t, executionState: { ...t.executionState, status: state.status as 'pending' | 'running' | 'done' | 'failed', progress: state.progress, logs: state.logs, result: state.result, error: state.error, failedNode: state.failedNode } }
                : t
            )
          );
          if (state.status === 'done' || state.status === 'failed') {
            clearInterval(pollInterval);
          }
        } catch (e) {
          logger.error(`Poll execution status failed: ${taskId}`, e);
        }
      }, 1000);
    } catch (e) {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, isLoading: false, error: e instanceof Error ? e.message : '执行失败' }
            : t
        )
      );
      logger.error(`Failed to execute workflow: ${activeTab.workflow.name}`, e);
    }
  }, [activeTab, activeTabId]);

  const stopExecution = useCallback(async () => {
    if (!activeTab?.executionState) return;
    try {
      await api.stopExecution(activeTab.executionState.taskId);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, executionState: { ...t.executionState!, status: 'done' as const } }
            : t
        )
      );
      logger.info(`Execution stopped: ${activeTab.executionState.taskId}`);
    } catch (e) {
      logger.error(`Failed to stop execution: ${activeTab.executionState.taskId}`, e);
    }
  }, [activeTab, activeTabId]);

  const selectNode = useCallback((nodeId: string | null) => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, selectedNodeId: nodeId } : t
      )
    );
  }, [activeTabId]);

  const updateNodeConfig = useCallback((nodeId: string, configValues: Record<string, unknown>) => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              isDirty: true,
              workflow: {
                ...t.workflow,
                nodes: t.workflow.nodes.map((n) =>
                  n.id === nodeId ? { ...n, configValues } : n
                ),
              },
            }
          : t
      )
    );
  }, [activeTabId]);

  const addNode = useCallback(
    (plugin: PluginDefinition, position: { x: number; y: number }, nodeId?: string) => {
      if (!activeTabId) return;
      const id = nodeId || `${plugin.id}_${Date.now()}`;
      const newNode: NodeData = {
        ...plugin,
        configValues: plugin.config.reduce(
          (acc, c) => ({ ...acc, [c.key]: c.default }),
          {}
        ),
      };
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                isDirty: true,
                selectedNodeId: id,
                workflow: {
                  ...t.workflow,
                  nodes: [
                    ...t.workflow.nodes,
                    { ...newNode, id, position },
                  ] as NodeData[],
                },
              }
            : t
        )
      );
      logger.info(`Node added: ${id} (${plugin.name})`);
    },
    [activeTabId]
  );

  const removeNode = useCallback((nodeId: string) => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              isDirty: true,
              selectedNodeId: t.selectedNodeId === nodeId ? null : t.selectedNodeId,
              workflow: {
                ...t.workflow,
                nodes: t.workflow.nodes.filter((n) => n.id !== nodeId),
                edges: t.workflow.edges.filter(
                  (e) => e.source !== nodeId && e.target !== nodeId
                ),
              },
            }
          : t
      )
    );
    logger.info(`Node removed: ${nodeId}`);
  }, [activeTabId]);

  const addEdge = useCallback((edge: EdgeData) => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              isDirty: true,
              workflow: {
                ...t.workflow,
                edges: [...t.workflow.edges, edge],
              },
            }
          : t
      )
    );
    logger.info(`Edge added: ${edge.id}`);
  }, [activeTabId]);

  const removeEdge = useCallback((edgeId: string) => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              isDirty: true,
              workflow: {
                ...t.workflow,
                edges: t.workflow.edges.filter((e) => e.id !== edgeId),
              },
            }
          : t
      )
    );
    logger.info(`Edge removed: ${edgeId}`);
  }, [activeTabId]);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              workflow: {
                ...t.workflow,
                nodes: t.workflow.nodes.map((n) =>
                  n.id === nodeId ? { ...n, position } : n
                ),
              },
            }
          : t
      )
    );
  }, [activeTabId]);

  return {
    tabs,
    activeTabId,
    activeWorkflow,
    activeSelectedNode,
    createNewTab,
    openTab,
    closeTab,
    selectTab,
    renameTab,
    renameTabByName,
    updateWorkflowName,
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
    markDirty,
    setOnSaveCallback: (callback: () => void) => { onSaveCallbackRef.current = callback; },
    setOnRenameCallback: (callback: (oldName: string, newName: string) => void) => { onRenameCallbackRef.current = callback; },
  };
}