import { useState, useRef, useEffect } from 'react';
import type { PluginDefinition } from '../types/api';
import * as api from '../services/api';

interface ToolboxProps {
  plugins: PluginDefinition[];
  workflowList: string[];
  onLoadWorkflow: (name: string) => void;
  onWorkflowListChange?: () => void;
  onRenameWorkflow: (oldName: string, newName: string) => void;
}

type TabType = 'tools' | 'workflows';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetName: string;
}

interface ConfirmDialogState {
  visible: boolean;
  message: string;
  onConfirm: () => void;
}

export function Toolbox({ plugins, workflowList, onLoadWorkflow, onWorkflowListChange, onRenameWorkflow }: ToolboxProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('tools');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetName: '',
  });
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    visible: false,
    message: '',
    onConfirm: () => {},
  });

  const categories = [...new Set(plugins.map((p) => p.category))];

  const onDragStart = (event: React.DragEvent, plugin: PluginDefinition) => {
    event.dataTransfer.setData('application/json', JSON.stringify(plugin));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleContextMenu = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(name);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetName: name,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleRename = (name: string) => {
    setRenaming(name);
    setRenameValue(name);
    closeContextMenu();
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const submitRename = async () => {
    if (!renaming || !renameValue.trim() || renameValue === renaming) {
      setRenaming(null);
      return;
    }

    try {
      const oldName = renaming;
      const newName = renameValue.trim();
      await api.renameWorkflow(oldName, newName);
      onRenameWorkflow(oldName, newName);
      setRenaming(null);
      onWorkflowListChange?.();
    } catch (e) {
      console.error('Rename failed:', e);
      setRenaming(null);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitRename();
    } else if (e.key === 'Escape') {
      setRenaming(null);
    }
  };

  const handleOpen = (name: string) => {
    closeContextMenu();
    onLoadWorkflow(name);
  };

  const handleDelete = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    e.preventDefault();
    setContextMenu({ ...contextMenu, visible: false });
    setConfirmDialog({
      visible: true,
      message: `确定要删除工作流 "${name}" 吗？`,
      onConfirm: async () => {
        try {
          await api.deleteWorkflow(name);
          onWorkflowListChange?.();
        } catch (err) {
          console.error('Delete failed:', err);
        }
      },
    });
  };

  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  if (collapsed) {
    return (
      <div
        style={{
          width: 40,
          height: '100%',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          style={{
            width: 28,
            height: 28,
            background: 'var(--bg-hover)',
            border: 'none',
            borderRadius: 4,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 16,
          }}
          title="展开工具箱"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <div
        style={{
          width: 48,
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
          gap: 8,
        }}
      >
        <button
          onClick={() => setActiveTab('tools')}
          style={{
            width: 36,
            height: 36,
            background: activeTab === 'tools' ? 'var(--accent-color)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            color: activeTab === 'tools' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="工具"
        >
          🔧
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          style={{
            width: 36,
            height: 36,
            background: activeTab === 'workflows' ? 'var(--accent-color)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            color: activeTab === 'workflows' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="工作流"
        >
          📁
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setCollapsed(true)}
          style={{
            width: 36,
            height: 36,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="折叠工具箱"
        >
          ◀
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 14 }}>
            {activeTab === 'tools' ? '工具' : '工作流'}
          </h3>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {activeTab === 'tools' && (
            <>
              {categories.map((category) => (
                <div key={category} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      marginBottom: 8,
                      textTransform: 'uppercase',
                      fontWeight: 500,
                    }}
                  >
                    {category}
                  </div>
                  {plugins
                    .filter((p) => p.category === category)
                    .map((plugin) => (
                      <div
                        key={plugin.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, plugin)}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: 6,
                          marginBottom: 4,
                          cursor: 'grab',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                        }}
                      >
                        {plugin.icon} {plugin.name}
                      </div>
                    ))}
                </div>
              ))}
            </>
          )}

          {activeTab === 'workflows' && (
            <div>
              {workflowList.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
                  暂无工作流
                </div>
              ) : (
                workflowList.map((name) => (
                  <div
                    key={name}
                    onClick={() => setSelectedFile(name)}
                    onDoubleClick={() => renaming === name ? undefined : onLoadWorkflow(name)}
                    onContextMenu={(e) => handleContextMenu(e, name)}
                    style={{
                      padding: '10px 12px',
                      background: selectedFile === name ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
                      borderRadius: 6,
                      marginBottom: 6,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      outline: selectedFile === name ? '2px solid var(--accent-color)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--accent-color)' }}>📁</span>
                    {renaming === name ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={submitRename}
                        onKeyDown={handleRenameKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          background: 'var(--bg-hover)',
                          border: '1px solid var(--accent-color)',
                          borderRadius: 4,
                          padding: '2px 8px',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                    ) : (
                      <span>{name}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: '4px 0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 1000,
            minWidth: 120,
          }}
        >
          <div
            onClick={() => handleOpen(contextMenu.targetName)}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            📂 打开
          </div>
          <div
            onClick={() => handleRename(contextMenu.targetName)}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            ✏️ 重命名
          </div>
          <div
            onClick={(e) => handleDelete(e, contextMenu.targetName)}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              color: 'var(--error-color)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            🗑️ 删除
          </div>
        </div>
      )}

      {confirmDialog.visible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setConfirmDialog({ ...confirmDialog, visible: false })}
        >
          <div
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: 24,
              minWidth: 300,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: 'var(--text-primary)', fontSize: 15, marginBottom: 20 }}>
              {confirmDialog.message}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, visible: false })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, visible: false });
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--error-color)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
