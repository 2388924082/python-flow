import { useState, type MouseEvent } from 'react';

export interface TabData {
  id: string;
  name: string;
  isDirty: boolean;
}

interface WorkflowTabsProps {
  tabs: TabData[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabRename: (tabId: string, newName: string) => void;
}

export function WorkflowTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabRename,
}: WorkflowTabsProps) {
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleDoubleClick = (tab: TabData, e: MouseEvent) => {
    e.stopPropagation();
    setRenamingTabId(tab.id);
    setRenameValue(tab.name);
  };

  const handleRenameSubmit = () => {
    if (renamingTabId && renameValue.trim()) {
      onTabRename(renamingTabId, renameValue.trim());
    }
    setRenamingTabId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setRenamingTabId(null);
    }
  };

  const handleClose = (tabId: string, e: MouseEvent) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  return (
    <div
      style={{
        height: 36,
        background: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 8px',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 2,
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            onDoubleClick={(e) => handleDoubleClick(tab, e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: tab.id === activeTabId ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
              border: 'none',
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              borderTop: tab.id === activeTabId ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              minWidth: 100,
              maxWidth: 200,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {renamingTabId === tab.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleRenameKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                style={{
                  width: 80,
                  padding: '2px 4px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--accent-color)',
                  borderRadius: 3,
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            ) : (
              <>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tab.isDirty && <span style={{ color: 'var(--accent-color)', marginRight: 4 }}>●</span>}
                  {tab.name}
                </span>
                <button
                  onClick={(e) => handleClose(tab.id, e)}
                  style={{
                    padding: '2px 4px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 3,
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  ×
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
