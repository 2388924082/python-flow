import type { ExecutionState } from '../types/api';

interface TopToolbarProps {
  workflowName: string;
  workflowList: string[];
  executionState: ExecutionState | null;
  isLoading: boolean;
  onSave: () => void;
  onLoad: (name: string) => void;
  onExecute: () => void;
  onStop: () => void;
  onNew: () => void;
}

export function TopToolbar({
  workflowName,
  workflowList,
  executionState,
  isLoading,
  onSave,
  onLoad,
  onExecute,
  onStop,
  onNew,
}: TopToolbarProps) {
  const isRunning = executionState?.status === 'running';

  return (
    <div
      style={{
        height: 50,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }}
    >
      <select
        value={workflowName}
        onChange={(e) => onLoad(e.target.value)}
        disabled={isRunning}
        style={{
          padding: '6px 12px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 4,
          color: 'var(--text-primary)',
          fontSize: 13,
          minWidth: 150,
        }}
      >
        <option value="">{workflowList.length === 0 ? '无工作流' : '选择工作流'}</option>
        {workflowList.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <button
        onClick={onNew}
        disabled={isRunning}
        style={{
          padding: '6px 12px',
          background: 'var(--bg-hover)',
          border: 'none',
          borderRadius: 4,
          color: 'var(--text-primary)',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        新建
      </button>

      <button
        onClick={onSave}
        disabled={isRunning || isLoading}
        style={{
          padding: '6px 12px',
          background: 'var(--accent-color)',
          border: 'none',
          borderRadius: 4,
          color: '#fff',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        保存
      </button>

      <button
        onClick={isRunning ? onStop : onExecute}
        disabled={isLoading}
        style={{
          padding: '6px 12px',
          background: isRunning ? 'var(--error-color)' : 'var(--success-color)',
          border: 'none',
          borderRadius: 4,
          color: '#fff',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {isRunning ? '停止' : isLoading ? '运行中...' : '运行'}
      </button>

      <div style={{ flex: 1 }} />

      <div
        style={{
          color: executionState ? 'var(--success-color)' : 'var(--text-secondary)',
          fontSize: 12,
        }}
      >
        {executionState
          ? `${executionState.progress.current}/${executionState.progress.total} - ${executionState.status}`
          : '就绪'}
      </div>
    </div>
  );
}
