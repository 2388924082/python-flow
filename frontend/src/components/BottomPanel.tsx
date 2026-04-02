import { useState, useRef, useEffect } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  source: 'FE' | 'BE';
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
}

function levelColor(level: string): string {
  switch (level) {
    case 'error': return 'var(--error-color)';
    case 'warn': return '#f59e0b';
    case 'info': return 'var(--text-primary)';
    case 'debug': return 'var(--text-secondary)';
    default: return 'var(--text-primary)';
  }
}

function sourceColor(source: string): string {
  return source === 'FE' ? '#c084fc' : 'var(--accent-color)';
}

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function LogPanel({ logs, onClear }: LogPanelProps) {
  const [filter, setFilter] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.level === filter);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const counts = {
    all: logs.length,
    debug: logs.filter(l => l.level === 'debug').length,
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 12px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'debug', 'info', 'warn', 'error'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              style={{
                padding: '2px 8px',
                background: filter === level ? 'var(--bg-hover)' : 'transparent',
                border: 'none',
                borderRadius: 4,
                color: level === 'all' ? 'var(--text-secondary)' : levelColor(level),
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {level.toUpperCase()} {counts[level] > 0 && `(${counts[level]})`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 11 }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            自动滚动
          </label>
          <button
            onClick={onClear}
            style={{
              padding: '2px 8px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              color: 'var(--text-secondary)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '4px 12px',
          fontFamily: 'ui-monospace, Consolas, monospace',
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', padding: 8 }}>暂无日志</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
              <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>[{log.timestamp}]</span>
              <span style={{ color: sourceColor(log.source), flexShrink: 0 }}>[{log.source}]</span>
              <span style={{ color: levelColor(log.level), flexShrink: 0 }}>
                {log.level.toUpperCase().padEnd(5)}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface TerminalPanelProps {
  content: string[];
}

export function TerminalPanel({ content }: TerminalPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '4px 12px',
        fontFamily: 'ui-monospace, Consolas, monospace',
        fontSize: 12,
        lineHeight: 1.6,
        background: 'var(--bg-primary)',
        color: 'var(--success-color)',
      }}
    >
      {content.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', padding: 8 }}>终端暂无输出（WebSocket 接入后可显示后端实时输出）</div>
      ) : (
        content.map((line, i) => (
          <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{line}</div>
        ))
      )}
    </div>
  );
}

interface ConsolePanelProps {
  logs: LogEntry[];
}

export function ConsolePanel({ logs }: ConsolePanelProps) {
  const feLogs = logs.filter(l => l.source === 'FE');

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '4px 12px' }}>
      {feLogs.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, padding: 8 }}>前端控制台日志将显示在这里</div>
      ) : (
        feLogs.map((log) => (
          <div key={log.id} style={{
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontSize: 12,
            color: levelColor(log.level),
            marginBottom: 2,
          }}>
            [{log.timestamp}] {log.level.toUpperCase()} {log.message}
          </div>
        ))
      )}
    </div>
  );
}

type TabType = 'logs' | 'terminal' | 'console';

interface BottomPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export function BottomPanel({ logs, onClearLogs }: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div
        style={{
          height: 32,
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {(['logs', 'terminal', 'console'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCollapsed(false); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
                padding: '2px 8px',
              }}
            >
              {tab === 'logs' ? '日志' : tab === 'terminal' ? '终端' : '控制台'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCollapsed(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 12,
          }}
          title="展开面板"
        >
          ▲
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        height: 150,
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          height: 32,
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {(['logs', 'terminal', 'console'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 12px',
                background: activeTab === tab ? 'var(--bg-hover)' : 'transparent',
                border: 'none',
                borderRadius: 4,
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {tab === 'logs' ? '日志' : tab === 'terminal' ? '终端' : '控制台'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 12,
          }}
          title="折叠面板"
        >
          ▼
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'logs' && <LogPanel logs={logs} onClear={onClearLogs} />}
        {activeTab === 'terminal' && <TerminalPanel content={[]} />}
        {activeTab === 'console' && <ConsolePanel logs={logs} />}
      </div>
    </div>
  );
}
