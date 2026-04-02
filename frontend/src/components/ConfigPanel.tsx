import { useState } from 'react';
import type { NodeData } from '../types/api';

interface ConfigPanelProps {
  node: NodeData | null;
  onUpdateConfig: (configValues: Record<string, unknown>) => void;
}

export function ConfigPanel({ node, onUpdateConfig }: ConfigPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleChange = (key: string, value: unknown) => {
    onUpdateConfig({ ...node!.configValues, [key]: value });
  };

  if (collapsed) {
    return (
      <div
        style={{
          width: 40,
          height: '100%',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
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
          title="展开配置面板"
        >
          ◀
        </button>
      </div>
    );
  }

  if (!node) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>配置</span>
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: 24,
              height: 24,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
            }}
            title="折叠配置面板"
          >
            ▶
          </button>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontSize: 13,
          }}
        >
          选择一个节点进行配置
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>
          {node.icon} {node.name}
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            width: 24,
            height: 24,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 12,
          }}
          title="折叠配置面板"
        >
          ▶
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 16 }}>
          {node.description}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', fontWeight: 500 }}>
            输入端口
          </div>
          {node.inputs.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>无</div>
          ) : (
            node.inputs.map((input) => (
              <div key={input.key} style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                → {input.name} ({input.type})
              </div>
            ))
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', fontWeight: 500 }}>
            输出端口
          </div>
          {node.outputs.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>无</div>
          ) : (
            node.outputs.map((output) => (
              <div key={output.key} style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                → {output.name} ({output.type})
              </div>
            ))
          )}
        </div>

        {node.config.length > 0 && (
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', fontWeight: 500 }}>
              配置项
            </div>
            {node.config.map((field) => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: 'block',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {field.name}
                </label>
                {field.type === 'string' && (
                  <input
                    type="text"
                    value={String(node.configValues?.[field.key] ?? field.default)}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                )}
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={Number(node.configValues?.[field.key] ?? field.default)}
                    onChange={(e) => handleChange(field.key, parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                )}
                {field.type === 'select' && (
                  <select
                    value={String(node.configValues?.[field.key] ?? field.default)}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
