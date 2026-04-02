import type { ExecutionState } from '../types/api';

interface StatusBarProps {
  executionState: ExecutionState | null;
  error: string | null;
  onDismissError: () => void;
}

export function StatusBar({ executionState, error }: StatusBarProps) {
  const getStatusText = () => {
    if (!executionState) return '● 就绪';
    switch (executionState.status) {
      case 'running':
        return `● 运行中 (${executionState.progress.current}/${executionState.progress.total})`;
      case 'done':
        return '● 完成';
      case 'failed':
        return '● 失败';
      default:
        return '● 就绪';
    }
  };

  const getLogSummary = () => {
    if (!executionState?.logs) return '';
    const total = executionState.logs.length;
    const errors = executionState.logs.filter(l => l.level === 'error').length;
    const warns = executionState.logs.filter(l => l.level === 'warning').length;
    if (errors > 0) return `${total}条日志 (${errors} ERROR)`;
    if (warns > 0) return `${total}条日志 (${warns} WARN)`;
    return `${total}条日志`;
  };

  return (
    <div
      style={{
        height: 24,
        minHeight: 24,
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        fontSize: 11,
        gap: 16,
        color: 'var(--text-secondary)',
      }}
    >
      {error ? (
        <span
          style={{
            color: 'var(--error-color)',
            cursor: 'pointer',
          }}
        >
          错误: {error}
        </span>
      ) : (
        <span style={{ color: 'var(--success-color)' }}>{getStatusText()}</span>
      )}

      <span>{getLogSummary()}</span>

      <div style={{ flex: 1 }} />

      <span>Workflow Orchestrator v1.0</span>
    </div>
  );
}
