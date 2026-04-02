import { useCallback, useEffect, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { DynamicNode } from './DynamicNode';
import type { NodeData, EdgeData, PluginDefinition } from '../types/api';
import logger from '../utils/logger';

const nodeTypes = {
  dynamicNode: DynamicNode,
};

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'node' | 'pane';
  nodeId?: string;
}

interface WorkflowCanvasProps {
  nodes: NodeData[];
  edges: EdgeData[];
  selectedNodeId: string | null;
  onEdgesChange: (edges: EdgeData[]) => void;
  onSelectNode: (nodeId: string | null) => void;
  onAddNode: (node: Node) => void;
  onPositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onEdgeAdd?: (edge: EdgeData) => void;
  onSave?: () => void;
  plugins: PluginDefinition[];
}

export function WorkflowCanvas({
  nodes,
  edges,
  selectedNodeId,
  onEdgesChange,
  onSelectNode,
  onAddNode,
  onPositionChange,
  onDeleteNode,
  onDeleteEdge,
  onEdgeAdd,
  onSave,
  plugins,
}: WorkflowCanvasProps) {
  const reactFlowInstance = useReactFlow();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'pane',
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const clipboardRef = useRef<Node[]>([]);
  logger.debug('WorkflowCanvas rendered');

  const reactFlowNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    type: 'dynamicNode',
    position: n.position || { x: 0, y: 0 },
    data: n as unknown as Record<string, unknown>,
    selected: n.id === selectedNodeId,
  }));

  const reactFlowEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  }));

  const [rfNodes, setRfNodes, onNodesChangeHandler] = useNodesState(reactFlowNodes);
  const [rfEdges, setRfEdges, onEdgesChangeHandler] = useEdgesState(reactFlowEdges);

  useEffect(() => {
    const nodeIds = new Set(rfNodes.map(n => n.id));
    const newNodeIds = new Set(reactFlowNodes.map(n => n.id));
    const hasStructureChange = nodes.length !== rfNodes.length ||
      nodes.some(n => !nodeIds.has(n.id)) ||
      reactFlowNodes.some(n => !newNodeIds.has(n.id));

    if (hasStructureChange) {
      logger.debug('Syncing nodes to ReactFlow, structure changed');
      setRfNodes(reactFlowNodes);
    }
  }, [nodes.length, reactFlowNodes, rfNodes, setRfNodes]);

  useEffect(() => {
    const edgeIds = new Set(rfEdges.map(e => e.id));
    const newEdgeIds = new Set(reactFlowEdges.map(e => e.id));
    const hasStructureChange = edges.length !== rfEdges.length ||
      edges.some(e => !edgeIds.has(e.id)) ||
      reactFlowEdges.some(e => !newEdgeIds.has(e.id));

    if (hasStructureChange) {
      logger.debug('Syncing edges to ReactFlow');
      setRfEdges(reactFlowEdges);
    }
  }, [edges.length, reactFlowEdges, rfEdges, setRfEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      logger.debug(`Connect: ${connection.source} -> ${connection.target}`);
      const newEdge: EdgeData = {
        id: `e_${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle || '',
        targetHandle: connection.targetHandle || '',
      };
      setRfEdges((eds) => addEdge(connection, eds));
      if (onEdgeAdd) {
        onEdgeAdd(newEdge);
      }
      logger.info(`Edge created: ${newEdge.id}`);
    },
    [setRfEdges, onEdgeAdd]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const pluginJson = event.dataTransfer.getData('application/json');
      if (!pluginJson) return;

      const plugin: PluginDefinition = JSON.parse(pluginJson);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = `${plugin.id}_${Date.now()}`;
      logger.debug(`Drop: ${plugin.name} at (${position.x}, ${position.y})`);

      const newNode: Node = {
        id,
        type: 'dynamicNode',
        position,
        data: {
          ...plugin,
          type: plugin.id,
          configValues: plugin.config.reduce(
            (acc, c) => ({ ...acc, [c.key]: c.default }),
            {}
          ),
        },
      };

      setRfNodes((nds) => [...nds, newNode]);
      onAddNode(newNode);
      logger.info(`Node dropped: ${id} (${plugin.name})`);
    },
    [reactFlowInstance, onAddNode, setRfNodes]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeHandler(changes);

      const positionChanges = changes.filter(
        (c): c is Extract<NodeChange, { type: 'position' }> => c.type === 'position'
      );
      if (positionChanges.length > 0) {
        positionChanges.forEach((c) => {
          if (c.position) {
            logger.debug(`Node dragged: ${c.id} to (${c.position.x}, ${c.position.y})`);
            onPositionChange(c.id, c.position);
          }
        });
      }
    },
    [onNodesChangeHandler, onPositionChange]
  );

  const onSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length === 1) {
        logger.debug(`Node selected via flow: ${selectedNodes[0].id}`);
        onSelectNode(selectedNodes[0].id);
      } else {
        onSelectNode(null);
      }
    },
    [onSelectNode]
  );

  const onPaneClick = useCallback(() => {
    logger.debug('Pane clicked, deselecting');
    onSelectNode(null);
  }, [onSelectNode]);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, type: 'pane' });
  }, []);

  const handleDeleteNode = useCallback(() => {
    if (contextMenu.nodeId && onDeleteNode) {
      onDeleteNode(contextMenu.nodeId);
      logger.info(`Node deleted: ${contextMenu.nodeId}`);
    }
    closeContextMenu();
  }, [contextMenu.nodeId, onDeleteNode, closeContextMenu]);

  const onNodeContextMenu = useCallback((event: ReactMouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      nodeId: node.id,
    });
  }, []);

  const onPaneContextMenu = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: 'pane',
    });
  }, []);

  const onEdgeDoubleClick = useCallback((_event: ReactMouseEvent, edge: Edge) => {
    if (onDeleteEdge) {
      onDeleteEdge(edge.id);
      setRfEdges((eds) => eds.filter((e) => e.id !== edge.id));
      logger.info(`Edge deleted via double-click: ${edge.id}`);
    }
  }, [onDeleteEdge, setRfEdges]);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible, closeContextMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (onSave) {
          onSave();
          logger.info('Workflow saved via Ctrl+S');
        }
      }
      if (e.ctrlKey && e.key === 'c') {
        const selectedNodes = rfNodes.filter((n) => n.selected);
        if (selectedNodes.length > 0) {
          clipboardRef.current = selectedNodes.map((n) => ({
            ...n,
            id: `${n.id}_copy_${Date.now()}`,
          }));
          logger.info(`Copied ${selectedNodes.length} node(s) via Ctrl+C`);
        }
      }
      if (e.ctrlKey && e.key === 'v') {
        if (clipboardRef.current.length > 0) {
          const newNodes: Node[] = clipboardRef.current.map((n) => {
            const newNode: Node = {
              ...n,
              id: `${n.type || 'node'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              position: { x: n.position.x + 50, y: n.position.y + 50 },
              selected: false,
            };
            return newNode;
          });
          newNodes.forEach((n) => onAddNode(n));
          clipboardRef.current = newNodes;
          logger.info(`Pasted ${newNodes.length} node(s) via Ctrl+V`);
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = rfNodes.filter((n) => n.selected);
        selectedNodes.forEach((n) => {
          if (onDeleteNode) {
            onDeleteNode(n.id);
            logger.info(`Node deleted via Delete key: ${n.id}`);
          }
        });
        const selectedEdges = rfEdges.filter((edge) => edge.selected);
        selectedEdges.forEach((edge) => {
          if (onDeleteEdge) {
            onDeleteEdge(edge.id);
            setRfEdges((eds) => eds.filter((e) => e.id !== edge.id));
            logger.info(`Edge deleted via Delete key: ${edge.id}`);
          }
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onDeleteNode, onDeleteEdge, onAddNode, rfNodes, rfEdges, setRfEdges]);

  return (
    <div style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onSelectionChange={onSelectionChangeFunc}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu as unknown as (event: React.MouseEvent | MouseEvent, node: Node) => void}
        onPaneContextMenu={onPaneContextMenu as unknown as (event: React.MouseEvent | MouseEvent) => void}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        style={{ background: 'var(--bg-primary)' }}
      >
        <Background color="var(--border-color)" gap={20} />
        <Controls
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 8,
          }}
        />
        <MiniMap
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 8,
          }}
          maskColor="var(--bg-hover)"
        />
      </ReactFlow>

      {contextMenu.visible && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1001,
            background: '#2d2d30',
            border: '1px solid #3c3c40',
            borderRadius: 8,
            padding: '4px 0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            minWidth: 120,
            color: '#cccccc',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'node' && (
            <div
              style={{ padding: '8px 12px', cursor: 'pointer' }}
              onClick={handleDeleteNode}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#3c3c40')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              🗑️ 删除节点
            </div>
          )}
          {contextMenu.type === 'pane' && (
            <>
              <div
                style={{ padding: '8px 12px', cursor: 'pointer', position: 'relative' }}
                onMouseEnter={(e) => {
                  const submenu = e.currentTarget.querySelector('.submenu') as HTMLElement;
                  if (submenu) submenu.style.display = 'block';
                  e.currentTarget.style.background = '#3c3c40';
                }}
                onMouseLeave={(e) => {
                  const submenu = e.currentTarget.querySelector('.submenu') as HTMLElement;
                  if (submenu) submenu.style.display = 'none';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ➕ 插入节点 ▶
                <div
                  className="submenu"
                  style={{
                    display: 'none',
                    position: 'absolute',
                    left: '100%',
                    top: 0,
                    background: '#2d2d30',
                    border: '1px solid #3c3c40',
                    borderRadius: 8,
                    padding: '4px 0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    minWidth: 120,
                    color: '#cccccc',
                  }}
                >
                  {plugins.map((plugin) => (
                    <div
                      key={plugin.id}
                      style={{ padding: '8px 12px', cursor: 'pointer' }}
                      onClick={() => {
                        const position = reactFlowInstance.screenToFlowPosition({
                          x: contextMenu.x,
                          y: contextMenu.y,
                        });
                        const id = `${plugin.id}_${Date.now()}`;
                        const newNode: Node = {
                          id,
                          type: 'dynamicNode',
                          position,
                          data: {
                            ...plugin,
                            type: plugin.id,
                            configValues: plugin.config.reduce(
                              (acc, c) => ({ ...acc, [c.key]: c.default }),
                              {}
                            ),
                          },
                        };
                        onAddNode(newNode);
                        logger.info(`Node inserted: ${id} (${plugin.name})`);
                        closeContextMenu();
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#3c3c40')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {plugin.name}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}