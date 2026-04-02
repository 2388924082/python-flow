import { Handle, Position, type NodeProps } from '@xyflow/react';

export function DynamicNode({ data, selected }: NodeProps) {
  const nodeData = data as Record<string, unknown>;
  return (
    <div
      style={{
        border: selected ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
        borderRadius: 8,
        background: 'var(--bg-tertiary)',
        minWidth: 150,
        color: 'var(--text-primary)',
        fontSize: 14,
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          fontWeight: 500,
        }}
      >
        {String(nodeData.icon)} {String(nodeData.name)}
      </div>

      <div style={{ position: 'relative' }}>
        {(nodeData.inputs as Array<{ key: string; name: string }>)?.map((input) => (
          <Handle
            key={input.key}
            type="target"
            position={Position.Left}
            id={input.key}
            style={{
              top: '50%',
              background: 'var(--text-secondary)',
              width: 10,
              height: 10,
            }}
            title={input.name}
          />
        ))}

        <div style={{ padding: '8px 12px' }}>
          {(nodeData.config as Array<{ key: string; name: string; default: unknown }>)?.slice(0, 2).map((field) => (
            <div
              key={field.key}
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginTop: 4,
              }}
            >
              {field.name}: {String((nodeData.configValues as Record<string, unknown>)?.[field.key] ?? field.default)}
            </div>
          ))}
        </div>

        {(nodeData.outputs as Array<{ key: string; name: string }>)?.map((output) => (
          <Handle
            key={output.key}
            type="source"
            position={Position.Right}
            id={output.key}
            style={{
              top: '50%',
              background: 'var(--text-secondary)',
              width: 10,
              height: 10,
            }}
            title={output.name}
          />
        ))}
      </div>
    </div>
  );
}
