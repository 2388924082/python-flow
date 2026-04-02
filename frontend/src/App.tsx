import { useEffect, useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { getNodes, listWorkflows } from './services/api';
import { useWorkflowTabs } from './hooks/useWorkflowTabs';
import { useResize } from './hooks/useResize';
import { Toolbox } from './components/Toolbox';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { ConfigPanel } from './components/ConfigPanel';
import { TopToolbar } from './components/TopToolbar';
import { StatusBar } from './components/StatusBar';
import { BottomPanel } from './components/BottomPanel';
import { WorkflowTabs } from './components/WorkflowTabs';
import { Layout } from './components/Layout';
import type { LogEntry } from './components/BottomPanel';
import type { PluginDefinition, EdgeData } from './types/api';
import logger from './utils/logger';

function WorkflowApp() {
  const [plugins, setPlugins] = useState<PluginDefinition[]>([]);
  const [workflowList, setWorkflowList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const toolboxResize = useResize({
    minSize: 150,
    maxSize: 400,
    initialSize: 220,
    direction: 'horizontal',
  });

  const configPanelResize = useResize({
    minSize: 200,
    maxSize: 500,
    initialSize: 300,
    direction: 'horizontal',
  });

  const bottomPanelResize = useResize({
    minSize: 80,
    maxSize: 400,
    initialSize: 150,
    direction: 'vertical',
  });

  const {
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
    saveWorkflow,
    executeWorkflow,
    stopExecution,
    selectNode,
    updateNodeConfig,
    addNode,
    removeNode,
    updateNodePosition,
    addEdge,
    removeEdge,
    setOnSaveCallback,
    setOnRenameCallback,
  } = useWorkflowTabs();

  const addLog = useCallback((
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    source: 'FE' | 'BE' = 'FE'
  ) => {
    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
      source,
      level,
      message,
    };
    setLogs(prev => [...prev, entry]);

    if (source === 'FE') {
      switch (level) {
        case 'debug': logger.debug(message); break;
        case 'info': logger.info(message); break;
        case 'warn': logger.warn(message); break;
        case 'error': logger.error(message); break;
      }
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    getNodes()
      .then(setPlugins)
      .catch((e) => {
        setError(e.message);
        addLog(`Failed to load plugins: ${e.message}`, 'error', 'FE');
      });
    listWorkflows()
      .then(setWorkflowList)
      .catch((e) => {
        setError(e.message);
        addLog(`Failed to load workflows: ${e.message}`, 'error', 'FE');
      });

    addLog('Application started', 'info', 'FE');
  }, [addLog]);

  useEffect(() => {
    setOnRenameCallback((oldName, newName) => {
      listWorkflows().then(setWorkflowList);
    });
  }, [setOnRenameCallback]);

  const handleSave = useCallback(() => {
    saveWorkflow().then(() => {
      listWorkflows().then(setWorkflowList);
      addLog(`Workflow saved: ${activeWorkflow?.name}`, 'info', 'FE');
    });
  }, [saveWorkflow, activeWorkflow?.name, addLog]);

  const handleEdgesChange = useCallback(
    (changes: unknown[]) => {
      for (const change of changes as { type: string; edge?: EdgeData; id?: string }[]) {
        if (change.type === 'add' && change.edge) {
          addEdge(change.edge);
        } else if (change.type === 'remove' && change.id) {
          removeEdge(change.id);
        }
      }
    },
    [addEdge, removeEdge]
  );

  const handleLoad = useCallback(
    (name: string) => {
      if (name) {
        openTab(name);
        addLog(`Workflow opened: ${name}`, 'info', 'FE');
      }
    },
    [openTab, addLog]
  );

  const handleRenameWorkflow = useCallback(
    (oldName: string, newName: string) => {
      renameTabByName(oldName, newName);
      listWorkflows().then(setWorkflowList);
    },
    [renameTabByName]
  );

  const handleNew = useCallback(() => {
    createNewTab();
    addLog('New workflow tab created', 'info', 'FE');
  }, [createNewTab, addLog]);

  const handleAddNode = useCallback(
    (node: { data: unknown; position: { x: number; y: number }; id: string }) => {
      addNode(node.data as unknown as PluginDefinition, node.position, node.id);
      addLog(`Node added: ${node.data && (node.data as { name?: string }).name || node.id}`, 'info', 'FE');
    },
    [addNode, addLog]
  );

  const handleTabClose = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isDirty) {
      if (!confirm(`"${tab.name}" 有未保存的更改，确定要关闭吗？`)) {
        return;
      }
    }
    closeTab(tabId);
  }, [tabs, closeTab]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <TopToolbar
        workflowName={activeWorkflow?.name || ''}
        workflowList={workflowList}
        executionState={activeTab?.executionState || null}
        isLoading={activeTab?.isLoading || false}
        onSave={handleSave}
        onLoad={handleLoad}
        onExecute={executeWorkflow}
        onStop={stopExecution}
        onNew={handleNew}
      />

      <Layout
        toolbox={<Toolbox plugins={plugins} workflowList={workflowList} onLoadWorkflow={handleLoad} onWorkflowListChange={() => listWorkflows().then(setWorkflowList)} onRenameWorkflow={handleRenameWorkflow} />}
        configPanel={
          <ConfigPanel
            node={activeSelectedNode}
            onUpdateConfig={(cv) => {
              if (activeSelectedNode) {
                updateNodeConfig(activeSelectedNode.id, cv);
              }
            }}
          />
        }
        canvas={
          activeWorkflow ? (
            <WorkflowCanvas
              nodes={activeWorkflow.nodes}
              edges={activeWorkflow.edges}
              selectedNodeId={activeTab?.selectedNodeId ?? null}
              onEdgesChange={handleEdgesChange}
              onSelectNode={selectNode}
              onAddNode={handleAddNode}
              onPositionChange={updateNodePosition}
              onDeleteNode={removeNode}
              onDeleteEdge={removeEdge}
              onEdgeAdd={addEdge}
              onSave={handleSave}
              plugins={plugins}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 16 }}>点击「新建」开始设计工作流</div>
              </div>
            </div>
          )
        }
        bottomPanel={<BottomPanel logs={logs} onClearLogs={clearLogs} />}
        toolboxResize={toolboxResize}
        configPanelResize={configPanelResize}
        bottomPanelResize={bottomPanelResize}
        tabBar={tabs.length > 0 ? (
          <WorkflowTabs
            tabs={tabs.map(t => ({ id: t.id, name: t.name, isDirty: t.isDirty }))}
            activeTabId={activeTabId}
            onTabSelect={selectTab}
            onTabClose={handleTabClose}
            onTabRename={renameTab}
          />
        ) : null}
      />

      <StatusBar
        executionState={activeTab?.executionState || null}
        error={activeTab?.error || error}
        onDismissError={() => setError(null)}
      />
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <WorkflowApp />
    </ReactFlowProvider>
  );
}

export default App;